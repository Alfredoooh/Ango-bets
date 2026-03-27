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
  ArrowLeft, MoreVertical, Save, Download, Share2,
  FilePlus, FolderOpen, FileText, Moon, Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/* ══════════════════════════════════════════════════════════════════════
   DOCTION ICON — cubo 3D laranja idêntico ao ícone real da app
   3 faces: frontal (#f26522), superior (#ff8440), direita (#c04d10)
   + painel branco + letra D laranja
══════════════════════════════════════════════════════════════════════ */
const DoctionIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block", flexShrink: 0 }}
  >
    {/* face frontal */}
    <rect x="6" y="30" width="82" height="82" rx="13" fill="#f26522" />
    {/* face superior */}
    <path d="M6 30 L26 10 L108 10 L88 30 Z" fill="#ff8440" />
    {/* face direita — mais escura para dar profundidade */}
    <path d="M88 30 L108 10 L108 76 L88 96 Z" fill="#c04d10" />
    {/* painel branco arredondado na face frontal */}
    <rect x="14" y="38" width="66" height="66" rx="8" fill="#ffffff" />
    {/* letra D laranja */}
    <text
      x="47" y="90"
      fontFamily="Georgia,'Times New Roman',serif"
      fontWeight="900"
      fontSize="50"
      fill="#f26522"
      textAnchor="middle"
    >D</text>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════
   HOOK — detecta mobile reactivamente (≤ 767 px)
══════════════════════════════════════════════════════════════════════ */
function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 767);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

