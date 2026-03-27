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
  Zap, Eye, PenLine, Users, BarChart3, ZoomIn, ZoomOut, Maximize2,
  Cloud, CloudUpload, CloudCog, Star, Heart, Tag, ArrowLeft,
} from "lucide-react";

/* ─────────────────────────── CSS Keyframes (injected once) ─────────────────── */
const CSS = `
@keyframes ripple{to{opacity:0;transform:scale(2.4)}}
@keyframes popIn{
  0%{opacity:0;transform:scale(.88) translateY(-6px)}
  60%{transform:scale(1.03) translateY(1px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}
@keyframes popInUp{
  0%{opacity:0;transform:scale(.88) translateY(6px)}
  60%{transform:scale(1.03) translateY(-1px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}

.toolbar-scroll::-webkit-scrollbar{height:3px}
.toolbar-scroll::-webkit-scrollbar-track{background:transparent}
.toolbar-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}

.tb-btn{
  display:flex;align-items:center;justify-content:center;gap:3px;
  padding:0 9px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:var(--muted-foreground);
  font-size:.78rem;font-weight:500;flex-shrink:0;
  position:relative;overflow:hidden;
  transition:background .12s ease,color .12s ease,transform .1s ease,box-shadow .12s ease;
  min-width:36px;outline:none;
}
.tb-btn:hover:not(.active){
  background:var(--secondary);color:var(--foreground);transform:translateY(-1px);
  box-shadow:0 2px 8px rgba(14,12,9,.08);
}
.tb-btn.active{
  background:var(--brand-pale);color:var(--brand);
  box-shadow:inset 0 1px 3px rgba(212,82,10,.15);
}
.tb-btn:active{transform:scale(.93)!important}

.drop-btn{
  display:flex;align-items:center;gap:5px;
  padding:0 10px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:var(--muted-foreground);
  font-size:.8rem;font-weight:600;flex-shrink:0;
  transition:background .12s ease,color .12s ease,transform .1s ease;
  letter-spacing:.01em;
}
.drop-btn:hover,.drop-btn.open{background:var(--secondary);color:var(--foreground)}
.drop-btn.open{background:var(--brand-pale)!important;color:var(--brand)!important}

.popup-card{
  position:fixed;z-index:99999;
  background:var(--popover,#fff);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 16px 64px rgba(14,12,9,.18),0 4px 16px rgba(14,12,9,.1),0 0 0 1px rgba(255,255,255,.5) inset;
  animation:popIn .22s cubic-bezier(.34,1.56,.64,1) both;
  overflow:hidden;
}
.popup-card.up{animation:popInUp .22s cubic-bezier(.34,1.56,.64,1) both}

.popup-header{
  padding:12px 16px 8px;
  font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted-foreground);opacity:.7;
  border-bottom:1px solid var(--border);
}
.popup-grid{
  display:grid;gap:4px;padding:10px;
}
.popup-list{padding:6px 0}

.di-btn{
  display:flex;align-items:center;gap:10px;width:100%;
  padding:9px 16px;background:none;border:none;cursor:pointer;
  font-size:.84rem;color:var(--foreground);text-align:left;
  border-radius:0;transition:background .08s;
}
.di-btn:hover{background:var(--secondary)}
.di-btn.destructive{color:var(--destructive)}

.grid-btn{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  padding:10px 6px;border-radius:10px;border:none;cursor:pointer;
  background:transparent;color:var(--muted-foreground);
  font-size:.68rem;font-weight:500;text-align:center;
  transition:background .1s,color .1s,transform .1s;min-width:60px;
}
.grid-btn:hover{background:var(--secondary);color:var(--foreground);transform:translateY(-2px)}
.grid-btn:active{transform:scale(.92)}

.sel-btn{
  display:flex;align-items:center;gap:4px;height:36px;
  padding:0 9px;border-radius:9px;border:1px solid var(--border);
  background:var(--background);cursor:pointer;
  font-size:.78rem;font-weight:500;color:var(--foreground);flex-shrink:0;
  transition:border-color .12s,box-shadow .12s;
}
.sel-btn:hover{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-pale)}

.tb-divider{
  width:1px;height:22px;background:var(--border);margin:0 3px;flex-shrink:0;
  opacity:.7;
}
`;

