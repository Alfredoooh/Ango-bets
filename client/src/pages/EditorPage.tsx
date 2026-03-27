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

// ── Native popup menu ─────────────────────────────────────────────────────────
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

  const items = [
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
    ...(switchable ? [null, { icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />, label: theme === "dark" ? "Modo claro" : "Modo escuro", action: toggleTheme ?? (() => {}) }] : []),
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          width: 36, height: 36, borderRadius: 8, border: "none",
          background: open ? "rgba(212,82,10,.1)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#d4520a", transition: "background 0.15s",
        }}
        title="Menu"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: 52, right: 8,
            zIndex: 99999,
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 14,
            boxShadow: "0 12px 48px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.1)",
            minWidth: 230,
            padding: "6px 0",
            animation: "menuIn 0.18s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          <style>{`@keyframes menuIn{from{opacity:0;transform:scale(.92) translateY(-8px)}to{opacity:1;transform:none}}`}</style>
          {items.map((item, i) =>
            item === null ? (
              <div key={i} style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
            ) : (
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ color: "#d4520a", flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.kbd && <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>{item.kbd}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── EditorPage ─────────────────────────────────────────────────────────────────
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
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  // Word / char count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    setWordCount(text.split(/\s+/).filter(Boolean).length);
    setCharacterCount(text.length);
    setLastModified("Agora");
  }, [content]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

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
      toast.info("A gerar PDF...");
      await exportToPDF(documentName);
      toast.success("PDF exportado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar PDF");
    }
  };

  const handleExportDocx = () => { exportToDocx(documentName, content); toast.success("Word exportado!"); };
  const handleExportTxt = () => { exportToTxt(documentName, content); toast.success("Texto exportado!"); };

  const handleNewDocument = () => {
    if (content && !confirm("Descartar documento atual?")) return;
    setDocumentName("Documento sem título");
    setContent("");
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

  const handleShare = () => toast.info("Partilha em desenvolvimento");

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
          ? `<th style="border:1px solid #ccc;padding:8px 10px;background:#f5f5f5;font-weight:600;text-align:left">Cabeçalho</th>`
          : `<td style="border:1px solid #ccc;padding:8px 10px">Célula</td>`;
      html += "</tr>";
    }
    exec("insertHTML", html + "</tbody></table><br>");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "var(--background, #fff)",
        overflow: "hidden",
      }}
    >
      {/* ── AppBar ── */}
      <div style={{
        height: 48,
        background: "#fff",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: 4,
        flexShrink: 0,
        zIndex: 50,
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>
        {/* Back button */}
        <button
          onClick={() => setLocation("/home")}
          style={{
            width: 36, height: 36, borderRadius: 8, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#d4520a", transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf1ea")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Voltar ao início"
        >
          <ArrowLeft size={20} />
        </button>

        {/* App icon */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, overflow: "hidden",
          flexShrink: 0, background: "#d4520a",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src="/app-icon.png" alt="D" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }} />
        </div>

        {/* Document title */}
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          onBlur={handleSave}
          style={{
            flex: 1,
            fontSize: 15, fontWeight: 600,
            color: "#1a1a1a",
            border: "none", outline: "none",
            background: "transparent",
            padding: "4px 6px",
            borderRadius: 6,
            minWidth: 0,
            transition: "background 0.15s",
          }}
          onFocus={(e) => (e.target.style.background = "#f5f5f5")}
          onBlurCapture={(e) => (e.target.style.background = "transparent")}
          title="Nome do documento"
        />

        {/* Word count — hidden on small mobile */}
        <span style={{
          fontSize: 12, color: "#999",
          flexShrink: 0, whiteSpace: "nowrap",
          display: window.innerWidth < 400 ? "none" : "block",
        }}>
          {wordCount}p
        </span>

        {/* Menu */}
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

      {/* ── Dialogs ── */}
      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} onInsert={handleLinkInsert} />
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onInsert={handleTableInsert} />
      <ImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen} onOpenChange={setColorPickerOpen} onSelect={(c) => exec("foreColor", c)} title="Cor do texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={(c) => exec("hiliteColor", c)} title="Cor de realce" />

      {/* ── Toolbar (desktop top / mobile bottom) ── */}
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
        onDownload={handleExportDocx}
        onShare={handleShare}
        onHeading1={() => exec("formatBlock", "<h1>")}
        onHeading2={() => exec("formatBlock", "<h2>")}
        onHeading3={() => exec("formatBlock", "<h3>")}
        onCode={() => exec("formatBlock", "<pre>")}
        onQuote={() => exec("formatBlock", "<blockquote>")}
        onHighlight={() => setHighlightPickerOpen(true)}
        onSuperscript={() => exec("superscript")}
        onSubscript={() => exec("subscript")}
        onClearFormatting={() => exec("removeFormat")}
        onExportPDF={handleExportPDF}
        onAddNote={() => {
          const note = prompt("Texto da nota:");
          if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px"><strong>📝 Nota:</strong> ${note}</div>`);
        }}
        onColorPicker={() => setColorPickerOpen(true)}
      />

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          // On mobile, add padding for the bottom bar
        }}
        className="md:flex-row flex-col"
      >
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder="Comece a escrever o seu documento aqui..."
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Side panel — desktop only */}
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
      </div>

      {/* Mobile bottom bar spacer — so content isn't hidden under toolbar */}
      <div className="md:hidden" style={{ height: 90, flexShrink: 0 }} />
    </div>
  );
}
