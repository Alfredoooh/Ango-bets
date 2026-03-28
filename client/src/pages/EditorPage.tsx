import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import EditorToolbar from "@/components/EditorToolbar";
import DocumentEditor from "@/components/DocumentEditor";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import ColorPickerModal from "@/components/ColorPickerModal";
import { toast } from "sonner";
import { exportToPDF, exportToDocx, exportToTxt } from "@/lib/pdfExport";
import { MoreVertical, Save, Download, Share2, FilePlus, FolderOpen, FileText } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/* ══════════════════════════════════════════════════════════════════════
   APP ICON — uses the real SVG from public/icons/app_icon.svg
   Forced black/white (no orange) via CSS filter
══════════════════════════════════════════════════════════════════════ */
function DoctionIcon({ size = 28 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/icons/app_icon.svg"
        alt="Doction"
        width={size}
        height={size}
        style={{ display: "block", flexShrink: 0, filter: "invert(1) brightness(10)" }}
        onError={() => setOk(false)}
      />
    );
  }
  // Fallback: minimal white D
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#333" />
      <text x="16" y="23" fontFamily="Georgia,serif" fontWeight="900" fontSize="18" fill="#fff" textAnchor="middle">D</text>
    </svg>
  );
}

/* ── Arrow back icon ─────────────────────────────────────────────── */
function ArrowBackIcon({ size = 20 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/assets/icons/svg/arrow-back.svg"
        alt="Voltar"
        width={size}
        height={size}
        style={{ display: "block", flexShrink: 0, filter: "invert(1) brightness(.6)" }}
        onError={() => setOk(false)}
      />
    );
  }
  return <span style={{ fontSize: 18, color: "#666" }}>←</span>;
}

/* ── useIsMobile ─────────────────────────────────────────────────── */
function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 767);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

