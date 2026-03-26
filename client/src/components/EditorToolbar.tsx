import { useState, useRef, useEffect } from "react";

// SVG icon from assets
const Ico = ({ name, size = 16 }: { name: string; size?: number }) => (
  <img src={`/assets/icons/svg/${name}.svg`} alt="" style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }} />
);

// Toolbar button
const TB = ({
  icon, title, onClick, active = false, children
}: {
  icon?: string; title: string; onClick?: () => void; active?: boolean; children?: React.ReactNode;
}) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
    title={title}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      padding: "0 7px", height: 28, borderRadius: 6, border: "none", cursor: "pointer",
      background: active ? "var(--secondary, #f4f4f5)" : "transparent",
      color: active ? "var(--foreground, #111)" : "var(--muted-foreground, #777)",
      fontSize: ".78rem", fontWeight: 500, transition: "background .12s",
      flexShrink: 0,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary, #f4f4f5)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = active ? "var(--secondary, #f4f4f5)" : "transparent")}
  >
    {icon && <Ico name={icon} size={15} />}
    {children}
  </button>
);

// Separator
const Sep = () => (
  <div style={{ width: 1, height: 20, background: "var(--border, #e5e7eb)", margin: "0 2px", flexShrink: 0 }} />
);

// Dropdown group
function DropGroup({ label, icon, children }: { label?: string; icon?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "0 7px", height: 28, borderRadius: 6, border: "none", cursor: "pointer",
          background: open ? "var(--secondary, #f4f4f5)" : "transparent",
          color: "var(--muted-foreground, #777)", fontSize: ".78rem", fontWeight: 500,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary, #f4f4f5)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "var(--secondary, #f4f4f5)" : "transparent")}
      >
        {icon && <Ico name={icon} size={15} />}
        {label && <span>{label}</span>}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: .5 }}>
          <path d="M5 7L1 3h8z"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 500,
          background: "var(--background, #fff)", border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,.12)", minWidth: 190, padding: "5px 0",
          animation: "tbDropIn .13s ease",
        }}>
          <style>{`@keyframes tbDropIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
          {children}
        </div>
      )}
    </div>
  );
}

// Dropdown item
const DI = ({ icon, label, onClick, kbd }: { icon?: string; label: string; onClick?: () => void; kbd?: string }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
    style={{
      display: "flex", alignItems: "center", gap: 9, width: "100%",
      padding: "8px 12px", background: "none", border: "none", cursor: "pointer",
      fontSize: ".83rem", color: "var(--foreground, #111)", textAlign: "left",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary, #f4f4f5)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
  >
    {icon && <Ico name={icon} size={15} />}
    <span style={{ flex: 1 }}>{label}</span>
    {kbd && <span style={{ fontSize: ".72rem", opacity: .4 }}>{kbd}</span>}
  </button>
);

const DSep = () => <div style={{ height: 1, background: "var(--border, #e5e7eb)", margin: "3px 0" }} />;

// Font size selector
const FontSizes = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];
// Font families
const Fonts = [
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
];

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
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const {
    onBold, onItalic, onUnderline, onStrikethrough, onAlignLeft, onAlignCenter,
    onAlignRight, onAlignJustify, onBulletList, onNumberedList, onLink, onImage,
    onTable, onSave, onUndo, onRedo, onNewDocument, onOpenDocument, onDownload,
    onShare, onHeading1, onHeading2, onHeading3, onCode, onQuote, onHighlight,
    onSuperscript, onSubscript, onClearFormatting, onExportPDF, onAddNote, onColorPicker,
  } = props;

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const handleFontSize = (size: string) => exec("fontSize", "7"); // placeholder then override
  const applyFontSize = (size: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    exec("insertHTML", `<span style="font-size:${size}pt">${sel.toString()}</span>`);
  };
  const applyFont = (font: string) => exec("fontName", font);

  return (
    <div style={{
      borderBottom: "1px solid var(--border, #e5e7eb)",
      background: "var(--background, #fff)",
      flexShrink: 0,
      overflowX: "auto",
      overflowY: "hidden",
    }}>
      {/* Row 1: File ops + history + headings + font */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px", flexWrap: "nowrap" }}>

        {/* File */}
        <DropGroup icon="folder-open" label="Ficheiro">
          <DI icon="document-add" label="Novo documento" onClick={onNewDocument} kbd="Ctrl+N" />
          <DI icon="folder-open" label="Abrir documento" onClick={onOpenDocument} />
          <DSep />
          <DI icon="save" label="Guardar" onClick={onSave} kbd="Ctrl+S" />
          <DI icon="download" label="Exportar PDF" onClick={onExportPDF} />
          <DI icon="document-text" label="Exportar Word (.doc)" onClick={onDownload} />
          <DSep />
          <DI icon="share-social" label="Partilhar" onClick={onShare} />
        </DropGroup>

        <Sep />

        {/* Undo / Redo */}
        <TB icon="arrow-undo" title="Desfazer (Ctrl+Z)" onClick={onUndo} />
        <TB icon="arrow-redo" title="Refazer (Ctrl+Y)" onClick={onRedo} />

        <Sep />

        {/* Headings */}
        <DropGroup icon="text" label="Estilos">
          <DI icon="text" label="Parágrafo normal" onClick={() => exec("formatBlock", "<p>")} />
          <DSep />
          <DI icon="heading" label="Título 1" onClick={onHeading1} />
          <DI icon="heading" label="Título 2" onClick={onHeading2} />
          <DI icon="heading" label="Título 3" onClick={onHeading3} />
          <DI icon="heading" label="Título 4" onClick={() => exec("formatBlock", "<h4>")} />
          <DI icon="heading" label="Título 5" onClick={() => exec("formatBlock", "<h5>")} />
          <DSep />
          <DI icon="quote" label="Citação" onClick={onQuote} />
          <DI icon="code-slash" label="Bloco de código" onClick={onCode} />
        </DropGroup>

        {/* Font family */}
        <DropGroup icon="text" label="Fonte">
          {Fonts.map((f) => (
            <DI key={f.value} label={f.label} onClick={() => applyFont(f.value)} />
          ))}
        </DropGroup>

        {/* Font size */}
        <DropGroup icon="resize" label="Tamanho">
          {FontSizes.map((s) => (
            <DI key={s} label={`${s} pt`} onClick={() => applyFontSize(s)} />
          ))}
        </DropGroup>

        <Sep />
        <TB icon="save" title="Guardar (Ctrl+S)" onClick={onSave} />
      </div>

      {/* Row 2: Formatting tools */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 8px 5px", flexWrap: "nowrap", overflowX: "auto" }}>

        {/* Bold / Italic / Underline / Strike */}
        <TB icon="bold" title="Negrito (Ctrl+B)" onClick={onBold} />
        <TB icon="italic" title="Itálico (Ctrl+I)" onClick={onItalic} />
        <TB icon="underline" title="Sublinhado (Ctrl+U)" onClick={onUnderline} />
        <TB icon="strikethrough" title="Riscado" onClick={onStrikethrough} />
        <TB icon="superscript" title="Sobrescrito" onClick={onSuperscript} />
        <TB icon="subscript" title="Subscrito" onClick={onSubscript} />

        <Sep />

        {/* Color */}
        <TB icon="color-palette" title="Cor do texto" onClick={onColorPicker} />
        <TB icon="highlighter" title="Realçar texto" onClick={onHighlight} />

        <Sep />

        {/* Align */}
        <TB icon="align-left" title="Alinhar à esquerda" onClick={onAlignLeft} />
        <TB icon="align-center" title="Centrar" onClick={onAlignCenter} />
        <TB icon="align-right" title="Alinhar à direita" onClick={onAlignRight} />
        <TB icon="align-justify" title="Justificar" onClick={onAlignJustify} />

        <Sep />

        {/* Lists & indent */}
        <TB icon="list-bullet" title="Lista com marcadores" onClick={onBulletList} />
        <TB icon="list-number" title="Lista numerada" onClick={onNumberedList} />
        <TB icon="list-check" title="Lista de tarefas" onClick={() => exec("insertHTML", "<ul style='list-style:none'><li><input type='checkbox' /> Tarefa</li></ul>")} />
        <TB icon="indent-increase" title="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon="indent-decrease" title="Diminuir indentação" onClick={() => exec("outdent")} />

        <Sep />

        {/* Insert */}
        <TB icon="link" title="Inserir ligação" onClick={onLink} />
        <TB icon="image" title="Inserir imagem" onClick={onImage} />
        <TB icon="table" title="Inserir tabela" onClick={onTable} />
        <TB icon="code-slash" title="Código inline" onClick={() => exec("insertHTML", "<code>código</code>")} />
        <TB icon="remove" title="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />

        <Sep />

        {/* Advanced */}
        <DropGroup icon="apps" label="Inserir">
          <DI icon="document-add" label="Nota de rodapé" onClick={() => exec("insertHTML", `<sup style="color:#888;font-size:.7em">[nota]</sup>`)} />
          <DI icon="bookmark" label="Marcador" onClick={() => exec("insertHTML", `<mark style="background:#fef9c3;padding:0 2px">texto marcado</mark>`)} />
          <DI icon="alert-circle" label="Aviso / Alerta" onClick={() => exec("insertHTML", `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:4px;font-size:.92em"><strong>⚠️ Atenção:</strong> Escreve aqui o aviso.</div>`)} />
          <DI icon="information-circle" label="Caixa de informação" onClick={() => exec("insertHTML", `<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:4px;font-size:.92em"><strong>ℹ️ Info:</strong> Escreve aqui.</div>`)} />
          <DI icon="checkmark-circle" label="Caixa de sucesso" onClick={() => exec("insertHTML", `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:4px;font-size:.92em"><strong>✅ Sucesso:</strong> Escreve aqui.</div>`)} />
          <DI icon="close-circle" label="Caixa de erro" onClick={() => exec("insertHTML", `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:4px;font-size:.92em"><strong>❌ Erro:</strong> Escreve aqui.</div>`)} />
          <DSep />
          <DI icon="stats-chart" label="Página em branco (quebra)" onClick={() => exec("insertHTML", `<div style="page-break-after:always;border-bottom:2px dashed #ddd;margin:24px 0;text-align:center;color:#bbb;font-size:.75em;padding-bottom:8px">— Quebra de página —</div>`)} />
          <DI icon="text" label="Data/hora atual" onClick={() => exec("insertText", new Date().toLocaleString("pt-PT"))} />
          <DSep />
          <DI icon="pencil" label="Adicionar nota" onClick={onAddNote} />
        </DropGroup>

        <DropGroup icon="options" label="Formatar">
          <DI icon="remove-formatting" label="Limpar formatação" onClick={onClearFormatting} />
          <DSep />
          <DI icon="text" label="MAIÚSCULAS" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase());
          }} />
          <DI icon="text" label="minúsculas" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase());
          }} />
          <DI icon="text" label="Primeira Maiúscula" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, (c) => c.toUpperCase()));
          }} />
          <DSep />
          <DI icon="swap-horizontal" label="Localizar e substituir" onClick={() => {
            const find = prompt("Localizar:");
            if (!find) return;
            const replace = prompt("Substituir por:") ?? "";
            const el = document.querySelector("[contenteditable]") as HTMLElement;
            if (el) el.innerHTML = el.innerHTML.replaceAll(find, replace);
          }} />
          <DI icon="stats-chart" label="Contar palavras" onClick={() => {
            const el = document.querySelector("[contenteditable]") as HTMLElement;
            if (!el) return;
            const text = el.innerText.trim();
            const words = text.split(/\s+/).filter(Boolean).length;
            alert(`Palavras: ${words}\nCaracteres: ${text.length}\nLinhas: ${text.split(/\n/).length}`);
          }} />
        </DropGroup>

        <Sep />
        <TB icon="remove-formatting" title="Limpar formatação" onClick={onClearFormatting} />
      </div>
    </div>
  );
}
