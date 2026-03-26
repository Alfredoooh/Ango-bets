import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import EditorToolbar from "@/components/EditorToolbar";
import DocumentEditor from "@/components/DocumentEditor";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import { toast } from "sonner";
import { exportToPDF, exportToDocx, exportToTxt, exportToRtf } from "@/lib/pdfExport";
import ColorPickerModal from "@/components/ColorPickerModal";

// SVG icon helper
const SvgIcon = ({ name, size = 18 }: { name: string; size?: number }) => (
  <img src={`/assets/icons/svg/${name}.svg`} alt="" style={{ width: size, height: size, display: "inline-block" }} />
);

// ── Native popup menu ─────────────────────────────────────────────────────────
function AppBarMenu({ documentName, content, onSave, onExportPDF, onExportDocx, onExportTxt, onExportRtf, onShare, onNewDocument }: {
  documentName: string;
  content: string;
  onSave: () => void;
  onExportPDF: () => void;
  onExportDocx: () => void;
  onExportTxt: () => void;
  onExportRtf: () => void;
  onShare: () => void;
  onNewDocument: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items = [
    { icon: "save", label: "Guardar", action: onSave, shortcut: "Ctrl+S" },
    { icon: "document-add", label: "Novo documento", action: onNewDocument },
    { sep: true },
    { icon: "download", label: "Exportar PDF", action: onExportPDF },
    { icon: "document-text", label: "Exportar Word (.doc)", action: onExportDocx },
    { icon: "code-slash", label: "Exportar Texto (.txt)", action: onExportTxt },
    { icon: "document", label: "Exportar RTF", action: onExportRtf },
    { sep: true },
    { icon: "share-social", label: "Partilhar", action: onShare },
  ];

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary/70 transition-colors"
        title="Menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <SvgIcon name="ellipsis-vertical" size={18} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 1000,
            background: "var(--background, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08)",
            minWidth: 220,
            padding: "6px 0",
            animation: "popupIn 0.15s cubic-bezier(.25,.46,.45,.94)",
          }}
          role="menu"
        >
          <style>{`@keyframes popupIn{from{opacity:0;transform:scale(.95) translateY(-4px)}to{opacity:1;transform:none}}`}</style>
          {items.map((item, i) =>
            "sep" in item ? (
              <div key={i} style={{ height: 1, background: "var(--border, #e5e7eb)", margin: "4px 0" }} />
            ) : (
              <button
                key={i}
                role="menuitem"
                onClick={() => { item.action?.(); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: ".87rem",
                  color: "var(--foreground, #111)",
                  textAlign: "left",
                  transition: "background .1s",
                  borderRadius: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary, #f4f4f5)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <SvgIcon name={item.icon} size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.shortcut && <span style={{ fontSize: ".74rem", opacity: .45 }}>{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Main EditorPage ───────────────────────────────────────────────────────────
export default function EditorPage() {
  const [, setLocation] = useLocation();
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
  const [highlightColorPickerOpen, setHighlightColorPickerOpen] = useState(false);

  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    setWordCount(text.split(/\s+/).filter((w) => w.length > 0).length);
    setCharacterCount(text.length);
    setLastModified("Agora");
  }, [content]);

  // ── Keyboard shortcut: Ctrl+S → save ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Toolbar handlers ─────────────────────────────────────────────────────
  const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);

  const handleSave = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    const idx = docs.findIndex((d: any) => d.name === documentName);
    const entry = { name: documentName, content, lastModified: new Date().toLocaleString("pt-PT") };
    if (idx >= 0) docs[idx] = entry; else docs.push(entry);
    localStorage.setItem("documents", JSON.stringify(docs));
    toast.success("Documento guardado!");
  };

  const handleExportPDF = async () => {
    try {
      const el = document.querySelector("[contenteditable]") as HTMLElement;
      if (!el) { toast.error("Editor não encontrado"); return; }
      toast.info("A gerar PDF...");
      await exportToPDF(documentName, el);
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
  };

  const handleExportDocx = () => {
    exportToDocx(documentName, content);
    toast.success("Word exportado!");
  };

  const handleExportTxt = () => {
    exportToTxt(documentName, content);
    toast.success("Texto exportado!");
  };

  const handleExportRtf = () => {
    exportToRtf(documentName, content);
    toast.success("RTF exportado!");
  };

  const handleNewDocument = () => {
    if (content && !confirm("Descartar documento atual?")) return;
    setDocumentName("Documento sem título");
    setContent("");
  };

  const handleOpenDocument = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    if (!docs.length) { toast.error("Nenhum documento guardado"); return; }
    const name = prompt("Documentos:\n" + docs.map((d: any) => d.name).join("\n") + "\n\nNome:");
    if (name) {
      const doc = docs.find((d: any) => d.name === name);
      if (doc) { setDocumentName(doc.name); setContent(doc.content); toast.success("Documento aberto!"); }
      else toast.error("Não encontrado");
    }
  };

  const handleShare = () => toast.info("Partilha em desenvolvimento");

  const handleLinkInsert = (url: string, text: string) => {
    const sel = window.getSelection();
    if (sel?.toString()) exec("createLink", url);
    else exec("insertHTML", `<a href="${url}">${text || url}</a>`);
  };

  const handleImageInsert = (url: string) => exec("insertImage", url);

  const handleTableInsert = (rows: number, cols: number) => {
    let html = "<table style='border-collapse:collapse;width:100%'><tbody>";
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++)
        html += "<td style='border:1px solid #ddd;padding:8px;min-width:60px'>Célula</td>";
      html += "</tr>";
    }
    exec("insertHTML", html + "</tbody></table><br>");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── AppBar ── */}
      <div className="h-12 px-3 bg-secondary/30 border-b border-border flex items-center justify-between gap-2 flex-shrink-0">
        {/* LEFT: Back button */}
        <button
          onClick={() => setLocation("/home")}
          className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-secondary/70 transition-colors text-sm font-medium"
          title="Voltar ao início"
        >
          <SvgIcon name="arrow-back" size={16} />
          <span className="hidden sm:inline">Início</span>
        </button>

        {/* CENTER: Document name */}
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="flex-1 max-w-xs text-sm text-center bg-transparent border-none outline-none font-medium text-foreground truncate"
          title="Nome do documento"
        />

        {/* RIGHT: word count + menu */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:block">
            {wordCount} palavras
          </span>
          <AppBarMenu
            documentName={documentName}
            content={content}
            onSave={handleSave}
            onExportPDF={handleExportPDF}
            onExportDocx={handleExportDocx}
            onExportTxt={handleExportTxt}
            onExportRtf={handleExportRtf}
            onShare={handleShare}
            onNewDocument={handleNewDocument}
          />
        </div>
      </div>

      {/* Dialogs */}
      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} onInsert={handleLinkInsert} />
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onInsert={handleTableInsert} />
      <ImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen} onOpenChange={setColorPickerOpen} onSelect={(c) => exec("foreColor", c)} title="Cor do Texto" />
      <ColorPickerModal open={highlightColorPickerOpen} onOpenChange={setHighlightColorPickerOpen} onSelect={(c) => exec("hiliteColor", c)} title="Cor de Realce" />

      {/* Toolbar */}
      <EditorToolbar
        onBold={() => exec("bold")}
        onItalic={() => exec("italic")}
        onUnderline={() => exec("underline")}
        onStrikethrough={() => exec("strikethrough")}
        onAlignLeft={() => exec("justifyLeft")}
        onAlignCenter={() => exec("justifyCenter")}
        onAlignRight={() => exec("justifyRight")}
        onAlignJustify={() => exec("justifyFull")}
        onBulletList={() => exec("insertUnorderedList")}
        onNumberedList={() => exec("insertOrderedList")}
        onLink={() => setLinkDialogOpen(true)}
        onImage={() => setImageDialogOpen(true)}
        onTable={() => setTableDialogOpen(true)}
        onSave={handleSave}
        onUndo={() => exec("undo")}
        onRedo={() => exec("redo")}
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        onDownload={handleExportTxt}
        onShare={handleShare}
        onHeading1={() => exec("formatBlock", "<h1>")}
        onHeading2={() => exec("formatBlock", "<h2>")}
        onHeading3={() => exec("formatBlock", "<h3>")}
        onCode={() => exec("formatBlock", "<pre>")}
        onQuote={() => exec("formatBlock", "<blockquote>")}
        onHighlight={() => setHighlightColorPickerOpen(true)}
        onSuperscript={() => exec("superscript")}
        onSubscript={() => exec("subscript")}
        onClearFormatting={() => exec("removeFormat")}
        onExportPDF={handleExportPDF}
        onAddNote={() => {
          const note = prompt("Texto da nota:");
          if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:8px 0;border-radius:4px"><strong>📝 Nota:</strong> ${note}</div>`);
        }}
        onColorPicker={() => setColorPickerOpen(true)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder="Comece a escrever o seu documento..."
          zoom={zoom}
          onZoomChange={setZoom}
        />
        <SidePanel
          documentName={documentName}
          lastModified={lastModified}
          wordCount={wordCount}
          characterCount={characterCount}
          onDocumentNameChange={setDocumentName}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}
