import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";

import EditorToolbar from "@/components/EditorToolbar";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import ColorPickerModal from "@/components/ColorPickerModal";
import { toast } from "sonner";
import { exportToPDF, exportToDocx, exportToTxt } from "@/lib/pdfExport";
import { useTheme } from "@/contexts/ThemeContext";
import { MoreVertical, Save, Download, Share2, FilePlus, FolderOpen, FileText, Moon, Sun } from "lucide-react";
import AppIcon from "@/components/AppIcon"; // assumindo que foi extraído
import ArrowBackIcon from "@/components/ArrowBackIcon"; // idem

/* ── Hook personalizado para documentos ── */
function useDocuments() {
  const [documents, setDocuments] = useState<{ name: string; content: string; lastModified: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("documents");
    if (stored) setDocuments(JSON.parse(stored));
  }, []);

  const saveDocument = useCallback((name: string, content: string) => {
    const updated = [...documents];
    const index = updated.findIndex(d => d.name === name);
    const entry = { name, content, lastModified: new Date().toLocaleString("pt-PT") };
    if (index >= 0) updated[index] = entry;
    else updated.push(entry);
    setDocuments(updated);
    localStorage.setItem("documents", JSON.stringify(updated));
    toast.success("Documento guardado!");
  }, [documents]);

  const loadDocument = useCallback((name: string) => {
    const doc = documents.find(d => d.name === name);
    return doc ? { name: doc.name, content: doc.content } : null;
  }, [documents]);

  const getDocumentNames = useCallback(() => documents.map(d => d.name), [documents]);

  return { documents, saveDocument, loadDocument, getDocumentNames };
}