/* ══════════════════════════════════════════════════════════════════════
   APP MENU  ⋮
══════════════════════════════════════════════════════════════════════ */
function AppMenu({
  onSave, onExportPDF, onExportDocx, onExportTxt, onShare, onNewDocument, onOpenDocument,
}: {
  onSave: () => void; onExportPDF: () => void; onExportDocx: () => void;
  onExportTxt: () => void; onShare: () => void; onNewDocument: () => void; onOpenDocument: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, switchable } = useTheme();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [open]);

  const items: ({ icon: React.ReactNode; label: string; kbd?: string; action: () => void } | null)[] = [
    { icon: <FilePlus size={15} />,  label: "Novo documento",        action: onNewDocument },
    { icon: <FolderOpen size={15} />, label: "Abrir documento",      action: onOpenDocument },
    null,
    { icon: <Save size={15} />,     label: "Guardar",   kbd: "Ctrl+S", action: onSave },
    null,
    { icon: <Download size={15} />, label: "Exportar PDF",           action: onExportPDF },
    { icon: <FileText size={15} />, label: "Exportar Word (.doc)",   action: onExportDocx },
    { icon: <FileText size={15} />, label: "Exportar Texto (.txt)",  action: onExportTxt },
    null,
    { icon: <Share2 size={15} />,   label: "Partilhar",              action: onShare },
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
          background: open ? "rgba(242,101,34,.10)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#f26522", transition: "background 0.15s",
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
            background: "#fff", border: "1px solid #ebebeb", borderRadius: 16,
            boxShadow: "0 4px 6px rgba(0,0,0,.04),0 16px 48px rgba(0,0,0,.14)",
            minWidth: 238, padding: "6px 0",
            animation: "menuIn 0.18s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          <style>{`@keyframes menuIn{from{opacity:0;transform:scale(.92) translateY(-8px)}to{opacity:1;transform:none}}`}</style>
          {items.map((item, i) =>
            item === null
              ? <div key={i} style={{ height: 1, background: "#f2f2f2", margin: "4px 6px" }} />
              : (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    width: "100%", padding: "10px 16px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "#1a1a1a", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fdf5f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ color: "#f26522", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.kbd && <span style={{ fontSize: 11, color: "#c0c0c0", fontFamily: "monospace" }}>{item.kbd}</span>}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TOOLBAR PROPS — partilhados entre mobile e desktop
══════════════════════════════════════════════════════════════════════ */
function useToolbarProps(
  exec: (cmd: string, val?: string) => boolean,
  {
    onSave, onExportPDF, onExportDocx, onShare,
    onNewDocument, onOpenDocument,
    setLinkDialogOpen, setImageDialogOpen, setTableDialogOpen,
    setColorPickerOpen, setHighlightPickerOpen,
  }: any
) {
  return {
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
    onSave,
    onUndo:            () => exec("undo"),
    onRedo:            () => exec("redo"),
    onNewDocument,
    onOpenDocument,
    onDownload:        onExportDocx,
    onShare,
    onHeading1:        () => exec("formatBlock", "<h1>"),
    onHeading2:        () => exec("formatBlock", "<h2>"),
    onHeading3:        () => exec("formatBlock", "<h3>"),
    onCode:            () => exec("formatBlock", "<pre>"),
    onQuote:           () => exec("formatBlock", "<blockquote>"),
    onHighlight:       () => setHighlightPickerOpen(true),
    onSuperscript:     () => exec("superscript"),
    onSubscript:       () => exec("subscript"),
    onClearFormatting: () => exec("removeFormat"),
    onExportPDF,
    onAddNote: () => {
      const note = prompt("Texto da nota:");
      if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:8px"><strong>📝 Nota:</strong> ${note}</div>`);
    },
    onColorPicker: () => setColorPickerOpen(true),
  };
}

/* ══════════════════════════════════════════════════════════════════════
   EDITOR PAGE — componente principal
══════════════════════════════════════════════════════════════════════ */
export default function EditorPage() {
  const [, setLocation]      = useLocation();
  const isMobile             = useIsMobile();
  const { theme }            = useTheme();
  const isDark               = theme === "dark";

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

  /* contagem */
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    setWordCount(text.split(/\s+/).filter(Boolean).length);
    setCharacterCount(text.length);
    setLastModified("Agora");
  }, [content]);

  /* Ctrl+S */
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
  const handleShare        = () => toast.info("Partilha em desenvolvimento");
  const handleNewDocument  = () => {
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

  /* toolbar props reutilizáveis */
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

  /* tokens de cor */
  const bg        = isDark ? "#141414" : "#f5f4f2";
  const appbarBg  = isDark ? "#1c1c1c" : "#ffffff";
  const appbarBdr = isDark ? "#2a2a2a" : "#ebebeb";
  const titleClr  = isDark ? "#f0f0f0" : "#1a1a1a";
  const countClr  = isDark ? "#666"    : "#aaa";

  /* ══════════ RENDER ══════════ */
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
          ? "0 1px 0 rgba(255,255,255,.04)"
          : "0 1px 4px rgba(0,0,0,.06)",
      }}>
        {/* ← */}
        <button
          onClick={() => setLocation("/home")}
          style={{
            width: 36, height: 36, borderRadius: 9, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#f26522", transition: "background 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(242,101,34,.12)" : "#fdf1ea")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </button>

        {/* ícone cubo 3D — SEM <img>, SVG inline directo */}
        <DoctionIcon size={32} />

        {/* título */}
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

        {/* palavras */}
        <span style={{
          fontSize: 12, color: countClr, flexShrink: 0,
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
      <LinkDialog   open={linkDialogOpen}       onOpenChange={setLinkDialogOpen}       onInsert={handleLinkInsert} />
      <TableDialog  open={tableDialogOpen}      onOpenChange={setTableDialogOpen}      onInsert={handleTableInsert} />
      <ImageDialog  open={imageDialogOpen}      onOpenChange={setImageDialogOpen}      onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen}     onOpenChange={setColorPickerOpen}     onSelect={c => exec("foreColor", c)}   title="Cor do texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={c => exec("hiliteColor", c)} title="Cor de realce" />

      {/* ── TOOLBAR DESKTOP (topo, apenas ≥ 768 px) ── */}
      {!isMobile && <EditorToolbar isMobile={false} {...tbProps} />}

      {/* ── ÁREA PRINCIPAL ── */}
      <div style={{
        flex: 1, display: "flex", overflow: "hidden",
        /* espaço em baixo no mobile para a bottom bar não cobrir o conteúdo */
        paddingBottom: isMobile ? 88 : 0,
      }}>
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder="Comece a escrever o seu documento aqui..."
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* painel lateral — só desktop largo */}
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

      {/* ── BOTTOM BAR MOBILE (fixo em baixo, só ≤ 767 px) ── */}
      {isMobile && <EditorToolbar isMobile={true} {...tbProps} />}

    </div>
  );
}
