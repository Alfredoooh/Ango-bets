import { useState, useEffect } from "react";
import { Table } from "lucide-react";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (rows: number, cols: number) => void;
}

export default function TableDialog({ open, onOpenChange, onInsert }: TableDialogProps) {
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");
  const [hover, setHover] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleInsert = () => {
    const r = parseInt(rows), c = parseInt(cols);
    if (r > 0 && c > 0) { onInsert(r, c); setRows("3"); setCols("3"); onOpenChange(false); }
  };

  const GRID = 8;

  return (
    <>
      <div onClick={() => onOpenChange(false)}
        style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,.35)", animation: "tblFadeIn .15s ease both" }} />
      <style>{`@keyframes tblFadeIn{from{opacity:0}to{opacity:1}} @keyframes tblIn{from{opacity:0;transform:scale(.93) translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 99991, background: "#fff", borderRadius: 18,
        boxShadow: "0 8px 48px rgba(0,0,0,.2)", padding: "20px 24px 20px",
        minWidth: 320, animation: "tblIn .2s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Table size={17} color="#1a1a1a" />
          </div>
          <span style={{ fontSize: ".95rem", fontWeight: 700, color: "#1a1a1a" }}>Inserir Tabela</span>
          <button onClick={() => onOpenChange(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Visual grid picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#888", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>
            {hover ? `${hover[0]} × ${hover[1]}` : "Selecionar tamanho"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID},1fr)`, gap: 3, width: "fit-content" }}>
            {Array.from({ length: GRID * GRID }).map((_, i) => {
              const r = Math.floor(i / GRID) + 1;
              const c = (i % GRID) + 1;
              const active = hover ? r <= hover[0] && c <= hover[1] : false;
              return (
                <div key={i}
                  onMouseEnter={() => setHover([r, c])}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => { onInsert(r, c); onOpenChange(false); }}
                  style={{
                    width: 22, height: 22, borderRadius: 4,
                    border: `1.5px solid ${active ? "#1a1a1a" : "#e0e0e0"}`,
                    background: active ? "#1a1a1a" : "#fafafa",
                    cursor: "pointer", transition: "all .08s",
                  }} />
              );
            })}
          </div>
        </div>

        {/* Manual input */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: ".72rem", fontWeight: 600, color: "#aaa", display: "block", marginBottom: 4 }}>LINHAS</label>
            <input type="number" min="1" max="20" value={rows} onChange={e => setRows(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e8e8e8", borderRadius: 9, fontSize: ".88rem", fontWeight: 600, outline: "none", textAlign: "center" }}
              onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", paddingTop: 18, color: "#ccc", fontSize: 18, fontWeight: 300 }}>×</div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: ".72rem", fontWeight: 600, color: "#aaa", display: "block", marginBottom: 4 }}>COLUNAS</label>
            <input type="number" min="1" max="20" value={cols} onChange={e => setCols(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e8e8e8", borderRadius: 9, fontSize: ".88rem", fontWeight: 600, outline: "none", textAlign: "center" }}
              onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => onOpenChange(false)}
            style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: ".84rem", fontWeight: 600, color: "#555" }}>
            Cancelar
          </button>
          <button onClick={handleInsert}
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#1a1a1a", cursor: "pointer", fontSize: ".84rem", fontWeight: 600, color: "#fff" }}>
            Inserir
          </button>
        </div>
      </div>
    </>
  );
}
