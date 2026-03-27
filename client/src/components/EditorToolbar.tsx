import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Image, Table, Undo2, Redo2,
  Save, Download, Share2, Type, Code, Quote, Highlighter,
  Superscript, Subscript, Palette, FileText, Minus,
  CheckSquare, Indent, Outdent, FilePlus, FolderOpen,
  ChevronDown, MoreHorizontal, Heading1, Heading2, Heading3,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface EditorToolbarProps {
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
  onFontSize?: (size: string) => void; onFontFamily?: (family: string) => void;
}

const FONT_SIZES = ["8","9","10","11","12","14","16","18","20","22","24","26","28","32","36","48","72"];
const FONT_FAMILIES = [
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

// ── Tiny button ───────────────────────────────────────────────────────────────
interface TBProps {
  icon?: React.ReactNode; label?: string; title: string;
  onClick?: () => void; active?: boolean; danger?: boolean;
  style?: React.CSSProperties;
}
function TB({ icon, label, title, onClick, active, danger, style }: TBProps) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        height: 30, padding: label ? "0 8px" : "0 7px",
        minWidth: label ? undefined : 30,
        borderRadius: 6, border: "none", cursor: "pointer",
        fontSize: 11, fontWeight: 500,
        background: active ? "rgba(212,82,10,.12)" : "transparent",
        color: danger ? "#c0392b" : active ? "#d4520a" : "var(--muted-foreground, #666)",
        transition: "background 0.1s, color 0.1s",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "rgba(212,82,10,.12)" : "transparent"; }}
    >
      {icon}
      {label && <span style={{ marginLeft: icon ? 2 : 0 }}>{label}</span>}
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────
function Sep() {
  return <div style={{ width: 1, height: 20, background: "var(--border,#e0e0e0)", margin: "0 3px", flexShrink: 0 }} />;
}

// ── Dropdown menu ─────────────────────────────────────────────────────────────
interface DropItem {
  icon?: React.ReactNode; label: string; onClick?: () => void;
  kbd?: string; sep?: never;
}
interface DropSep { sep: true; label?: never; }
type DropEntry = DropItem | DropSep;

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);
  return { open, setOpen, ref };
}

