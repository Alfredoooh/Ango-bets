import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (rows: number, cols: number) => void;
}

export default function TableDialog({
  open,
  onOpenChange,
  onInsert,
}: TableDialogProps) {
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");

  const handleInsert = () => {
    const rowCount = parseInt(rows);
    const colCount = parseInt(cols);
    if (rowCount > 0 && colCount > 0) {
      onInsert(rowCount, colCount);
      setRows("3");
      setCols("3");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inserir Tabela</DialogTitle>
          <DialogDescription>
            Especifique o número de linhas e colunas
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rows" className="text-right">
              Linhas
            </Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cols" className="text-right">
              Colunas
            </Label>
            <Input
              id="cols"
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" onClick={handleInsert}>
            Inserir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
