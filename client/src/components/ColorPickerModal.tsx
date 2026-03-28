import { useState, useEffect } from "react";

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (color: string) => void;
  title?: string;
}

const COLORS = [
  "#000000","#1a1a2e","#374151","#6b7280","#9ca3af","#d1d5db","#e5e7eb","#ffffff",
  "#dc2626","#ea580c","#d97706","#ca8a04","#65a30d","#16a34a","#059669","#0d9488",
  "#0891b2","#0284c7","#2563eb","#4f46e5","#7c3aed","#9333ea","#c026d3","#db2777",
  "#fca5a5","#fdba74","#fcd34d","#86efac","#6ee7b7","#93c5fd","#c4b5fd","#f9a8d4",
];

export default function ColorPickerModal({ open, onOpenChange, onSelect, title = "Selecionar Cor" }: ColorPickerModalProps) {
  const [custom, setCustom] = useState("#000000");

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      <div onClick={() => onOpenChange(false)}
        style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,.35)", animation: "fadeInOverlay .15s ease both" }} />
      <style>{`@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}} @keyframes modalIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 99991, background: "#fff", borderRadius: 18,
        boxShadow: "0 8px 48px rgba(0,0,0,.2)", padding: "20px 20px 16px",
        minWidth: 280, animation: "modalIn .2s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: ".92rem", fontWeight: 700, color: "#1a1a1a" }}>{title}</span>
          <button onClick={() => onOpenChange(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 20, lineHeight: 1, padding: "0 2px" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 6, marginBottom: 14 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => { onSelect(c); onOpenChange(false); }}
              title={c}
              style={{
                width: 28, height: 28, borderRadius: 7, border: c === "#ffffff" ? "1.5px solid #e0e0e0" : "2px solid rgba(255,255,255,.5)",
                background: c, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                transition: "transform .1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            />
          ))}
        </div>
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: ".75rem", color: "#aaa" }}>Personalizado</span>
          <input type="color" value={custom} onChange={e => setCustom(e.target.value)}
            style={{ width: 36, height: 30, border: "1.5px solid #e0e0e0", borderRadius: 8, cursor: "pointer", padding: 2 }} />
          <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: ".8rem", fontFamily: "monospace", outline: "none" }} />
          <button onClick={() => { onSelect(custom); onOpenChange(false); }}
            style={{ padding: "6px 14px", borderRadius: 9, border: "none", background: "#1a1a1a", color: "#fff", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}>
            OK
          </button>
        </div>
      </div>
    </>
  );
}