interface DropMenuProps {
  trigger: React.ReactNode;
  items: DropEntry[];
  align?: "left" | "right";
  up?: boolean; // open upward
}
function DropMenu({ trigger, items, align = "left", up = false }: DropMenuProps) {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <div onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}>
        {trigger}
      </div>
      {open && (
        <div style={{
          position: "fixed",
          zIndex: 99999,
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.1)",
          minWidth: 200,
          padding: "5px 0",
          ...((() => {
            const el = ref.current;
            if (!el) return {};
            const r = el.getBoundingClientRect();
            return up
              ? { bottom: window.innerHeight - r.top + 6, left: align === "right" ? r.right - 200 : r.left }
              : { top: r.bottom + 4, left: align === "right" ? r.right - 200 : r.left };
          })()),
        }}>
          {items.map((item, i) =>
            "sep" in item && item.sep ? (
              <div key={i} style={{ height: 1, background: "#f0f0f0", margin: "3px 0" }} />
            ) : (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); (item as DropItem).onClick?.(); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "8px 14px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, color: "#222", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {(item as DropItem).icon && <span style={{ opacity: 0.6 }}>{(item as DropItem).icon}</span>}
                <span style={{ flex: 1 }}>{(item as DropItem).label}</span>
                {(item as DropItem).kbd && (
                  <span style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>
                    {(item as DropItem).kbd}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Font size picker ──────────────────────────────────────────────────────────
function FontSizePicker({ onSelect }: { onSelect: (s: string) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const [current, setCurrent] = useState("12");
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        style={{
          display: "flex", alignItems: "center", gap: 3,
          height: 28, padding: "0 6px", borderRadius: 6,
          border: "1px solid #e0e0e0", background: "#fafafa",
          cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#333",
          minWidth: 52,
        }}
        title="Tamanho da fonte"
      >
        <span style={{ flex: 1, textAlign: "center" }}>{current}pt</span>
        <ChevronDown size={10} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div style={{
          position: "fixed", zIndex: 99999,
          background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
          maxHeight: 240, overflowY: "auto",
          minWidth: 80,
          ...((() => {
            const el = ref.current;
            if (!el) return {};
            const r = el.getBoundingClientRect();
            return { top: r.bottom + 4, left: r.left };
          })()),
        }}>
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                setCurrent(s);
                onSelect(s);
                setOpen(false);
              }}
              style={{
                display: "block", width: "100%", padding: "6px 14px",
                background: s === current ? "#fdf1ea" : "none",
                color: s === current ? "#d4520a" : "#222",
                border: "none", cursor: "pointer", fontSize: 13, textAlign: "center",
                fontWeight: s === current ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (s !== current) e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = s === current ? "#fdf1ea" : "none"; }}
            >
              {s}pt
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Font family picker ────────────────────────────────────────────────────────
function FontFamilyPicker({ onSelect }: { onSelect: (f: string) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const [current, setCurrent] = useState("Calibri");
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          height: 28, padding: "0 8px", borderRadius: 6,
          border: "1px solid #e0e0e0", background: "#fafafa",
          cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#333",
          minWidth: 100, maxWidth: 120,
        }}
        title="Tipo de letra"
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {current}
        </span>
        <ChevronDown size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "fixed", zIndex: 99999,
          background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
          minWidth: 180,
          ...((() => {
            const el = ref.current;
            if (!el) return {};
            const r = el.getBoundingClientRect();
            return { top: r.bottom + 4, left: r.left };
          })()),
        }}>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              onMouseDown={(e) => {
                e.preventDefault();
                setCurrent(f.label);
                onSelect(f.value);
                setOpen(false);
              }}
              style={{
                display: "block", width: "100%", padding: "8px 14px",
                background: f.label === current ? "#fdf1ea" : "none",
                color: f.label === current ? "#d4520a" : "#222",
                border: "none", cursor: "pointer",
                fontSize: 13, textAlign: "left",
                fontFamily: f.value,
                fontWeight: f.label === current ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (f.label !== current) e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = f.label === current ? "#fdf1ea" : "none"; }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Heading style picker ──────────────────────────────────────────────────────
function HeadingPicker({ onHeading1, onHeading2, onHeading3 }: { onHeading1?: () => void; onHeading2?: () => void; onHeading3?: () => void }) {
  return (
    <DropMenu
      trigger={
        <TB
          icon={<Type size={14} />}
          label="Estilo"
          title="Estilo de parágrafo"
          style={{ paddingRight: 4 }}
        />
      }
      items={[
        { label: "Parágrafo", icon: <Type size={13} />, onClick: () => exec("formatBlock", "<p>") },
        { sep: true },
        { label: "Título 1", icon: <Heading1 size={13} />, onClick: onHeading1 },
        { label: "Título 2", icon: <Heading2 size={13} />, onClick: onHeading2 },
        { label: "Título 3", icon: <Heading3 size={13} />, onClick: onHeading3 },
        { label: "Título 4", icon: <Type size={13} />, onClick: () => exec("formatBlock", "<h4>") },
        { label: "Título 5", icon: <Type size={13} />, onClick: () => exec("formatBlock", "<h5>") },
        { sep: true },
        { label: "Citação", icon: <Quote size={13} />, onClick: () => exec("formatBlock", "<blockquote>") },
        { label: "Código", icon: <Code size={13} />, onClick: () => exec("formatBlock", "<pre>") },
      ]}
    />
  );
}

// ── Insert menu ───────────────────────────────────────────────────────────────
function InsertMenu({ onLink, onImage, onTable, onAddNote }: Pick<EditorToolbarProps, "onLink" | "onImage" | "onTable" | "onAddNote">) {
  return (
    <DropMenu
      trigger={<TB icon={<MoreHorizontal size={14} />} label="Inserir" title="Inserir elementos" />}
      items={[
        { label: "Hiperligação", icon: <Link size={13} />, onClick: onLink },
        { label: "Imagem", icon: <Image size={13} />, onClick: onImage },
        { label: "Tabela", icon: <Table size={13} />, onClick: onTable },
        { sep: true },
        { label: "Lista de tarefas", icon: <CheckSquare size={13} />, onClick: () => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox' /> Tarefa</li></ul>") },
        { label: "Linha horizontal", icon: <Minus size={13} />, onClick: () => exec("insertHorizontalRule") },
        { label: "Bloco de código", icon: <Code size={13} />, onClick: () => exec("insertHTML", "<pre style='background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;font-size:13px'>código aqui</pre>") },
        { sep: true },
        { label: "Aviso ⚠️", onClick: () => exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:4px"><strong>⚠️ Atenção:</strong> Escreve aqui.</div>`) },
        { label: "Info ℹ️", onClick: () => exec("insertHTML", `<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:4px"><strong>ℹ️ Info:</strong> Escreve aqui.</div>`) },
        { label: "Sucesso ✅", onClick: () => exec("insertHTML", `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:4px"><strong>✅ Sucesso:</strong> Escreve aqui.</div>`) },
        { label: "Erro ❌", onClick: () => exec("insertHTML", `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:4px"><strong>❌ Erro:</strong> Escreve aqui.</div>`) },
        { sep: true },
        { label: "Data e hora atual", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
        { label: "Nota 📝", onClick: onAddNote },
      ]}
    />
  );
}

// ── Format more menu ──────────────────────────────────────────────────────────
function FormatMenu({ onSuperscript, onSubscript, onClearFormatting }: Pick<EditorToolbarProps, "onSuperscript" | "onSubscript" | "onClearFormatting">) {
  return (
    <DropMenu
      trigger={<TB icon={<ChevronDown size={12} />} title="Mais formatação" style={{ width: 24, padding: 0 }} />}
      items={[
        { label: "Sobrescrito", icon: <Superscript size={13} />, onClick: onSuperscript },
        { label: "Subscrito", icon: <Subscript size={13} />, onClick: onSubscript },
        { sep: true },
        { label: "MAIÚSCULAS", onClick: () => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); } },
        { label: "minúsculas", onClick: () => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); } },
        { sep: true },
        { label: "Limpar formatação", icon: <FileText size={13} />, onClick: onClearFormatting, kbd: "Ctrl+\\" },
        { label: "Localizar e substituir", onClick: () => {
          const f = prompt("Localizar:"); if (!f) return;
          const r = prompt("Substituir por:") ?? "";
          const el = document.querySelector("[contenteditable]") as HTMLElement;
          if (el) el.innerHTML = el.innerHTML.replaceAll(f, r);
        }},
        { label: "Contar palavras", onClick: () => {
          const el = document.querySelector("[contenteditable]") as HTMLElement;
          if (!el) return;
          const t = el.innerText.trim();
          alert(`Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.length}`);
        }},
      ]}
    />
  );
}

// ── File menu ─────────────────────────────────────────────────────────────────
function FileMenu(props: Pick<EditorToolbarProps, "onSave" | "onNewDocument" | "onOpenDocument" | "onDownload" | "onShare" | "onExportPDF">) {
  return (
    <DropMenu
      trigger={<TB icon={<FileText size={14} />} label="Ficheiro" title="Menu de ficheiro" />}
      items={[
        { label: "Novo documento", icon: <FilePlus size={13} />, onClick: props.onNewDocument, kbd: "Ctrl+N" },
        { label: "Abrir documento", icon: <FolderOpen size={13} />, onClick: props.onOpenDocument },
        { sep: true },
        { label: "Guardar", icon: <Save size={13} />, onClick: props.onSave, kbd: "Ctrl+S" },
        { sep: true },
        { label: "Exportar PDF", icon: <Download size={13} />, onClick: props.onExportPDF },
        { label: "Exportar Word (.doc)", icon: <Download size={13} />, onClick: props.onDownload },
        { sep: true },
        { label: "Partilhar", icon: <Share2 size={13} />, onClick: props.onShare },
      ]}
    />
  );
}

// ── Row of toolbar items ──────────────────────────────────────────────────────
function ToolbarRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 1,
      padding: "3px 8px", flexWrap: "nowrap",
      overflowX: "auto", overflowY: "visible",
      scrollbarWidth: "none",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Main toolbar ──────────────────────────────────────────────────────────────
export default function EditorToolbar(props: EditorToolbarProps) {
  const {
    onBold, onItalic, onUnderline, onStrikethrough,
    onAlignLeft, onAlignCenter, onAlignRight, onAlignJustify,
    onBulletList, onNumberedList, onLink, onImage, onTable,
    onSave, onUndo, onRedo, onNewDocument, onOpenDocument,
    onDownload, onShare, onHeading1, onHeading2, onHeading3,
    onCode, onQuote, onHighlight, onSuperscript, onSubscript,
    onClearFormatting, onExportPDF, onAddNote, onColorPicker,
  } = props;

  const applyFontSize = useCallback((size: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    if (sel.isCollapsed) {
      exec("fontSize", "7");
      // Override the font size 7 element that execCommand creates
      document.querySelectorAll("font[size='7']").forEach((el) => {
        (el as HTMLElement).removeAttribute("size");
        (el as HTMLElement).style.fontSize = `${size}pt`;
      });
    } else {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}pt`;
      range.surroundContents(span);
    }
  }, []);

  const applyFont = useCallback((family: string) => {
    exec("fontName", family);
  }, []);

  // ── Desktop toolbar (2 rows) ────────────────────────────────────────────────
  const desktopToolbar = (
    <div style={{
      borderBottom: "1px solid var(--border,#e0e0e0)",
      background: "#fff",
      flexShrink: 0,
      position: "relative",
      zIndex: 100,
    }}>
      {/* Row 1 */}
      <ToolbarRow style={{ borderBottom: "1px solid #f0f0f0" }}>
        <FileMenu onSave={onSave} onNewDocument={onNewDocument} onOpenDocument={onOpenDocument} onDownload={onDownload} onShare={onShare} onExportPDF={onExportPDF} />
        <Sep />
        <TB icon={<Undo2 size={14} />} title="Desfazer (Ctrl+Z)" onClick={onUndo} />
        <TB icon={<Redo2 size={14} />} title="Refazer (Ctrl+Y)" onClick={onRedo} />
        <Sep />
        <HeadingPicker onHeading1={onHeading1} onHeading2={onHeading2} onHeading3={onHeading3} />
        <FontFamilyPicker onSelect={applyFont} />
        <FontSizePicker onSelect={applyFontSize} />
        <Sep />
        <TB icon={<Save size={14} />} title="Guardar (Ctrl+S)" onClick={onSave} />
      </ToolbarRow>

      {/* Row 2 */}
      <ToolbarRow>
        {/* Text style */}
        <TB icon={<Bold size={14} />} title="Negrito (Ctrl+B)" onClick={onBold} />
        <TB icon={<Italic size={14} />} title="Itálico (Ctrl+I)" onClick={onItalic} />
        <TB icon={<Underline size={14} />} title="Sublinhado (Ctrl+U)" onClick={onUnderline} />
        <TB icon={<Strikethrough size={14} />} title="Riscado" onClick={onStrikethrough} />
        <TB icon={<Highlighter size={14} />} title="Realçar texto" onClick={onHighlight} />
        <TB icon={<Palette size={14} />} title="Cor do texto" onClick={onColorPicker} />
        <FormatMenu onSuperscript={onSuperscript} onSubscript={onSubscript} onClearFormatting={onClearFormatting} />
        <Sep />

        {/* Align */}
        <TB icon={<AlignLeft size={14} />} title="Alinhar esquerda" onClick={onAlignLeft} />
        <TB icon={<AlignCenter size={14} />} title="Centrar" onClick={onAlignCenter} />
        <TB icon={<AlignRight size={14} />} title="Alinhar direita" onClick={onAlignRight} />
        <TB icon={<AlignJustify size={14} />} title="Justificar" onClick={onAlignJustify} />
        <Sep />

        {/* Lists & indent */}
        <TB icon={<List size={14} />} title="Lista com marcadores" onClick={onBulletList} />
        <TB icon={<ListOrdered size={14} />} title="Lista numerada" onClick={onNumberedList} />
        <TB icon={<CheckSquare size={14} />} title="Lista de tarefas" onClick={() => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;gap:8px;align-items:center'><input type='checkbox'/> Tarefa</li></ul>")} />
        <TB icon={<Indent size={14} />} title="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon={<Outdent size={14} />} title="Diminuir indentação" onClick={() => exec("outdent")} />
        <Sep />

        {/* Insert */}
        <TB icon={<Link size={14} />} title="Inserir ligação" onClick={onLink} />
        <TB icon={<Image size={14} />} title="Inserir imagem" onClick={onImage} />
        <TB icon={<Table size={14} />} title="Inserir tabela" onClick={onTable} />
        <TB icon={<Quote size={14} />} title="Citação" onClick={onQuote} />
        <TB icon={<Code size={14} />} title="Bloco de código" onClick={onCode} />
        <TB icon={<Minus size={14} />} title="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />
        <InsertMenu onLink={onLink} onImage={onImage} onTable={onTable} onAddNote={onAddNote} />
      </ToolbarRow>
    </div>
  );

  // ── Mobile bottom bar ───────────────────────────────────────────────────────
  const mobileBar = (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "#fff",
      borderTop: "1px solid #e0e0e0",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -2px 16px rgba(0,0,0,.10)",
    }}>
      {/* Scrollable main actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        overflowX: "auto", padding: "6px 8px",
        scrollbarWidth: "none",
      }}>
        <TB icon={<Bold size={18} />} title="Negrito" onClick={onBold} style={{ height: 40, width: 40 }} />
        <TB icon={<Italic size={18} />} title="Itálico" onClick={onItalic} style={{ height: 40, width: 40 }} />
        <TB icon={<Underline size={18} />} title="Sublinhado" onClick={onUnderline} style={{ height: 40, width: 40 }} />
        <TB icon={<Strikethrough size={18} />} title="Riscado" onClick={onStrikethrough} style={{ height: 40, width: 40 }} />
        <Sep />
        <TB icon={<AlignLeft size={18} />} title="Esquerda" onClick={onAlignLeft} style={{ height: 40, width: 40 }} />
        <TB icon={<AlignCenter size={18} />} title="Centro" onClick={onAlignCenter} style={{ height: 40, width: 40 }} />
        <TB icon={<AlignRight size={18} />} title="Direita" onClick={onAlignRight} style={{ height: 40, width: 40 }} />
        <TB icon={<AlignJustify size={18} />} title="Justificar" onClick={onAlignJustify} style={{ height: 40, width: 40 }} />
        <Sep />
        <TB icon={<List size={18} />} title="Lista" onClick={onBulletList} style={{ height: 40, width: 40 }} />
        <TB icon={<ListOrdered size={18} />} title="Lista numerada" onClick={onNumberedList} style={{ height: 40, width: 40 }} />
        <Sep />
        <TB icon={<Palette size={18} />} title="Cor" onClick={onColorPicker} style={{ height: 40, width: 40 }} />
        <TB icon={<Highlighter size={18} />} title="Realçar" onClick={onHighlight} style={{ height: 40, width: 40 }} />
        <Sep />
        <TB icon={<Undo2 size={18} />} title="Desfazer" onClick={onUndo} style={{ height: 40, width: 40 }} />
        <TB icon={<Redo2 size={18} />} title="Refazer" onClick={onRedo} style={{ height: 40, width: 40 }} />
        <Sep />
        <DropMenu
          up
          align="right"
          trigger={<TB icon={<MoreHorizontal size={18} />} title="Mais" style={{ height: 40, width: 40 }} />}
          items={[
            { label: "Tipo de letra", icon: <Type size={13} />, onClick: () => { const f = prompt("Nome da fonte:"); if (f) applyFont(f); } },
            { label: "Tamanho", icon: <Type size={13} />, onClick: () => { const s = prompt("Tamanho (pt):"); if (s) applyFontSize(s); } },
            { sep: true },
            { label: "Título 1", icon: <Heading1 size={13} />, onClick: onHeading1 },
            { label: "Título 2", icon: <Heading2 size={13} />, onClick: onHeading2 },
            { label: "Título 3", icon: <Heading3 size={13} />, onClick: onHeading3 },
            { sep: true },
            { label: "Inserir ligação", icon: <Link size={13} />, onClick: onLink },
            { label: "Inserir imagem", icon: <Image size={13} />, onClick: onImage },
            { label: "Inserir tabela", icon: <Table size={13} />, onClick: onTable },
            { sep: true },
            { label: "Guardar", icon: <Save size={13} />, onClick: onSave, kbd: "Ctrl+S" },
            { label: "Exportar PDF", icon: <Download size={13} />, onClick: onExportPDF },
            { label: "Exportar Word", icon: <Download size={13} />, onClick: onDownload },
          ]}
        />
      </div>

      {/* Font size & family row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 8px 6px",
        borderTop: "1px solid #f5f5f5",
      }}>
        <FontFamilyPicker onSelect={applyFont} />
        <FontSizePicker onSelect={applyFontSize} />
        <div style={{ flex: 1 }} />
        <HeadingPicker onHeading1={onHeading1} onHeading2={onHeading2} onHeading3={onHeading3} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible top toolbar */}
      <div className="hidden md:block">{desktopToolbar}</div>
      {/* Mobile: bottom bar */}
      <div className="md:hidden">{mobileBar}</div>
    </>
  );
}
