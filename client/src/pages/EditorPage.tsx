import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import EditorToolbar from "@/components/EditorToolbar";
import DocumentEditor from "@/components/DocumentEditor";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import ColorPickerModal from "@/components/ColorPickerModal";
import { toast } from "sonner";
import { exportToPDF, exportToDocx, exportToTxt, exportToRtf } from "@/lib/pdfExport";
import {
  ArrowLeft, MoreVertical, Save, FileDown, FileText as FileTextIcon,
  Share2, FileCode, PlusCircle, FolderOpen,
} from "lucide-react";

// ── SVG icon with Lucide fallback ─────────────────────────────────────────────
function Ico({ svg, Fallback, size = 18 }: { svg?: string; Fallback: React.ComponentType<{ size?: number }>; size?: number }) {
  const [ok, setOk] = useState(true);
  if (svg && ok) return (
    <img src={`/assets/icons/svg/${svg}.svg`} alt="" width={size} height={size}
      style={{ display: "inline-block" }} onError={() => setOk(false)} />
  );
  return <Fallback size={size} />;
}

// ── Native ripple ─────────────────────────────────────────────────────────────
function ripple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height);
  const r = document.createElement("span");
  r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(212,82,10,.2);border-radius:50%;pointer-events:none;animation:ripple .5s ease-out forwards`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 500);
}

// ── AppBar popup menu ─────────────────────────────────────────────────────────
function AppMenu({
  onSave, onNewDoc, onOpenDoc, onExportPDF, onExportDocx, onExportTxt, onExportRtf, onShare,
}: {
  onSave: () => void; onNewDoc: () => void; onOpenDoc: () => void;
  onExportPDF: () => void; onExportDocx: () => void;
  onExportTxt: () => void; onExportRtf: () => void; onShare: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 52, right: 12 });
  const btnRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(v => !v);
    ripple(e);
  };

  const items = [
    { icon: "save", Fb: Save, label: "Guardar", action: onSave, kbd: "Ctrl+S" },
    { icon: "document-add", Fb: PlusCircle, label: "Novo documento", action: onNewDoc },
    { icon: "folder-open", Fb: FolderOpen, label: "Abrir documento", action: onOpenDoc },
    null,
    { icon: "download", Fb: FileDown, label: "Exportar PDF", action: onExportPDF },
    { icon: "document-text", Fb: FileTextIcon, label: "Exportar Word (.doc)", action: onExportDocx },
    { icon: "code-slash", Fb: FileCode, label: "Exportar Texto (.txt)", action: onExportTxt },
    { icon: "document", Fb: FileTextIcon, label: "Exportar RTF", action: onExportRtf },
    null,
    { icon: "share-social", Fb: Share2, label: "Partilhar", action: onShare },
  ];

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="native-btn ripple-container"
        style={{
          width: 36, height: 36, borderRadius: 10, border: "none",
          background: open ? "rgba(212,82,10,.12)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", overflow: "hidden",
          color: open ? "var(--brand)" : "var(--muted-foreground)",
        }}
        aria-label="Menu"
      >
        <Ico svg="ellipsis-vertical" Fallback={MoreVertical} size={18} />
      </button>

      {open && (
        <div style={{
          position: "fixed", top: pos.top, right: pos.right, zIndex: 99999,
          background: "var(--cream)", border: "1px solid var(--lp-border, #e4ddd2)",
          borderRadius: 14, boxShadow: "0 8px 40px rgba(14,12,9,.18), 0 2px 8px rgba(14,12,9,.08)",
          minWidth: 230, padding: "6px 0",
          animation: "popIn .18s cubic-bezier(.34,1.56,.64,1)",
        }}>
          {items.map((item, i) =>
            item === null ? (
              <div key={i} style={{ height: 1, background: "var(--lp-border)", margin: "4px 0" }} />
            ) : (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); item.action(); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
                  fontSize: ".87rem", color: "var(--ink)", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--warm)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <Ico svg={item.icon} Fallback={item.Fb} size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.kbd && <span style={{ fontSize: ".7rem", opacity: .35 }}>{item.kbd}</span>}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

// Import React for useRef in AppMenu
import React from "react";

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
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Word/char count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    setWordCount(text.split(" ").filter(Boolean).length);
    setCharacterCount(text.length);
    setLastModified("Agora");
  }, [content]);

  // Ctrl+S
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const handleSave = useCallback(() => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    const idx = docs.findIndex((d: any) => d.name === documentName);
    const entry = { name: documentName, content, lastModified: new Date().toLocaleString("pt-PT") };
    if (idx >= 0) docs[idx] = entry; else docs.push(entry);
    localStorage.setItem("documents", JSON.stringify(docs));
    toast.success("✓ Documento guardado!");
  }, [documentName, content]);

  const handleExportPDF = useCallback(async () => {
    try {
      const el = document.querySelector("[contenteditable]") as HTMLElement;
      if (!el) { toast.error("Editor não encontrado"); return; }
      toast.info("A gerar PDF...");
      await exportToPDF(documentName, el);
      toast.success("PDF exportado com sucesso!");
    } catch { toast.error("Erro ao exportar PDF"); }
  }, [documentName]);

  const handleNewDoc = () => {
    if (content && !confirm("Descartar documento atual?")) return;
    setDocumentName("Documento sem título");
    setContent("");
  };

  const handleOpenDoc = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    if (!docs.length) { toast.error("Nenhum documento guardado"); return; }
    const name = prompt("Documentos:\n" + docs.map((d: any) => d.name).join("\n") + "\n\nNome:");
    if (name) {
      const doc = docs.find((d: any) => d.name === name);
      if (doc) { setDocumentName(doc.name); setContent(doc.content); toast.success("Documento aberto!"); }
      else toast.error("Não encontrado");
    }
  };

  const handleLinkInsert = (url: string, text: string) => {
    const sel = window.getSelection();
    if (sel?.toString()) exec("createLink", url);
    else exec("insertHTML", `<a href="${url}" style="color:var(--brand)">${text || url}</a>`);
  };

  const handleImageInsert = (url: string) => exec("insertImage", url);

  const handleTableInsert = (rows: number, cols: number) => {
    let html = `<table style='border-collapse:collapse;width:100%;margin:8px 0'><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++)
        html += `<td style='border:1px solid #e4ddd2;padding:8px 12px;min-width:60px'>${r === 0 ? `<strong>Coluna ${c + 1}</strong>` : "Célula"}</td>`;
      html += "</tr>";
    }
    exec("insertHTML", html + "</tbody></table><p></p>");
  };

  const appBarH = 52;
  const toolbarH = isMobile ? 0 : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--background)", overflow: "hidden" }}>

      {/* ── AppBar ── */}
      <div style={{
        height: appBarH, display: "flex", alignItems: "center", gap: 6,
        padding: "0 8px", borderBottom: "1px solid var(--border)",
        background: "var(--cream)", flexShrink: 0, zIndex: 100,
        animation: "slideDown .2s ease",
      }}>
        {/* Back */}
        <button
          onClick={() => setLocation("/home")}
          onMouseDown={(e) => ripple(e as any)}
          className="native-btn ripple-container"
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "transparent", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden",
            color: "var(--muted-foreground)", flexShrink: 0,
          }}
          title="Voltar"
        >
          <Ico svg="arrow-back" Fallback={ArrowLeft} size={18} />
        </button>

        {/* App icon */}
        <img
          src="/assets/icons/app-icon.svg"
          alt="Doction"
          style={{ width: 28, height: 28, flexShrink: 0 }}
        />

        {/* Document name — editable inline */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
          {isEditingName ? (
            <input
              autoFocus
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setIsEditingName(false); }}
              style={{
                flex: 1, maxWidth: 280, border: "none", borderBottom: "2px solid var(--brand)",
                background: "transparent", outline: "none", fontSize: ".9rem",
                fontWeight: 600, color: "var(--foreground)", padding: "2px 4px",
              }}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              style={{
                background: "none", border: "none", cursor: "text", padding: "2px 4px",
                fontSize: ".9rem", fontWeight: 600, color: "var(--foreground)",
                maxWidth: isMobile ? 160 : 280, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
                borderRadius: 6, transition: "background .12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
              title="Clica para renomear"
            >
              {documentName}
            </button>
          )}
        </div>

        {/* Stats (desktop) */}
        {!isMobile && (
          <span style={{ fontSize: ".72rem", color: "var(--muted-foreground)", flexShrink: 0 }}>
            {wordCount} palavras
          </span>
        )}

        {/* Menu */}
        <AppMenu
          onSave={handleSave}
          onNewDoc={handleNewDoc}
          onOpenDoc={handleOpenDoc}
          onExportPDF={handleExportPDF}
          onExportDocx={() => { exportToDocx(documentName, content); toast.success("Word exportado!"); }}
          onExportTxt={() => { exportToTxt(documentName, content); toast.success("TXT exportado!"); }}
          onExportRtf={() => { exportToRtf(documentName, content); toast.success("RTF exportado!"); }}
          onShare={() => toast.info("Partilha em desenvolvimento")}
        />
      </div>

      {/* ── Toolbar (desktop only) ── */}
      {!isMobile && (
        <EditorToolbar
          isMobile={false}
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
          onNewDocument={handleNewDoc}
          onOpenDocument={handleOpenDoc}
          onDownload={() => { exportToDocx(documentName, content); toast.success("Word exportado!"); }}
          onShare={() => toast.info("Partilha em desenvolvimento")}
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
            if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px"><strong>📝 Nota:</strong> ${note}</div><p></p>`);
          }}
          onColorPicker={() => setColorPickerOpen(true)}
        />
      )}

      {/* Dialogs */}
      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} onInsert={handleLinkInsert} />
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onInsert={handleTableInsert} />
      <ImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen} onOpenChange={setColorPickerOpen} onSelect={(c) => exec("foreColor", c)} title="Cor do Texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={(c) => exec("hiliteColor", c)} title="Cor de Realce" />

      {/* ── Main content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder="Comece a escrever o seu documento..."
          zoom={zoom}
          onZoomChange={setZoom}
          isMobile={isMobile}
        />
        {!isMobile && (
          <SidePanel
            documentName={documentName}
            lastModified={lastModified}
            wordCount={wordCount}
            characterCount={characterCount}
            onDocumentNameChange={setDocumentName}
            onShare={() => toast.info("Partilha em desenvolvimento")}
          />
        )}
      </div>

      {/* ── Mobile bottom toolbar ── */}
      {isMobile && (
        <EditorToolbar
          isMobile={true}
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
          onNewDocument={handleNewDoc}
          onOpenDocument={handleOpenDoc}
          onDownload={() => { exportToTxt(documentName, content); toast.success("TXT exportado!"); }}
          onShare={() => toast.info("Partilha em desenvolvimento")}
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
            const note = prompt("Nota:");
            if (note) exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px"><strong>📝</strong> ${note}</div>`);
          }}
          onColorPicker={() => setColorPickerOpen(true)}
        />
      )}
    </div>
  );
}
