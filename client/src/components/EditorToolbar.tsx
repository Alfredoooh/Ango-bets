import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link, Image, Table,
  Undo2, Redo2, Save, Download, Share2, Highlighter, Superscript,
  Subscript, Code, Quote, Palette, Minus, Plus, Type, Heading1,
  Heading2, Heading3, Heading4, Heading5, FileDown, FileText,
  MoreHorizontal, Trash2, CheckSquare, SeparatorHorizontal,
  CaseSensitive, CaseUpper, Hash, Pilcrow, WrapText, FileCode,
  BookOpen, Bookmark, AlertTriangle, Info, CheckCircle, XCircle,
  ClipboardList, Calendar, ChevronDown, Settings2, AlignVerticalJustifyStart,
} from "lucide-react";

// ── Icon: try SVG from assets, fallback to Lucide ─────────────────────────────
function Ico({
  svg, Fallback, size = 15, color
}: {
  svg?: string; Fallback: React.ComponentType<{ size?: number; color?: string }>; size?: number; color?: string;
}) {
  const [svgOk, setSvgOk] = useState(true);
  if (svg && svgOk) {
    return (
      <img
        src={`/assets/icons/svg/${svg}.svg`}
        alt=""
        width={size}
        height={size}
        style={{ display: "inline-block", flexShrink: 0, color }}
        onError={() => setSvgOk(false)}
      />
    );
  }
  return <Fallback size={size} color={color} />;
}