/* ── Componente do menu ⋮ ── */
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

  const items = useMemo(() => [
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
    ...(switchable
      ? [null, {
          icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />,
          label: theme === "dark" ? "Modo claro" : "Modo escuro",
          action: toggleTheme ?? (() => {}),
        }]
      : []),
  ], [onSave, onExportPDF, onExportDocx, onExportTxt, onShare, onNewDocument, onOpenDocument, switchable, theme, toggleTheme]);

  const menuBg = isDark ? "bg-[#1e1e1e]" : "bg-white";
  const menuBdr = isDark ? "border-[#2c2c2c]" : "border-[#ebebeb]";
  const itemClr = isDark ? "text-[#e0e0e0]" : "text-[#1a1a1a]";
  const hoverBg = isDark ? "hover:bg-white/10" : "hover:bg-gray-100";

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          open ? (isDark ? "bg-white/10" : "bg-black/5") : "bg-transparent"
        }`}
        aria-label="Menu"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className={`fixed top-12 right-2 z-[99999] ${menuBg} border ${menuBdr} rounded-2xl shadow-lg min-w-[238px] py-1.5 animate-in fade-in zoom-in-95 duration-150`}
        >
          {items.map((item, i) =>
            item === null ? (
              <hr key={i} className={`my-1 mx-1.5 ${menuBdr}`} />
            ) : (
              <button
                key={i}
                onClick={() => { item.action(); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm ${itemClr} transition-colors ${hoverBg}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.kbd && <span className="text-xs font-mono text-gray-400">{item.kbd}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Página principal do editor ── */
export default function EditorPage() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [documentName, setDocumentName] = useState("Documento sem título");
  const [zoom, setZoom] = useState(100);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);

  const { saveDocument, loadDocument, getDocumentNames } = useDocuments();

  // Configuração do editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Highlight,
      Color,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // O conteúdo já está sincronizado com o estado via setContent no onChange
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none",
        style: `font-size: ${zoom}%`,
      },
    },
  });

  // Carregar conteúdo quando o nome do documento mudar
  useEffect(() => {
    if (documentName) {
      const doc = loadDocument(documentName);
      if (doc) editor?.commands.setContent(doc.content);
    }
  }, [documentName, loadDocument, editor]);

  // Salvar automaticamente ao perder o foco no título ou periodicamente (opcional)
  const handleSave = useCallback(() => {
    if (editor) {
      saveDocument(documentName, editor.getHTML());
    }
  }, [editor, documentName, saveDocument]);

  // Atalho Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Exportações
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

  const handleExportDocx = () => {
    if (editor) exportToDocx(documentName, editor.getHTML());
    toast.success("Word exportado!");
  };

  const handleExportTxt = () => {
    if (editor) exportToTxt(documentName, editor.getText());
    toast.success("Texto exportado!");
  };

  const handleShare = () => toast.info("Partilha em desenvolvimento");

  const handleNewDocument = useCallback(() => {
    if (editor?.getText() && !confirm("Descartar documento atual?")) return;
    setDocumentName("Documento sem título");
    editor?.commands.clearContent();
  }, [editor]);

  const handleOpenDocument = useCallback(() => {
    const names = getDocumentNames();
    if (!names.length) {
      toast.error("Nenhum documento guardado");
      return;
    }
    const name = prompt("Documentos:\n" + names.join("\n") + "\n\nNome:");
    if (!name) return;
    const doc = loadDocument(name);
    if (doc) {
      setDocumentName(doc.name);
      editor?.commands.setContent(doc.content);
      toast.success("Documento aberto!");
    } else {
      toast.error("Não encontrado");
    }
  }, [getDocumentNames, loadDocument, editor]);

  // Inserir link (usando TipTap)
  const handleLinkInsert = useCallback((url: string, text?: string) => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${text || url}</a>`).run();
    }
    setLinkDialogOpen(false);
  }, [editor]);

  const handleImageInsert = useCallback((url: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
    setImageDialogOpen(false);
  }, [editor]);

  const handleTableInsert = useCallback((rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableDialogOpen(false);
  }, [editor]);

  // Cores e realce
  const handleColorSelect = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run();
    setColorPickerOpen(false);
  }, [editor]);

  const handleHighlightSelect = useCallback((color: string) => {
    editor?.chain().focus().toggleHighlight({ color }).run();
    setHighlightPickerOpen(false);
  }, [editor]);

  // Palavras e caracteres
  const stats = useMemo(() => {
    const text = editor?.getText() || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    return { words, chars };
  }, [editor?.getText()]);

  // Toolbar props mapeadas para comandos do TipTap
  const tbProps = useMemo(() => ({
    onBold: () => editor?.chain().focus().toggleBold().run(),
    onItalic: () => editor?.chain().focus().toggleItalic().run(),
    onUnderline: () => editor?.chain().focus().toggleUnderline().run(),
    onStrikethrough: () => editor?.chain().focus().toggleStrike().run(),
    onAlignLeft: () => editor?.chain().focus().setTextAlign("left").run(),
    onAlignCenter: () => editor?.chain().focus().setTextAlign("center").run(),
    onAlignRight: () => editor?.chain().focus().setTextAlign("right").run(),
    onAlignJustify: () => editor?.chain().focus().setTextAlign("justify").run(),
    onBulletList: () => editor?.chain().focus().toggleBulletList().run(),
    onNumberedList: () => editor?.chain().focus().toggleOrderedList().run(),
    onLink: () => setLinkDialogOpen(true),
    onImage: () => setImageDialogOpen(true),
    onTable: () => setTableDialogOpen(true),
    onSave: handleSave,
    onUndo: () => editor?.chain().focus().undo().run(),
    onRedo: () => editor?.chain().focus().redo().run(),
    onNewDocument: handleNewDocument,
    onOpenDocument: handleOpenDocument,
    onDownload: handleExportDocx,
    onShare: handleShare,
    onHeading1: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    onHeading2: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    onHeading3: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    onCode: () => editor?.chain().focus().toggleCodeBlock().run(),
    onQuote: () => editor?.chain().focus().toggleBlockquote().run(),
    onHighlight: () => setHighlightPickerOpen(true),
    onSuperscript: () => editor?.chain().focus().toggleSuperscript().run(),
    onSubscript: () => editor?.chain().focus().toggleSubscript().run(),
    onClearFormatting: () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
    onExportPDF: handleExportPDF,
    onAddNote: () => {
      const note = prompt("Texto da nota:");
      if (note) editor?.chain().focus().insertContent(`<div class="bg-amber-50 border-l-4 border-amber-500 p-3 my-2 rounded-md"><strong>📝 Nota:</strong> ${note}</div>`).run();
    },
    onColorPicker: () => setColorPickerOpen(true),
  }), [editor, handleSave, handleNewDocument, handleOpenDocument, handleExportDocx, handleShare, handleExportPDF]);

  // Cores e estilos de fundo
  const bgClass = isDark ? "bg-[#141414]" : "bg-gray-100";
  const appbarBg = isDark ? "bg-[#1c1c1c]" : "bg-white";
  const appbarBdr = isDark ? "border-[#2a2a2a]" : "border-[#e8e8e8]";

  return (
    <div className={`flex flex-col h-screen ${bgClass} overflow-hidden`}>
      {/* App Bar */}
      <div className={`h-13 flex items-center px-2 gap-1 border-b ${appbarBg} ${appbarBdr} flex-shrink-0 shadow-sm`}>
        <button
          onClick={() => setLocation("/home")}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Voltar"
        >
          <ArrowBackIcon size={20} dark={isDark} />
        </button>

        <AppIcon size={28} dark={isDark} />

        <input
          value={documentName}
          onChange={e => setDocumentName(e.target.value)}
          onBlur={handleSave}
          className="flex-1 text-sm font-semibold bg-transparent border-none outline-none px-1.5 py-1 rounded-md transition-colors focus:bg-gray-100 dark:focus:bg-white/10"
          aria-label="Nome do documento"
        />

        <span className={`text-xs font-mono tabular-nums ${isDark ? "text-gray-500" : "text-gray-400"} hidden sm:block`}>
          {stats.words}p
        </span>

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

      {/* Dialogs */}
      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} onInsert={handleLinkInsert} />
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onInsert={handleTableInsert} />
      <ImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={handleImageInsert} />
      <ColorPickerModal open={colorPickerOpen} onOpenChange={setColorPickerOpen} onSelect={handleColorSelect} title="Cor do texto" />
      <ColorPickerModal open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen} onSelect={handleHighlightSelect} title="Cor de realce" />

      {/* Toolbar desktop */}
      {!isMobile && <EditorToolbar isMobile={false} {...tbProps} />}

      {/* Área principal */}
      <div className={`flex-1 overflow-hidden ${isMobile ? "pb-20" : ""}`}>
        <div className="h-full overflow-auto p-4">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }} className="w-full">
            <EditorContent editor={editor} className="max-w-4xl mx-auto" />
          </div>
        </div>

        {/* Side panel (desktop) */}
        {!isMobile && (
          <div className="hidden lg:block">
            <SidePanel
              documentName={documentName}
              lastModified="Agora"
              wordCount={stats.words}
              characterCount={stats.chars}
              onDocumentNameChange={setDocumentName}
              onShare={handleShare}
            />
          </div>
        )}
      </div>

      {/* Toolbar mobile */}
      {isMobile && <EditorToolbar isMobile={true} {...tbProps} />}
    </div>
  );
}

// Hook auxiliar
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}