/* ══ APP MENU ⋮ ══════════════════════════════════════════════════ */
function AppMenu({
  onSave, onExportPDF, onExportDocx, onExportTxt, onShare, onNewDocument, onOpenDocument,
}: {
  onSave: () => void; onExportPDF: () => void; onExportDocx: () => void;
  onExportTxt: () => void; onShare: () => void; onNewDocument: () => void; onOpenDocument: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [open]);

  const items: ({ icon: React.ReactNode; label: string; kbd?: string; action: () => void } | null)[] = [
    { icon: <FilePlus size={15} />, label: "Novo documento", action: onNewDocument },
    { icon: <FolderOpen size={15} />, label: "Abrir documento", action: onOpenDocument },
    null,
    { icon: <Save size={15} />, label: "Guardar", kbd: "Ctrl+S", action: onSave },
    null,
    { icon: <Download size={15} />, label: "Exportar PDF", action: onExportPDF },
    { icon: <FileText size={15} />, label: "Exportar Word (.doc)", action: onExportDocx },
    { icon: <FileText size={15} />, label: "Exportar Texto (.txt)", action: onExportTxt },
    null,
    { icon: <Share2 size={15} />, label: "Partilhar", action: onShare },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 36, height: 36, borderRadius: 9, border: "none",
          background: open ? "rgba(255,255,255,.08)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#666", transition: "background 0.15s",
        }}
        title="Menu"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed", top: 52, right: 8, zIndex: 99999,
            background: "#1c1c1c", border: "1px solid #2e2e2e", borderRadius: 16,
            boxShadow: "0 4px 6px rgba(0,0,0,.3),0 16px 48px rgba(0,0,0,.6)",
            minWidth: 238, padding: "6px 0",
            animation: "menuIn 0.18s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          <style>{`@keyframes menuIn{from{opacity:0;transform:scale(.92) translateY(-8px)}to{opacity:1;transform:none}}`}</style>
          {items.map((item, i) =>
            item === null
              ? <div key={i} style={{ height: 1, background: "#262626", margin: "4px 6px" }} />
              : (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    width: "100%", padding: "10px 16px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "#ccc", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#252525")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ color: "#666", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.kbd && <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{item.kbd}</span>}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}

/* ══ EDITOR PAGE ══════════════════════════════════════════════════ */
export default function EditorPage() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const [documentName, setDocumentName] = useState("Documento sem título");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastModified, setLastModified] = useState("Agora");
  const [zoom, setZoom] = useState(100);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    setWordCount(text.split(/\s+/).filter(Boolean).length);
    setCharacterCount(text.length);
    setLastModified("Agora");
  }, [content]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ── handlers ── */
  const handleSave = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    const idx = docs.findIndex((d: any) => d.name === documentName);
    const entry = { name: documentName, content, lastModified: new Date().toLocaleString("pt-PT") };
    if (idx >= 0) docs[idx] = entry; else docs.push(entry);
    localStorage.setItem("documents", JSON.stringify(docs));
    toast.success("Documento guardado!");
  };
  const handleExportPDF = async () => {
    try { toast.info("A gerar PDF..."); await exportToPDF(documentName); toast.success("PDF exportado!"); }
    catch (e) { console.error(e); toast.error("Erro ao exportar PDF"); }
  };
  const handleExportDocx = () => { exportToDocx(documentName, content); toast.success("Word exportado!"); };
  const handleExportTxt = () => { exportToTxt(documentName, content); toast.success("Texto exportado!"); };
  const handleShare = () => toast.info("Partilha em desenvolvimento");
  const handleNewDocument = () => {
    if (content && !confirm("Descartar documento atual?")) return;
    setDocumentName("Documento sem título"); setContent("");
  };
  const handleOpenDocument = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    if (!docs.length) { toast.error("Nenhum documento guardado"); return; }
    const name = prompt("Documentos:\n" + docs.map((d: any) => d.name).join("\n") + "\n\nNome:");
    if (!name) return;
    const doc = docs.find((d: any) => d.name === name);
    if (doc) { setDocumentName(doc.name); setContent(doc.content); toast.success("Documento aberto!"); }
    else toast.error("Não encontrado");
  };
  const handleLinkInsert = (url: string, text: string) => {
    const sel = window.getSelection();
    if (sel?.toString()) exec("createLink", url);
    else exec("insertHTML", `<a href="${url}" target="_blank">${text || url}</a>`);
  };
  const handleImageInsert = (url: string) => exec("insertImage", url);
  const handleTableInsert = (rows: number, cols: number) => {
    let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++)
        html += r === 0
          ? `<th style="border:1px solid #333;padding:9px 12px;background:#1e1e1e;font-weight:600;text-align:left;font-size:.88rem;color:#ccc">Cabeçalho</th>`
          : `<td style="border:1px solid #333;padding:9px 12px;font-size:.88rem;color:#999">Célula</td>`;
      html += "</tr>";
    }
    exec("insertHTML", html + "</tbody></table><br>");
  };

  /* shared toolbar props */
  const tbProps = {
    onBold: () => exec("bold"),
    onItalic: () => exec("italic"),
    onUnderline: () => exec("underline"),
    onStrikethrough: () => exec("strikethrough"),
    onAlignLeft: () => exec("justifyLeft"),
    onAlignCenter: () => exec("justifyCenter"),
    onAlignRight: () => exec("justifyRight"),
    onAlignJustify: () => exec("justifyFull"),
    onBulletList: () => exec("insertUnorderedList"),
    onNumberedList: () => exec("insertOrderedList"),
    onLink: () => setLinkDialogOpen(true),
    onImage: () => setImageDialogOpen(true),
    onTable: () => setTableDialogOpen(true),
    onSave: handleSave,
    onUndo: () => exec("undo"),
    onRedo: () => exec("redo"),
    onNewDocument: handleNewDocument,
    onOpenDocument: handleOpenDocument,
    onDownload: handleExportDocx,
    onShare: handleShare,
    onHeading1: () => exec("formatBlock", "<h1>"),
    onHeading2: () => exec("formatBlock", "<h2>"),
    onHeading3: () => exec("formatBlock", "<h3>"),
    onCode: () => exec("formatBlock", "<pre>"),
    onQuote: () => exec("formatBlock", "<blockquote>"),
    onHighlight: () => setHighlightPickerOpen(true),
    onSuperscript: () => exec("superscript"),
    onSubscript: () => exec("subscript"),
    onClearFormatting: () => exec("removeFormat"),
    onExportPDF: handleExportPDF,
    onAddNote: () => {
      const note = prompt("Texto da nota:");
      if (note) exec("insertHTML", `<div style="background:#1e1e1e;border-left:4px solid #555;padding:12px 16px;margin:8px 0;border-radius:8px;color:#ccc"><strong>📝 Nota:</strong> ${note}</div>`);
    },
    onColorPicker: () => setColorPickerOpen(true),
    zoom,
    onZoomChange: setZoom,
  };

  /* ══════════ RENDER ══════════ */
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: "#141414",
      overflow: "hidden",
    }}>

      {/* ── APP BAR ── */}
      <div style={{
        height: 52,
        background: "#181818",
        borderBottom: "1px solid #242424",
        display: "flex", alignItems: "center",
        padding: "0 8px", gap: 4,
        flexShrink: 0, zIndex: 50,
        boxShadow: "0 1px 0 rgba(255,255,255,.03)",
      }}>
        {/* ← back */}
        <button
          onClick={() => setLocation("/home")}
          style={{
            width: 36, height: 36, borderRadius: 9, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#555", transition: "background 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          title="Voltar"
        >
          <ArrowBackIcon size={20} />
        </button>

        {/* App icon — real SVG, white/black only */}
        <DoctionIcon size={28} />

        {/* Title input */}
        <input
          value={documentName}
          onChange={e => setDocumentName(e.target.value)}
          onBlur={handleSave}
          style={{
            flex: 1, fontSize: 15, fontWeight: 600,
            color: "#e0e0e0", border: "none", outline: "none",
            background: "transparent", padding: "4px 6px",
            borderRadius: 7, minWidth: 0, transition: "background 0.15s",
          }}
          onFocus={e => (e.target.style.background = "rgba(255,255,255,.05)")}
          onBlurCapture={e => (e.target.style.background = "transparent")}
          title="Nome do documento"
        />

        {/* Word count */}
        <span style={{
          fontSize: 12, color: "#3a3a3a", flexShrink: 0,
          whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
          display: window.innerWidth < 400 ? "none" : "block",
        }}>
          {wordCount}p
        </span>

        {/* ⋮ */}
        <AppMenu
          onSave={handleSave}
          onExportPDF={handleExportPDF}
          onExportDocx={handleExportDocx}
          onExportTxt={handleExportTxt}
          onShare={handleShare}
          onNewDocument={handleNewDocument}
          onOpenDocument={handleOpenDocument}
        />
      </div>

      {/* ── DIALOGS ── */}
      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} onInsert={handleLinkInsert} />
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onInsert={handleTableInsert} />
      <ImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen} onOpenChange={setColorPickerOpen} onSelect={c => exec("foreColor", c)} title="Cor do texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={c => exec("hiliteColor", c)} title="Cor de realce" />

      {/* ── DESKTOP TOOLBAR ── */}
      {!isMobile && <EditorToolbar isMobile={false} {...tbProps} />}

      {/* ── MAIN AREA ── */}
      <div style={{
        flex: 1, display: "flex", overflow: "hidden",
        paddingBottom: isMobile ? 104 : 0,
      }}>
        <DocumentEditor
          content={content}
          onChange={setContent}
          zoom={zoom}
          onZoomChange={setZoom}
          isMobile={isMobile}
        />

        {/* Side panel — desktop only */}
        {!isMobile && (
          <div className="hidden lg:block">
            <SidePanel
              documentName={documentName}
              lastModified={lastModified}
              wordCount={wordCount}
              characterCount={characterCount}
              onDocumentNameChange={setDocumentName}
              onShare={handleShare}
            />
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM BAR ── */}
      {isMobile && <EditorToolbar isMobile={true} {...tbProps} />}
    </div>
  );
}