// ── Ripple effect ──────────────────────────────────────────────────────────────
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement("span");
    const d = Math.max(rect.width, rect.height);
    r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(212,82,10,.18);border-radius:50%;pointer-events:none;animation:ripple .5s ease-out forwards`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 500);
  }, []);
}

// ── Toolbar Button ─────────────────────────────────────────────────────────────
function TB({
  icon: SvgName, Fallback, label, onClick, active, kbd, children
}: {
  icon?: string; Fallback: React.ComponentType<{ size?: number }>; label: string;
  onClick?: () => void; active?: boolean; kbd?: string; children?: React.ReactNode;
}) {
  const ripple = useRipple();
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      onClick={ripple as any}
      title={`${label}${kbd ? ` (${kbd})` : ""}`}
      className="native-btn ripple-container"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        padding: "0 8px", height: 32, borderRadius: 8, border: "none", cursor: "pointer",
        background: active ? "var(--brand-pale)" : "transparent",
        color: active ? "var(--brand)" : "var(--muted-foreground)",
        fontSize: ".78rem", fontWeight: 500, flexShrink: 0,
        position: "relative", overflow: "hidden",
        transition: "background .1s, color .1s",
        minWidth: 32,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--secondary)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
        }
      }}
    >
      <Ico svg={SvgName} Fallback={Fallback} size={15} />
      {children}
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────
const Sep = () => (
  <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px", flexShrink: 0 }} />
);

// ── Dropdown menu ─────────────────────────────────────────────────────────────
function Drop({
  label, icon: SvgName, Fallback, children, align = "left"
}: {
  label?: string; icon?: string; Fallback: React.ComponentType<{ size?: number }>;
  children: React.ReactNode; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 40, left: 0 });

  useEffect(() => {
    if (!open) return;
    // Calculate position to ensure popup is always visible
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuW = 220;
      let left = align === "right" ? rect.right - menuW : rect.left;
      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
      setPos({ top: rect.bottom + 4, left });
    }
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, align]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="native-btn"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "0 8px", height: 32, borderRadius: 8, border: "none",
          background: open ? "var(--brand-pale)" : "transparent",
          color: open ? "var(--brand)" : "var(--muted-foreground)",
          cursor: "pointer", fontSize: ".78rem", fontWeight: 500, flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!open) { (e.currentTarget as HTMLButtonElement).style.background = "var(--secondary)"; } }}
        onMouseLeave={(e) => { if (!open) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; } }}
      >
        <Ico svg={SvgName} Fallback={Fallback} size={15} />
        {label && <span>{label}</span>}
        <ChevronDown size={10} style={{ opacity: .5 }} />
      </button>

      {open && (
        // Use fixed positioning to escape any overflow:hidden parent
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 99999,
            background: "var(--popover, #fff)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 8px 40px rgba(14,12,9,.16), 0 2px 8px rgba(14,12,9,.08)",
            minWidth: 220,
            padding: "5px 0",
            animation: "slideDown .15s cubic-bezier(.25,.46,.45,.94)",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Dropdown Item ─────────────────────────────────────────────────────────────
function DI({
  icon: SvgName, Fallback, label, onClick, kbd, destructive
}: {
  icon?: string; Fallback: React.ComponentType<{ size?: number }>; label: string;
  onClick?: () => void; kbd?: string; destructive?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
        fontSize: ".84rem", color: destructive ? "var(--destructive)" : "var(--foreground)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <Ico svg={SvgName} Fallback={Fallback} size={15} color={destructive ? "var(--destructive)" : undefined} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".7rem", opacity: .38 }}>{kbd}</span>}
    </button>
  );
}

const DSep = () => <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;

// ── Select ────────────────────────────────────────────────────────────────────
function Sel({
  options, value, onChange, width = 100
}: { options: { label: string; value: string }[]; value?: string; onChange: (v: string) => void; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 40, left: 0 });
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let left = rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setPos({ top: rect.bottom + 2, left });
    }
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, width]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className="native-btn"
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 32,
          padding: "0 8px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--background)", cursor: "pointer",
          fontSize: ".78rem", fontWeight: 500, color: "var(--foreground)",
          width, flexShrink: 0,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? options[0]?.label}
        </span>
        <ChevronDown size={10} style={{ opacity: .5, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "fixed", top: pos.top, left: pos.left, zIndex: 99999,
            background: "var(--popover, #fff)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "0 6px 24px rgba(14,12,9,.14)",
            width, padding: "4px 0", animation: "slideDown .12s ease",
            maxHeight: 280, overflowY: "auto",
          }}
          onClick={() => setOpen(false)}
        >
          {options.map(o => (
            <button
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); }}
              style={{
                display: "block", width: "100%", padding: "8px 12px",
                background: value === o.value ? "var(--brand-pale)" : "none",
                border: "none", cursor: "pointer", fontSize: ".82rem",
                color: value === o.value ? "var(--brand)" : "var(--foreground)",
                textAlign: "left", fontWeight: value === o.value ? 600 : 400,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = value === o.value ? "var(--brand-pale)" : "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = value === o.value ? "var(--brand-pale)" : "none")}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "'Palatino Linotype', serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
];

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "28", "32", "36", "48", "72"
].map(s => ({ label: `${s}pt`, value: s }));

// ── Props ─────────────────────────────────────────────────────────────────────
interface EditorToolbarProps {
  onBold: () => void; onItalic: () => void; onUnderline: () => void;
  onStrikethrough?: () => void; onAlignLeft: () => void; onAlignCenter: () => void;
  onAlignRight: () => void; onAlignJustify?: () => void;
  onBulletList: () => void; onNumberedList: () => void;
  onLink: () => void; onImage: () => void; onTable: () => void;
  onSave: () => void; onUndo: () => void; onRedo: () => void;
  onNewDocument: () => void; onOpenDocument: () => void;
  onDownload: () => void; onShare: () => void;
  onHeading1?: () => void; onHeading2?: () => void; onHeading3?: () => void;
  onCode?: () => void; onQuote?: () => void; onHighlight?: () => void;
  onSuperscript?: () => void; onSubscript?: () => void;
  onClearFormatting?: () => void; onExportPDF?: () => void;
  onAddNote?: () => void; onColorPicker?: () => void;
  isMobile?: boolean;
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const {
    onBold, onItalic, onUnderline, onStrikethrough, onAlignLeft, onAlignCenter,
    onAlignRight, onAlignJustify, onBulletList, onNumberedList, onLink, onImage,
    onTable, onSave, onUndo, onRedo, onNewDocument, onOpenDocument,
    onDownload, onShare, onHeading1, onHeading2, onHeading3, onCode, onQuote,
    onHighlight, onSuperscript, onSubscript, onClearFormatting, onExportPDF,
    onAddNote, onColorPicker, isMobile = false,
  } = props;

  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Calibri, sans-serif");

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const applyFontSize = (sz: string) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      exec("fontSize", "7");
      // Override font size on the <font> element just created
      const fonts = document.querySelectorAll("font[size='7']");
      fonts.forEach(f => {
        (f as HTMLElement).removeAttribute("size");
        (f as HTMLElement).style.fontSize = `${sz}pt`;
      });
    }
    setFontSize(sz);
  };

  const applyFont = (ff: string) => {
    exec("fontName", ff);
    setFontFamily(ff);
  };

  // ── MOBILE BOTTOM BAR ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="bottom-sheet" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "var(--cream)", borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        animation: "slideUp .2s cubic-bezier(.25,.46,.45,.94)",
      }}>
        {/* Main quick-access row */}
        <div className="toolbar-scroll" style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "6px 8px", overflowX: "auto",
        }}>
          <TB icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} kbd="Ctrl+B" />
          <TB icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} kbd="Ctrl+I" />
          <TB icon="underline" Fallback={Underline} label="Sublinhado" onClick={onUnderline} />
          <TB icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
          <Sep />
          <TB icon="align-left" Fallback={AlignLeft} label="Esquerda" onClick={onAlignLeft} />
          <TB icon="align-center" Fallback={AlignCenter} label="Centro" onClick={onAlignCenter} />
          <TB icon="align-right" Fallback={AlignRight} label="Direita" onClick={onAlignRight} />
          <Sep />
          <TB icon="list-bullet" Fallback={List} label="Lista" onClick={onBulletList} />
          <TB icon="list-number" Fallback={ListOrdered} label="Numerada" onClick={onNumberedList} />
          <Sep />
          <TB icon="color-palette" Fallback={Palette} label="Cor texto" onClick={onColorPicker} />
          <TB icon="highlighter" Fallback={Highlighter} label="Realçar" onClick={onHighlight} />
          <Sep />
          <TB icon="link" Fallback={Link} label="Link" onClick={onLink} />
          <TB icon="image" Fallback={Image} label="Imagem" onClick={onImage} />
          <TB icon="table" Fallback={Table} label="Tabela" onClick={onTable} />
          <Sep />
          <Drop label="+" icon={undefined} Fallback={MoreHorizontal} align="right">
            <DI Fallback={Heading1} label="Título 1" onClick={onHeading1} />
            <DI Fallback={Heading2} label="Título 2" onClick={onHeading2} />
            <DI Fallback={Heading3} label="Título 3" onClick={onHeading3} />
            <DSep />
            <DI Fallback={Quote} label="Citação" onClick={onQuote} />
            <DI Fallback={Code} label="Código" onClick={onCode} />
            <DI Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
            <DI Fallback={Subscript} label="Subscrito" onClick={onSubscript} />
            <DSep />
            <DI Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
            <DI Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
            <DSep />
            <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} destructive />
          </Drop>
        </div>
      </div>
    );
  }

  // ── DESKTOP TOOLBAR ────────────────────────────────────────────────────────
  return (
    <div style={{
      background: "var(--cream)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {/* Row 1 */}
      <div className="toolbar-scroll" style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "5px 8px", overflowX: "auto",
      }}>
        {/* File menu */}
        <Drop label="Ficheiro" icon="folder-open" Fallback={FileText}>
          <DI Fallback={FileText} label="Novo documento" onClick={onNewDocument} kbd="Ctrl+N" />
          <DI Fallback={BookOpen} label="Abrir documento" onClick={onOpenDocument} />
          <DSep />
          <DI Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
          <DI Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
          <DI Fallback={FileText} label="Exportar Word" onClick={onDownload} />
          <DSep />
          <DI Fallback={Share2} label="Partilhar" onClick={onShare} />
        </Drop>

        <Sep />
        <TB icon="arrow-undo" Fallback={Undo2} label="Desfazer" onClick={onUndo} kbd="Ctrl+Z" />
        <TB icon="arrow-redo" Fallback={Redo2} label="Refazer" onClick={onRedo} kbd="Ctrl+Y" />

        <Sep />

        {/* Paragraph styles */}
        <Drop label="Estilos" icon="text" Fallback={Pilcrow}>
          <DI Fallback={Pilcrow} label="Parágrafo" onClick={() => exec("formatBlock", "<p>")} />
          <DSep />
          <DI Fallback={Heading1} label="Título 1" onClick={onHeading1} />
          <DI Fallback={Heading2} label="Título 2" onClick={onHeading2} />
          <DI Fallback={Heading3} label="Título 3" onClick={onHeading3} />
          <DI Fallback={Heading4} label="Título 4" onClick={() => exec("formatBlock", "<h4>")} />
          <DI Fallback={Heading5} label="Título 5" onClick={() => exec("formatBlock", "<h5>")} />
          <DSep />
          <DI Fallback={Quote} label="Citação" onClick={onQuote} />
          <DI Fallback={Code} label="Bloco de código" onClick={onCode} />
        </Drop>

        {/* Font family */}
        <Sel
          options={FONT_FAMILIES}
          value={fontFamily}
          onChange={(v) => applyFont(v)}
          width={130}
        />

        {/* Font size */}
        <Sel
          options={FONT_SIZES}
          value={fontSize}
          onChange={(v) => applyFontSize(v)}
          width={72}
        />

        <Sep />
        <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
        <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
      </div>

      {/* Row 2 */}
      <div className="toolbar-scroll" style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "2px 8px 6px", overflowX: "auto",
      }}>
        {/* Text formatting */}
        <TB icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} kbd="Ctrl+B" />
        <TB icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} kbd="Ctrl+I" />
        <TB icon="underline" Fallback={Underline} label="Sublinhado" onClick={onUnderline} kbd="Ctrl+U" />
        <TB icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
        <TB icon="superscript" Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
        <TB icon="subscript" Fallback={Subscript} label="Subscrito" onClick={onSubscript} />

        <Sep />
        <TB icon="color-palette" Fallback={Palette} label="Cor do texto" onClick={onColorPicker} />
        <TB icon="highlighter" Fallback={Highlighter} label="Realçar texto" onClick={onHighlight} />

        <Sep />
        <TB icon="align-left" Fallback={AlignLeft} label="Alinhar esquerda" onClick={onAlignLeft} />
        <TB icon="align-center" Fallback={AlignCenter} label="Centrar" onClick={onAlignCenter} />
        <TB icon="align-right" Fallback={AlignRight} label="Alinhar direita" onClick={onAlignRight} />
        <TB icon="align-justify" Fallback={AlignJustify} label="Justificar" onClick={onAlignJustify} />

        <Sep />
        <TB icon="list-bullet" Fallback={List} label="Lista com marcadores" onClick={onBulletList} />
        <TB icon="list-number" Fallback={ListOrdered} label="Lista numerada" onClick={onNumberedList} />
        <TB icon="list-check" Fallback={CheckSquare} label="Lista de tarefas" onClick={() =>
          exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")
        } />
        <TB icon="indent-increase" Fallback={Plus} label="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon="indent-decrease" Fallback={Minus} label="Diminuir indentação" onClick={() => exec("outdent")} />

        <Sep />
        <TB icon="link" Fallback={Link} label="Inserir link" onClick={onLink} />
        <TB icon="image" Fallback={Image} label="Inserir imagem" onClick={onImage} />
        <TB icon="table" Fallback={Table} label="Inserir tabela" onClick={onTable} />
        <TB icon="code-slash" Fallback={Code} label="Código inline" onClick={() =>
          exec("insertHTML", "<code style='background:#f3ede3;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.88em'>código</code>")
        } />
        <TB icon="remove" Fallback={SeparatorHorizontal} label="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />

        <Sep />

        {/* Insert menu */}
        <Drop label="Inserir" icon="apps" Fallback={Plus}>
          <DI Fallback={Bookmark} label="Nota de rodapé" onClick={() => exec("insertHTML", "<sup style='color:#8a847b;font-size:.7em'>[nota]</sup>")} />
          <DI Fallback={Hash} label="Marcador" onClick={() => exec("insertHTML", "<mark style='background:#fef9c3;padding:0 2px;border-radius:2px'>marcado</mark>")} />
          <DSep />
          <DI Fallback={AlertTriangle} label="Caixa de aviso" onClick={() => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui o aviso.</div><p></p>")} />
          <DI Fallback={Info} label="Caixa de informação" onClick={() => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>")} />
          <DI Fallback={CheckCircle} label="Caixa de sucesso" onClick={() => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>✅ Sucesso:</strong> Escreve aqui.</div><p></p>")} />
          <DI Fallback={XCircle} label="Caixa de erro" onClick={() => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>❌ Erro:</strong> Escreve aqui.</div><p></p>")} />
          <DSep />
          <DI Fallback={Calendar} label="Data/hora atual" onClick={() => exec("insertText", new Date().toLocaleString("pt-PT"))} />
          <DI Fallback={WrapText} label="Quebra de página" onClick={() => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e4ddd2;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>")} />
          <DSep />
          <DI Fallback={ClipboardList} label="Adicionar nota" onClick={onAddNote} />
        </Drop>

        {/* Format menu */}
        <Drop label="Formatar" icon="options" Fallback={Settings2}>
          <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} destructive />
          <DSep />
          <DI Fallback={CaseUpper} label="MAIÚSCULAS" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase());
          }} />
          <DI Fallback={CaseSensitive} label="minúsculas" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase());
          }} />
          <DI Fallback={CaseSensitive} label="Primeira Maiúscula" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, c => c.toUpperCase()));
          }} />
          <DSep />
          <DI Fallback={FileCode} label="Localizar e substituir" onClick={() => {
            const find = prompt("Localizar:");
            if (!find) return;
            const rep = prompt("Substituir por:") ?? "";
            const el = document.querySelector("[contenteditable]") as HTMLElement;
            if (el) el.innerHTML = el.innerHTML.replaceAll(find, rep);
          }} />
          <DI Fallback={Hash} label="Contar palavras" onClick={() => {
            const el = document.querySelector("[contenteditable]") as HTMLElement;
            if (!el) return;
            const t = el.innerText.trim();
            alert(`Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.length}`);
          }} />
        </Drop>

        <Sep />
        <TB icon="remove-formatting" Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} />
      </div>
    </div>
  );
}
