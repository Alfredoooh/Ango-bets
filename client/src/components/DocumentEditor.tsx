import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Lock, Unlock } from "lucide-react";

interface DocumentEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

const CHARS_PER_PAGE = 300; // Aproximadamente 300 caracteres por página A4

export default function DocumentEditor({
  content = "",
  onChange,
  placeholder = "Comece a escrever o seu documento...",
  zoom: externalZoom,
  onZoomChange,
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [zoom, setZoom] = useState(externalZoom || 100);
  const [zoomLocked, setZoomLocked] = useState(false);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Calcular número de páginas
  useEffect(() => {
    if (content) {
      const textContent = content.replace(/<[^>]*>/g, "").trim();
      const pageCount = Math.max(1, Math.ceil(textContent.length / CHARS_PER_PAGE));
      setPages(pageCount);
    }
  }, [content]);

  // Ajustar zoom para responsividade
  useEffect(() => {
    if (!zoomLocked && containerRef.current && !externalZoom) {
      const containerWidth = containerRef.current.clientWidth;
      const pageWidth = 834; // 794px + 40px padding
      const newZoom = Math.max(25, Math.min(200, (containerWidth / pageWidth) * 100));
      setZoom(newZoom);
      onZoomChange?.(newZoom);
    }
  }, [externalZoom, onZoomChange, zoomLocked]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }

    if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      document.execCommand("bold");
    }

    if (e.ctrlKey && e.key === "i") {
      e.preventDefault();
      document.execCommand("italic");
    }

    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      document.execCommand("underline");
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "+") {
      e.preventDefault();
      const newZoom = Math.min(200, zoom + 10);
      setZoom(newZoom);
      onZoomChange?.(newZoom);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      const newZoom = Math.max(25, zoom - 10);
      setZoom(newZoom);
      onZoomChange?.(newZoom);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      setZoom(100);
      onZoomChange?.(100);
    }
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    onZoomChange?.(value);
  };

  const toggleZoomLock = () => {
    setZoomLocked(!zoomLocked);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden bg-muted/20"
    >
      {/* Zoom Controls */}
      <div className="h-12 px-4 bg-secondary/30 border-b border-border flex items-center justify-between text-xs text-muted-foreground gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange(Math.max(25, zoom - 10))}
            title="Zoom Out (Ctrl+-)"
            className="gap-1"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <input
            type="range"
            min="25"
            max="200"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-32"
            title="Zoom (25% - 200%)"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange(Math.min(200, zoom + 10))}
            title="Zoom In (Ctrl++)"
            className="gap-1"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="w-12 text-right font-semibold">{Math.round(zoom)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange(100)}
            className="text-xs"
            title="Reset Zoom (Ctrl+0)"
          >
            Reset
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant={zoomLocked ? "default" : "ghost"}
            size="sm"
            onClick={toggleZoomLock}
            title={zoomLocked ? "Desbloquear zoom" : "Bloquear zoom"}
            className="gap-1"
          >
            {zoomLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>
        <span className="text-xs">
          {pages} página{pages > 1 ? "s" : ""} • {Math.round(zoom)}%
        </span>
      </div>

      {/* Page Container */}
      <div className="flex-1 overflow-auto p-5 flex justify-center">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease",
          }}
        >
          {/* Render multiple pages */}
          {Array.from({ length: pages }).map((_, pageIndex) => (
            <div key={pageIndex} className="mb-8">
              {/* Document Page - A4 Size: 794px × 1123px */}
              <div
                className="bg-white rounded-sm shadow-2xl"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  padding: "94px",
                  boxShadow:
                    "0 1px 6px rgba(0,0,0,.2), 0 4px 20px rgba(0,0,0,.12)",
                }}
              >
                {pageIndex === 0 ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                      w-full min-h-full focus:outline-none
                      text-foreground text-base leading-relaxed
                      font-serif
                      [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:font-sans
                      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:font-sans
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:font-sans
                      [&_p]:mb-4 [&_p]:text-base
                      [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                      [&_li]:mb-2
                      [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:mb-4 [&_blockquote]:text-gray-600
                      [&_code]:bg-secondary [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                      [&_pre]:bg-secondary [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:font-mono
                      [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4
                      [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-secondary [&_th]:text-left [&_th]:font-semibold
                      [&_td]:border [&_td]:border-border [&_td]:p-2
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-4
                    `}
                    data-placeholder={placeholder}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Página {pageIndex + 1}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 px-4 bg-secondary/30 border-t border-border flex items-center text-xs text-muted-foreground gap-4">
        <span>Pronto</span>
        <span>•</span>
        <span>Página 1 de {pages}</span>
        <span>•</span>
        <span>{zoomLocked ? "🔒" : "🔓"} {Math.round(zoom)}% zoom</span>
      </div>
    </div>
  );
}
