import { useState, useEffect } from "react";
import { Link } from "lucide-react";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, text: string) => void;
}

export default function LinkDialog({ open, onOpenChange, onInsert }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleInsert = () => {
    if (!url) return;
    onInsert(url, text || url);
    setUrl(""); setText("");
    onOpenChange(false);
  };

  return (
    <>
      <div onClick={() => onOpenChange(false)}
        style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,.35)", animation: "lnkFadeIn .15s ease both" }} />
      <style>{`@keyframes lnkFadeIn{from{opacity:0}to{opacity:1}} @keyframes lnkIn{from{opacity:0;transform:scale(.93) translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 99991, background: "#fff", borderRadius: 18,
        boxShadow: "0 8px 48px rgba(0,0,0,.2)", padding: "20px 24px 20px",
        minWidth: 340, animation: "lnkIn .2s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link size={17} color="#1a1a1a" />
          </div>
          <span style={{ fontSize: ".95rem", fontWeight: 700, color: "#1a1a1a" }}>Inserir Ligação</span>
          <button onClick={() => onOpenChange(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#888", letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Texto a mostrar</label>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Texto da ligação"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: ".86rem", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
          <div>
            <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#888", letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://exemplo.com"
              onKeyDown={e => e.key === "Enter" && handleInsert()}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: ".86rem", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => onOpenChange(false)}
            style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: ".84rem", fontWeight: 600, color: "#555" }}>
            Cancelar
          </button>
          <button onClick={handleInsert} disabled={!url}
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: url ? "#1a1a1a" : "#e0e0e0", cursor: url ? "pointer" : "not-allowed", fontSize: ".84rem", fontWeight: 600, color: url ? "#fff" : "#aaa" }}>
            Inserir
          </button>
        </div>
      </div>
    </>
  );
}
