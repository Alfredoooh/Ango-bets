import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Plus, Trash2, Download, Type, Square, Circle } from "lucide-react";
import { toast } from "sonner";

interface DesignElement {
  id: string;
  type: "text" | "rectangle" | "circle" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  fontSize?: number;
}

export default function DesignStudio() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Design sem título");
  const [zoom, setZoom] = useState(100);

  // Canvas dimensions (A4 size)
  const CANVAS_WIDTH = 794;
  const CANVAS_HEIGHT = 1123;

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw border
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw elements
    elements.forEach((element) => {
      const isSelected = element.id === selectedElement;

      if (element.type === "rectangle") {
        ctx.fillStyle = element.color || "#3b82f6";
        ctx.fillRect(element.x, element.y, element.width, element.height);

        if (isSelected) {
          ctx.strokeStyle = "#ff6b6b";
          ctx.lineWidth = 2;
          ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
      } else if (element.type === "circle") {
        ctx.fillStyle = element.color || "#3b82f6";
        ctx.beginPath();
        ctx.arc(
          element.x + element.width / 2,
          element.y + element.height / 2,
          element.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ff6b6b";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (element.type === "text") {
        ctx.fillStyle = element.color || "#000000";
        ctx.font = `${element.fontSize || 16}px Arial`;
        ctx.fillText(element.content || "Texto", element.x, element.y);

        if (isSelected) {
          ctx.strokeStyle = "#ff6b6b";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            element.x - 5,
            element.y - element.fontSize! + 5,
            element.width,
            element.height
          );
        }
      }
    });
  }, [elements, selectedElement]);

  const addElement = (type: DesignElement["type"]) => {
    const newElement: DesignElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      content: type === "text" ? "Novo Texto" : undefined,
      color: "#3b82f6",
      fontSize: type === "text" ? 16 : undefined,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast.success("Elemento adicionado");
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
    toast.success("Elemento removido");
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    // Check if clicked on an element
    let clickedElement: DesignElement | undefined;
    for (const element of [...elements].reverse()) {
      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        clickedElement = element;
        break;
      }
    }

    setSelectedElement(clickedElement?.id || null);
  };

  const downloadDesign = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${designName}.png`;
    link.click();
    toast.success("Design transferido!");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="h-12 px-4 bg-secondary/30 border-b border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar
        </Button>
        <span className="text-sm text-muted-foreground">{designName}</span>
      </div>

      {/* Toolbar */}
      <div className="h-12 px-4 bg-secondary/20 border-b border-border flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addElement("text")}
          className="gap-2"
        >
          <Type className="w-4 h-4" />
          Texto
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addElement("rectangle")}
          className="gap-2"
        >
          <Square className="w-4 h-4" />
          Retângulo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addElement("circle")}
          className="gap-2"
        >
          <Circle className="w-4 h-4" />
          Círculo
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={downloadDesign}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Transferir
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/20 p-8">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center",
              cursor: "crosshair",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            }}
            className="border border-border rounded"
          />
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-secondary/30 border-l border-border p-4 overflow-y-auto space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nome do Design
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Zoom</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="25"
                max="200"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{zoom}%</span>
            </div>
          </div>

          {selectedElement && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold">Elemento Selecionado</h3>

              {elements
                .find((el) => el.id === selectedElement)
                ?.type === "text" && (
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Conteúdo
                  </label>
                  <input
                    type="text"
                    value={
                      elements.find((el) => el.id === selectedElement)
                        ?.content || ""
                    }
                    onChange={(e) =>
                      updateElement(selectedElement, { content: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-border rounded text-xs"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-1 block">Cor</label>
                <input
                  type="color"
                  value={
                    elements.find((el) => el.id === selectedElement)?.color ||
                    "#3b82f6"
                  }
                  onChange={(e) =>
                    updateElement(selectedElement, { color: e.target.value })
                  }
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteElement(selectedElement)}
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t border-border">
            <p className="font-medium mb-2">Elementos ({elements.length})</p>
            <div className="space-y-1">
              {elements.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`block w-full text-left px-2 py-1 rounded text-xs ${
                    selectedElement === el.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  {el.type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
