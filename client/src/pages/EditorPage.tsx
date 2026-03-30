import { useState, useEffect } from "react";
import EditorToolbar from "@/components/EditorToolbar";

function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 767);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}
import DocumentEditor from "@/components/DocumentEditor";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import ColorPickerModal from "@/components/ColorPickerModal";
import { toast } from "sonner";
import { exportToPDF, exportToDocx, exportToTxt } from "@/lib/pdfExport";
import { useTheme } from "@/contexts/ThemeContext";

/* ══════════════════════════════════════════════════════════════════
   EDITOR PAGE
══════════════════════════════════════════════════════════════════ */
export default function EditorPage() {
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

  const bg = isDark ? "#141414" : "#ffffff";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: bg,
      overflow: "hidden",
    }}>

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
