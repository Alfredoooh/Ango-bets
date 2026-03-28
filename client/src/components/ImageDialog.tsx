import { useState, useEffect } from "react";
import { Image, Link, Upload } from "lucide-react";

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}

export default function ImageDialog({ open, onOpenChange, onInsert }: ImageDialogProps) {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleUrl = () => {
    if (!url) return;
    onInsert(url); setUrl(""); onOpenChange(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { onInsert(ev.target?.result as string); onOpenChange(false); };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div onClick={() => onOpenChange(false)}
        style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,.35)", animation: "imgFadeIn .15s ease both" }} />
      <style>{`@keyframes imgFadeIn{from{opacity:0}to{opacity:1}} @keyframes imgIn{from{opacity:0;transform:scale(.93) translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 99991, background: "#fff", borderRadius: 18,
        boxShadow: "0 8px 48px rgba(0,0,0,.2)", padding: "20px 24px 20px",
        minWidth: 340, animation: "imgIn .2s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image size={17} color="#1a1a1a" />
          </div>
          <span style={{ fontSize: ".95rem", fontWeight: 700, color: "#1a1a1a" }}>Inserir Imagem</span>
          <button onClick={() => onOpenChange(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* iOS-style tabs */}
        <div style={{ display: "flex", background: "#f2f2f2", borderRadius: 10, padding: 2, marginBottom: 16 }}>
          {(["url", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, height: 32, borderRadius: 8, border: "none",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#1a1a1a" : "#888",
                fontSize: ".76rem", fontWeight: 600, cursor: "pointer",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,.12)" : "none",
                transition: "all .16s",
              }}>
              {t === "url" ? "URL" : "Carregar"}
            </button>
          ))}
        </div>

        {tab === "url" ? (
          <div>
            <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#888", letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Endereço URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg"
              onKeyDown={e => e.key === "Enter" && handleUrl()}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: ".86rem", outline: "none", marginBottom: 16 }}
              onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => onOpenChange(false)}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: ".84rem", fontWeight: 600, color: "#555" }}>
                Cancelar
              </button>
              <button onClick={handleUrl} disabled={!url}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: url ? "#1a1a1a" : "#e0e0e0", cursor: url ? "pointer" : "not-allowed", fontSize: ".84rem", fontWeight: 600, color: url ? "#fff" : "#aaa" }}>
                Inserir
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "28px 20px", border: "2px dashed #e0e0e0", borderRadius: 12,
              cursor: "pointer", color: "#aaa", fontSize: ".84rem", marginBottom: 16,
              transition: "border-color .12s, background .12s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e0e0e0"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Upload size={24} style={{ opacity: .4 }} />
              <span>Clique para escolher uma imagem</span>
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onOpenChange(false)}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: ".84rem", fontWeight: 600, color: "#555" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
