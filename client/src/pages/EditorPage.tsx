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
import {
  MoreVertical, Save, Download, Share2,
  FilePlus, FolderOpen, FileText, Moon, Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/* ── App Icon — imported from assets/icons/app-icon.svg ────────────── */
const AppIcon = ({ size = 32, dark = false }: { size?: number; dark?: boolean }) => (
  <img
    src="assets/icons/app_icon.svg"
    alt="Doction"
    width={size}
    height={size}
    style={{
      display: "block",
      flexShrink: 0,
      /* Adapts to dark/light — force black or white rendering */
      filter: dark ? "invert(0)" : "invert(1)",
    }}
  />
);

/* ── Arrow icon — from assets ────────────────────────────────────── */
const ArrowBackIcon = ({ size = 20, dark = false }: { size?: number; dark?: boolean }) => (
  <img
    src="/assets/icons/svg/arrow-back.svg"
    alt="Voltar"
    width={size}
    height={size}
    style={{
      display: "block",
      filter: dark ? "invert(0)" : "invert(1)",
    }}
  />
);

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

/* ── App Menu ⋮ ──────────────────────────────────────────────────── */
function AppMenu({
  onSave, onExportPDF, onExportDocx, onExportTxt, onShare, onNewDocument, onOpenDocument,
  isDark,
}: {
  onSave: () => void; onExportPDF: () => void; onExportDocx: () => void;
  onExportTxt: () => void; onShare: () => void; onNewDocument: () => void;
  onOpenDocument: () => void; isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, switchable } = useTheme();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [open]);

  const menuBg  = isDark ? "#1e1e1e" : "#ffffff";
  const menuBdr = isDark ? "#2c2c2c" : "#ebebeb";
  const itemClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const iconClr = isDark ? "#e0e0e0" : "#333";
  const hoverBg = isDark ? "rgba(255,255,255,.06)" : "#f5f5f5";

  const items: ({ icon: React.ReactNode; label: string; kbd?: string; action: () => void } | null)[] = [
    { icon: <FilePlus size={15} />,   label: "Novo documento",        action: onNewDocument },
    { icon: <FolderOpen size={15} />, label: "Abrir documento",       action: onOpenDocument },
    null,
    { icon: <Save size={15} />,       label: "Guardar",  kbd: "Ctrl+S", action: onSave },
    null,
    { icon: <Download size={15} />,   label: "Exportar PDF",          action: onExportPDF },
    { icon: <FileText size={15} />,   label: "Exportar Word (.doc)",  action: onExportDocx },
    { icon: <FileText size={15} />,   label: "Exportar Texto (.txt)", action: onExportTxt },
    null,
    { icon: <Share2 size={15} />,     label: "Partilhar",             action: onShare },
    ...(switchable
      ? [null, {
          icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />,
          label: theme === "dark" ? "Modo claro" : "Modo escuro",
          action: toggleTheme ?? (() => {}),
        }]
      : []),
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 36, height: 36, borderRadius: 9, border: "none",
          background: open
            ? (isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.07)")
            : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: isDark ? "#ccc" : "#555",
          transition: "background 0.15s",
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
            background: menuBg,
            border: `1px solid ${menuBdr}`,
            borderRadius: 16,
            boxShadow: isDark
              ? "0 4px 6px rgba(0,0,0,.2),0 20px 60px rgba(0,0,0,.5)"
              : "0 4px 6px rgba(0,0,0,.04),0 16px 48px rgba(0,0,0,.14)",
            minWidth: 238, padding: "6px 0",
            animation: "menuIn 0.18s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          <style>{`@keyframes menuIn{from{opacity:0;transform:scale(.92) translateY(-8px)}to{opacity:1;transform:none}}`}</style>
          {items.map((item, i) =>
            item === null
              ? <div key={i} style={{ height: 1, background: menuBdr, margin: "4px 6px" }} />
              : (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    width: "100%", padding: "10px 16px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: itemClr, textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ color: iconClr, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.kbd && <span style={{ fontSize: 11, color: isDark ? "#555" : "#c0c0c0", fontFamily: "monospace" }}>{item.kbd}</span>}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   EDITOR PAGE
══════════════════════════════════════════════════════════════════ */
export default function EditorPage() {
  const [, setLocation]  = useLocation();
  const isMobile         = useIsMobile();
  const { theme }        = useTheme();
  const isDark           = theme === "dark";

  const [documentName, setDocumentName]         = useState("Documento sem título");
  const [content, setContent]                   = useState("");
  const [wordCount, setWordCount]               = useState(0);
  const [characterCount, setCharacterCount]     = useState(0);
  const [lastModified, setLastModified]         = useState("Agora");
  const [zoom, setZoom]                         = useState(100);
  const [linkDialogOpen,      setLinkDialogOpen]      = useState(false);
  const [tableDialogOpen,     setTableDialogOpen]     = useState(false);
  const [imageDialogOpen,     setImageDialogOpen]     = useState(false);
  const [colorPickerOpen,     setColorPickerOpen]     = useState(false);
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

  /* ── Handlers ── */
  const handleSave = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    const idx  = docs.findIndex((d: any) => d.name === documentName);
    const entry = { name: documentName, content, lastModified: new Date().toLocaleString("pt-PT") };
    if (idx >= 0) docs[idx] = entry; else docs.push(entry);
    localStorage.setItem("documents", JSON.stringify(docs));
    toast.success("Documento guardado!");
  };
  const handleExportPDF = async () => {
    try { toast.info("A gerar PDF..."); await exportToPDF(documentName); toast.success("PDF exportado!"); }
    catch (e) { console.error(e); toast.error("Erro ao exportar PDF"); }
  };
  const handleExportDocx  = () => { exportToDocx(documentName, content); toast.success("Word exportado!"); };
  const handleExportTxt   = () => { exportToTxt(documentName, content);  toast.success("Texto exportado!"); };
  const handleShare       = () => toast.info("Partilha em desenvolvimento");
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
  const handleLinkInsert  = (url: string, text: string) => {
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
          ? `<th style="border:1px solid #ddd;padding:9px 12px;background:#fafafa;font-weight:600;text-align:left;font-size:.88rem">Cabeçalho</th>`
          : `<td style="border:1px solid #ddd;padding:9px 12px;font-size:.88rem">Célula</td>`;
      html += "</tr>";
    }
    exec("insertHTML", html + "</tbody></table><br>");
  };

  /* toolbar props */
  const tbProps = {
    onBold:            () => exec("bold"),
    onItalic:          () => exec("italic"),
    onUnderline:       () => exec("underline"),
    onStrikethrough:   () => exec("strikethrough"),
    onAlignLeft:       () => exec("justifyLeft"),
    onAlignCenter:     () => exec("justifyCenter"),
    onAlignRight:      () => exec("justifyRight"),
    onAlignJustify:    () => exec("justifyFull"),
    onBulletList:      () => exec("insertUnorderedList"),
    onNumberedList:    () => exec("insertOrderedList"),
    onLink:            () => setLinkDialogOpen(true),
    onImage:           () => setImageDialogOpen(true),
    onTable:           () => setTableDialogOpen(true),
    onSave:            handleSave,
    onUndo:            () => exec("undo"),
    onRedo:            () => exec("redo"),
    onNewDocument:     handleNewDocument,
    onOpenDocument:    handleOpenDocument,
    onDownload:        handleExportDocx,
    onShare:           handleShare,
    onHeading1:        () => exec("formatBlock", "<h1>"),
    onHeading2:        () => exec("formatBlock", "<h2>"),
    onHeading3:        () => exec("formatBlock", "<h3>"),
    onCode:            () => exec("formatBlock", "<pre>"),
    onQuote:           () => exec("formatBlock", "<blockquote>"),
    onHighlight:       () => setHighlightPickerOpen(true),
    onSuperscript:     () => exec("superscript"),
    onSubscript:       () => exec("subscript"),
    onClearFormatting: () => exec("removeFormat"),
    onExportPDF:       handleExportPDF,
    onAddNote: () => {
      const note = prompt("Texto da nota:");
      if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:8px"><strong>📝 Nota:</strong> ${note}</div>`);
    },
    onColorPicker: () => setColorPickerOpen(true),
  };

  /* colour tokens — dark/white only, no orange */
  const bg       = isDark ? "#141414" : "#ffffff";
  const appbarBg = isDark ? "#1c1c1c" : "#ffffff";
  const appbarBdr= isDark ? "#2a2a2a" : "#e8e8e8";
  const titleClr = isDark ? "#f0f0f0" : "#1a1a1a";
  const countClr = isDark ? "#555"    : "#aaa";
  const btnClr   = isDark ? "#aaa"    : "#444";
  const btnHover = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.05)";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: bg,
      overflow: "hidden",
    }}>

      {/* ── APP BAR ── */}
      <div style={{
        height: 52,
        background: appbarBg,
        borderBottom: `1px solid ${appbarBdr}`,
        display: "flex", alignItems: "center",
        padding: "0 8px", gap: 4,
        flexShrink: 0, zIndex: 50,
        boxShadow: isDark
          ? "0 1px 0 rgba(255,255,255,.03)"
          : "0 1px 4px rgba(0,0,0,.05)",
      }}>
        {/* ← back */}
        <button
          onClick={() => setLocation("/home")}
          style={{
            width: 36, height: 36, borderRadius: 9, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: btnClr, transition: "background 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          title="Voltar"
        >
          <ArrowBackIcon size={20} dark={isDark} />
        </button>

        {/* App icon — adapts black/white */}
        <AppIcon size={28} dark={isDark} />

        {/* Document title */}
        <input
          value={documentName}
          onChange={e => setDocumentName(e.target.value)}
          onBlur={handleSave}
          style={{
            flex: 1, fontSize: 15, fontWeight: 600,
            color: titleClr, border: "none", outline: "none",
            background: "transparent", padding: "4px 6px",
            borderRadius: 7, minWidth: 0, transition: "background 0.15s",
          }}
          onFocus={e => (e.target.style.background = isDark ? "rgba(255,255,255,.06)" : "#f5f5f5")}
          onBlurCapture={e => (e.target.style.background = "transparent")}
          title="Nome do documento"
        />

        {/* Word count */}
        <span style={{
          fontSize: 12, color: countClr, flexShrink: 0,
          whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
          display: window.innerWidth < 400 ? "none" : "block",
        }}>
          {wordCount}p
        </span>

        {/* ⋮ menu */}
        <AppMenu
          onSave={handleSave}
          onExportPDF={handleExportPDF}
          onExportDocx={handleExportDocx}
          onExportTxt={handleExportTxt}
          onShare={handleShare}
          onNewDocument={handleNewDocument}
          onOpenDocument={handleOpenDocument}
          isDark={isDark}
        />
      </div>

      {/* ── Dialogs ── */}
      <LinkDialog   open={linkDialogOpen}       onOpenChange={setLinkDialogOpen}       onInsert={handleLinkInsert} />
      <TableDialog  open={tableDialogOpen}      onOpenChange={setTableDialogOpen}      onInsert={handleTableInsert} />
      <ImageDialog  open={imageDialogOpen}      onOpenChange={setImageDialogOpen}      onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen}     onOpenChange={setColorPickerOpen}     onSelect={c => exec("foreColor", c)}   title="Cor do texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={c => exec("hiliteColor", c)} title="Cor de realce" />

      {/* ── Toolbar desktop ── */}
      {!isMobile && <EditorToolbar isMobile={false} {...tbProps} />}

      {/* ── Main area ── */}
      <div style={{
        flex: 1, display: "flex", overflow: "hidden",
        paddingBottom: isMobile ? 88 : 0,
      }}>
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder=""
          zoom={zoom}
          onZoomChange={setZoom}
          isMobile={isMobile}
        />

        {/* Side panel — desktop wide only */}
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

      {/* ── Bottom bar mobile ── */}
      {isMobile && <EditorToolbar isMobile={true} {...tbProps} />}

    </div>
  );
}
