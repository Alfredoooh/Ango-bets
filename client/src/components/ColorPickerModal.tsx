import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (color: string) => void;
  title?: string;
}

const PREDEFINED_COLORS = [
  "#000000", // Preto
  "#FFFFFF", // Branco
  "#FF0000", // Vermelho
  "#00FF00", // Verde
  "#0000FF", // Azul
  "#FFFF00", // Amarelo
  "#FF00FF", // Magenta
  "#00FFFF", // Ciano
  "#FFA500", // Laranja
  "#800080", // Roxo
  "#FFC0CB", // Rosa
  "#A52A2A", // Castanho
  "#808080", // Cinzento
  "#D3D3D3", // Cinzento claro
  "#4B0082", // Índigo
  "#FF4500", // Vermelho-laranja
];

export default function ColorPickerModal({
  open,
  onOpenChange,
  onSelect,
  title = "Selecionar Cor",
}: ColorPickerModalProps) {
  const [customColor, setCustomColor] = useState("#000000");

  const handleSelectColor = (color: string) => {
    onSelect(color);
    onOpenChange(false);
  };

  const handleCustomColor = () => {
    onSelect(customColor);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Predefined Colors */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Cores Predefinidas
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSelectColor(color)}
                  className="w-10 h-10 rounded border-2 border-border hover:border-primary transition-all hover:scale-110"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Cor Personalizada
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCustomColor} className="bg-primary">
            Aplicar Cor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