function injectCSS() {
  if (document.getElementById("etb-styles")) return;
  const s = document.createElement("style");
  s.id = "etb-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────── Icon ──────────────────────────────────────────── */
function Ico({
  svg, Fallback, size = 15, color,
}: {
  svg?: string;
  Fallback: React.ComponentType<{ size?: number; color?: string }>;
  size?: number;
  color?: string;
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

/* ─────────────────────────── Ripple ─────────────────────────────────────────── */
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement("span");
    const d = Math.max(rect.width, rect.height) * 2.2;
    r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(212,82,10,.14);border-radius:50%;pointer-events:none;animation:ripple .55s ease-out forwards`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }, []);
}

/* ─────────────────────────── Toolbar Button ─────────────────────────────────── */
function TB({
  icon: SvgName, Fallback, label, onClick, active, kbd, children,
}: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  kbd?: string;
  children?: React.ReactNode;
}) {
  injectCSS();
  const ripple = useRipple();
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      onClick={ripple as any}
      title={`${label}${kbd ? ` (${kbd})` : ""}`}
      className={`tb-btn${active ? " active" : ""}`}
    >
      <Ico svg={SvgName} Fallback={Fallback} size={16} />
      {children}
    </button>
  );
}

/* ─────────────────────────── Separator ─────────────────────────────────────── */
const Sep = () => <div className="tb-divider" />;

/* ─────────────────────────── Popup Card ─────────────────────────────────────── */
interface PopupCardProps {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  align?: "left" | "right" | "center";
  minWidth?: number;
  children: React.ReactNode;
  preferUp?: boolean;
}
function PopupCard({ btnRef, open, onClose, align = "left", minWidth = 220, children, preferUp }: PopupCardProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, up: false });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const goUp = preferUp || (spaceBelow < 320 && spaceAbove > spaceBelow);

    let left = align === "right"
      ? rect.right - minWidth
      : align === "center"
        ? rect.left + rect.width / 2 - minWidth / 2
        : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - minWidth - 8));

    setPos({
      top: goUp ? rect.top - 8 : rect.bottom + 6,
      left,
      up: goUp,
    });

    const close = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeKey);
    };
  }, [open, align, minWidth, onClose, btnRef, preferUp]);

  if (!open) return null;

  return (
    <div
      ref={cardRef}
      className={`popup-card${pos.up ? " up" : ""}`}
      style={{
        top: pos.up ? undefined : pos.top,
        bottom: pos.up ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        minWidth,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── Drop (popup card trigger) ─────────────────────── */
function Drop({
  label, icon: SvgName, Fallback, children, align = "left", minWidth = 230, preferUp,
}: {
  label?: string;
  icon?: string;
  Fallback: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  minWidth?: number;
  preferUp?: boolean;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={`drop-btn${open ? " open" : ""}`}
      >
        <Ico svg={SvgName} Fallback={Fallback} size={16} />
        {label && <span>{label}</span>}
        <ChevronDown
          size={11}
          style={{
            opacity: .5,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s cubic-bezier(.34,1.56,.64,1)",
          }}
        />
      </button>
      <PopupCard
        btnRef={btnRef}
        open={open}
        onClose={() => setOpen(false)}
        align={align}
        minWidth={minWidth}
        preferUp={preferUp}
      >
        <div className="popup-list" onClick={() => setOpen(false)}>
          {children}
        </div>
      </PopupCard>
    </div>
  );
}

/* ─────────────────────────── Dropdown Item ─────────────────────────────────── */
function DI({
  icon: SvgName, Fallback, label, onClick, kbd, destructive,
}: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number }>;
  label: string;
  onClick?: () => void;
  kbd?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      className={`di-btn${destructive ? " destructive" : ""}`}
    >
      <Ico svg={SvgName} Fallback={Fallback} size={15} color={destructive ? "var(--destructive)" : undefined} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".7rem", opacity: .38, fontVariantNumeric: "tabular-nums" }}>{kbd}</span>}
    </button>
  );
}

const DSep = () => (
  <div style={{ height: 1, background: "var(--border)", margin: "4px 8px", opacity: .7 }} />
);

const DHeader = ({ title }: { title: string }) => (
  <div className="popup-header">{title}</div>
);

/* ─────────────────────────── Grid Popup (insert blocks) ─────────────────────── */
function GridDrop({
  label, icon: SvgName, Fallback, items, columns = 3, title, align = "left",
}: {
  label?: string;
  icon?: string;
  Fallback: React.ComponentType<{ size?: number }>;
  items: { icon?: string; Icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }[];
  columns?: number;
  title?: string;
  align?: "left" | "right" | "center";
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={`drop-btn${open ? " open" : ""}`}
      >
        <Ico svg={SvgName} Fallback={Fallback} size={16} />
        {label && <span>{label}</span>}
        <ChevronDown
          size={11}
          style={{
            opacity: .5,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s cubic-bezier(.34,1.56,.64,1)",
          }}
        />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={240}>
        {title && <DHeader title={title} />}
        <div
          className="popup-grid"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          onClick={() => setOpen(false)}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); item.onClick(); }}
              className="grid-btn"
              style={{ animationDelay: `${i * 25}ms`, animation: "fadeIn .18s ease both" }}
            >
              <Ico svg={item.icon} Fallback={item.Icon} size={18} />
              <span style={{ lineHeight: 1.2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ─────────────────────────── Select ─────────────────────────────────────────── */
function Sel({
  options, value, onChange, width = 100,
}: { options: { label: string; value: string }[]; value?: string; onChange: (v: string) => void; width?: number }) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="sel-btn"
        style={{ width }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? options[0]?.label}
        </span>
        <ChevronDown
          size={10}
          style={{
            opacity: .5,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .18s ease",
          }}
        />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={width}>
        <div style={{ padding: "4px 0", maxHeight: 280, overflowY: "auto" }} onClick={() => setOpen(false)}>
          {options.map((o) => (
            <button
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); }}
              className="di-btn"
              style={{
                background: value === o.value ? "var(--brand-pale)" : "none",
                color: value === o.value ? "var(--brand)" : "var(--foreground)",
                fontWeight: value === o.value ? 700 : 400,
              }}
            >
              {o.label}
              {value === o.value && <CheckCircle size={13} style={{ marginLeft: "auto", opacity: .7 }} />}
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ─────────────────────────── Color Picker Popup ─────────────────────────────── */
function ColorPickerDrop({
  label, icon: SvgName, Fallback, onColor, title = "Cor",
}: {
  label?: string;
  icon?: string;
  Fallback: React.ComponentType<{ size?: number }>;
  onColor: (color: string) => void;
  title?: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const colors = [
    "#000000", "#1a1a2e", "#16213e", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#f9fafb",
    "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d", "#16a34a", "#059669", "#0d9488",
    "#0891b2", "#0284c7", "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777",
    "#fca5a5", "#fdba74", "#fcd34d", "#86efac", "#6ee7b7", "#67e8f9", "#93c5fd", "#c4b5fd",
  ];

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={`drop-btn${open ? " open" : ""}`}
      >
        <Ico svg={SvgName} Fallback={Fallback} size={16} />
        {label && <span>{label}</span>}
        <ChevronDown size={11} style={{ opacity: .5 }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={220}>
        <DHeader title={title} />
        <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5 }}
          onClick={() => setOpen(false)}>
          {colors.map((c) => (
            <button
              key={c}
              onMouseDown={(e) => { e.preventDefault(); onColor(c); }}
              title={c}
              style={{
                width: 22, height: 22, borderRadius: 6, background: c,
                border: "2px solid rgba(255,255,255,.3)", cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                transition: "transform .1s,box-shadow .1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.25)";
                (e.currentTarget as HTMLButtonElement).style.zIndex = "1";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 10px rgba(0,0,0,.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.zIndex = "0";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,.2)";
              }}
            />
          ))}
        </div>
        <div style={{ padding: "0 12px 12px", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: ".72rem", color: "var(--muted-foreground)", opacity: .7 }}>Personalizado:</span>
          <input
            type="color"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { onColor(e.target.value); setOpen(false); }}
            style={{
              width: 30, height: 24, border: "1px solid var(--border)",
              borderRadius: 6, cursor: "pointer", padding: 2,
            }}
          />
        </div>
      </PopupCard>
    </div>
  );
}

/* ─────────────────────────── Data ───────────────────────────────────────────── */
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
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "28", "32", "36", "48", "72",
].map((s) => ({ label: `${s}pt`, value: s }));

/* ─────────────────────────── Props ──────────────────────────────────────────── */
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

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────────────── */
export default function EditorToolbar(props: EditorToolbarProps) {
  injectCSS();
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
      document.querySelectorAll("font[size='7']").forEach((f) => {
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

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "var(--cream)", borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        animation: "slideUp .22s cubic-bezier(.25,.46,.45,.94)",
      }}>
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
          <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={(c) => exec("foreColor", c)} title="Cor do texto" />
          <TB icon="highlighter" Fallback={Highlighter} label="Realçar" onClick={onHighlight} />
          <Sep />
          <TB icon="link" Fallback={Link} label="Link" onClick={onLink} />
          <TB icon="image" Fallback={Image} label="Imagem" onClick={onImage} />
          <TB icon="table" Fallback={Table} label="Tabela" onClick={onTable} />
          <Sep />
          <Drop label="+" Fallback={MoreHorizontal} align="right" preferUp>
            <DI Fallback={Heading1} label="Título 1" onClick={onHeading1} />
            <DI Fallback={Heading2} label="Título 2" onClick={onHeading2} />
            <DI Fallback={Heading3} label="Título 3" onClick={onHeading3} />
            <DSep />
            <DI icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
            <DI icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
            <DI icon="superscript" Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
            <DI icon="subscript" Fallback={Subscript} label="Subscrito" onClick={onSubscript} />
            <DSep />
            <DI icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
            <DI icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
            <DSep />
            <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} destructive />
          </Drop>
        </div>
      </div>
    );
  }

  /* ── DESKTOP ── */
  return (
    <div style={{
      background: "var(--cream)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {/* ── Row 1 ── */}
      <div className="toolbar-scroll" style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "6px 10px 4px",
      }}>

        {/* Ficheiro */}
        <Drop label="Ficheiro" icon="folder-open" Fallback={FileText} minWidth={240}>
          <DHeader title="Ficheiro" />
          <DI icon="document-add" Fallback={FileText} label="Novo documento" onClick={onNewDocument} kbd="Ctrl+N" />
          <DI icon="document-text" Fallback={BookOpen} label="Abrir documento" onClick={onOpenDocument} />
          <DSep />
          <DI icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
          <DI icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
          <DI icon="document" Fallback={FileText} label="Exportar Word" onClick={onDownload} />
          <DSep />
          <DI icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
          <DI icon="cloud-upload" Fallback={CloudUpload} label="Guardar na nuvem" onClick={onSave} />
        </Drop>

        <Sep />

        {/* Undo / Redo */}
        <TB icon="arrow-undo" Fallback={Undo2} label="Desfazer" onClick={onUndo} kbd="Ctrl+Z" />
        <TB icon="arrow-redo" Fallback={Redo2} label="Refazer" onClick={onRedo} kbd="Ctrl+Y" />

        <Sep />

        {/* Estilos (parágrafo) */}
        <Drop label="Estilos" icon="text" Fallback={Pilcrow} minWidth={220}>
          <DHeader title="Estilo de parágrafo" />
          <DI icon="text" Fallback={Pilcrow} label="Parágrafo normal" onClick={() => exec("formatBlock", "<p>")} />
          <DSep />
          <DI icon="heading" Fallback={Heading1} label="Título 1" onClick={onHeading1} />
          <DI Fallback={Heading2} label="Título 2" onClick={onHeading2} />
          <DI Fallback={Heading3} label="Título 3" onClick={onHeading3} />
          <DI Fallback={Heading4} label="Título 4" onClick={() => exec("formatBlock", "<h4>")} />
          <DI Fallback={Heading5} label="Título 5" onClick={() => exec("formatBlock", "<h5>")} />
          <DSep />
          <DI icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
          <DI icon="code-slash" Fallback={Code} label="Bloco de código" onClick={onCode} />
        </Drop>

        {/* Fonte */}
        <Sel options={FONT_FAMILIES} value={fontFamily} onChange={applyFont} width={132} />

        {/* Tamanho */}
        <Sel options={FONT_SIZES} value={fontSize} onChange={applyFontSize} width={74} />

        <Sep />

        <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
        <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
        <TB icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
        <TB icon="eye" Fallback={Eye} label="Pré-visualizar" onClick={() => {}} />

        <Sep />

        {/* View */}
        <TB icon="zoom-in" Fallback={ZoomIn} label="Ampliar" onClick={() => {}} />
        <TB icon="zoom-out" Fallback={ZoomOut} label="Reduzir" onClick={() => {}} />
        <TB icon="resize" Fallback={Maximize2} label="Ecrã completo" onClick={() => {}} />

      </div>

      {/* ── Row 2 ── */}
      <div className="toolbar-scroll" style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "2px 10px 7px",
      }}>

        {/* Formatação de texto */}
        <TB icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} kbd="Ctrl+B" />
        <TB icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} kbd="Ctrl+I" />
        <TB icon="underline" Fallback={Underline} label="Sublinhado" onClick={onUnderline} kbd="Ctrl+U" />
        <TB icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
        <TB icon="superscript" Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
        <TB icon="subscript" Fallback={Subscript} label="Subscrito" onClick={onSubscript} />

        <Sep />

        {/* Cores */}
        <ColorPickerDrop
          icon="color-palette"
          Fallback={Palette}
          onColor={(c) => exec("foreColor", c)}
          title="Cor do texto"
        />
        <ColorPickerDrop
          icon="highlighter"
          Fallback={Highlighter}
          onColor={(c) => exec("hiliteColor", c)}
          title="Realçar texto"
        />

        <Sep />

        {/* Alinhamento */}
        <TB icon="align-left" Fallback={AlignLeft} label="Alinhar esquerda" onClick={onAlignLeft} />
        <TB icon="align-center" Fallback={AlignCenter} label="Centrar" onClick={onAlignCenter} />
        <TB icon="align-right" Fallback={AlignRight} label="Alinhar direita" onClick={onAlignRight} />
        <TB icon="align-justify" Fallback={AlignJustify} label="Justificar" onClick={onAlignJustify} />

        <Sep />

        {/* Listas e indentação */}
        <TB icon="list-bullet" Fallback={List} label="Lista com marcadores" onClick={onBulletList} />
        <TB icon="list-number" Fallback={ListOrdered} label="Lista numerada" onClick={onNumberedList} />
        <TB icon="list" Fallback={CheckSquare} label="Lista de tarefas" onClick={() =>
          exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")
        } />
        <TB icon="indent-increase" Fallback={Plus} label="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon="indent-decrease" Fallback={Minus} label="Diminuir indentação" onClick={() => exec("outdent")} />

        <Sep />

        {/* Inserção de objetos */}
        <TB icon="link" Fallback={Link} label="Inserir link" onClick={onLink} />
        <TB icon="image" Fallback={Image} label="Inserir imagem" onClick={onImage} />
        <TB icon="table" Fallback={Table} label="Inserir tabela" onClick={onTable} />
        <TB icon="code-slash" Fallback={Code} label="Código inline" onClick={() =>
          exec("insertHTML", "<code style='background:#f3ede3;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.88em'>código</code>")
        } />
        <TB icon="remove" Fallback={SeparatorHorizontal} label="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />

        <Sep />

        {/* Inserir (grid popup) */}
        <GridDrop
          label="Inserir"
          icon="apps"
          Fallback={Plus}
          title="Inserir elemento"
          columns={3}
          items={[
            { icon: "quote", Icon: Quote, label: "Citação", onClick: () => onQuote?.() },
            { icon: "code-slash", Icon: Code, label: "Código", onClick: () => onCode?.() },
            { Icon: Bookmark, label: "Nota", onClick: () => exec("insertHTML", "<sup style='color:#8a847b;font-size:.7em'>[nota]</sup>") },
            { icon: "alert-circle", Icon: AlertTriangle, label: "Aviso", onClick: () => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui o aviso.</div><p></p>") },
            { icon: "information-circle", Icon: Info, label: "Info", onClick: () => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>") },
            { icon: "checkmark-circle", Icon: CheckCircle, label: "Sucesso", onClick: () => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>✅ Sucesso:</strong> Escreve aqui.</div><p></p>") },
            { icon: "close-circle", Icon: XCircle, label: "Erro", onClick: () => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>❌ Erro:</strong> Escreve aqui.</div><p></p>") },
            { Icon: Calendar, label: "Data", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
            { Icon: WrapText, label: "Quebra", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e4ddd2;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
            { Icon: ClipboardList, label: "Nota", onClick: () => onAddNote?.() },
            { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => {} },
            { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#e0f2fe;color:#0284c7;padding:2px 8px;border-radius:99px;font-size:.78em;font-weight:600'>etiqueta</span>") },
          ]}
        />

        {/* Formatar */}
        <Drop label="Formatar" icon="options" Fallback={Settings2} minWidth={240}>
          <DHeader title="Formatar texto" />
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
            if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, (c) => c.toUpperCase()));
          }} />
          <DSep />
          <DI icon="swap-horizontal" Fallback={FileCode} label="Localizar e substituir" onClick={() => {
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
          <DSep />
          <DI icon="pencil" Fallback={PenLine} label="Modo de revisão" onClick={() => {}} />
          <DI icon="stats-chart" Fallback={BarChart3} label="Estatísticas do doc." onClick={() => {}} />
          <DSep />
          <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} destructive />
        </Drop>

        <Sep />

        {/* Colaboração */}
        <Drop label="Partilhar" icon="share-social" Fallback={Share2} minWidth={220} align="right">
          <DHeader title="Partilhar & Exportar" />
          <DI icon="people" Fallback={Users} label="Convidar colaborador" onClick={() => {}} />
          <DI icon="share-social" Fallback={Share2} label="Copiar link" onClick={onShare} />
          <DSep />
          <DI icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
          <DI icon="document-text" Fallback={FileText} label="Exportar Word" onClick={onDownload} />
          <DI icon="cloud-upload" Fallback={CloudUpload} label="Guardar na nuvem" onClick={onSave} />
          <DI icon="cloud-done" Fallback={CloudCog} label="Estado da nuvem" onClick={() => {}} />
          <DSep />
          <DI icon="logo-twitter" Fallback={Share2} label="Publicar no X" onClick={() => {}} />
          <DI icon="logo-linkedin" Fallback={Users} label="Publicar no LinkedIn" onClick={() => {}} />
        </Drop>

      </div>
    </div>
  );
}
