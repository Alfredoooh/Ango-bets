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

/* ── CSS injected once ───────────────────────────────────────────────── */
const ETB_CSS = `
@keyframes etbRipple  { to { opacity:0; transform:scale(2.6); } }
@keyframes etbPopIn   {
  0%   { opacity:0; transform:scale(.86) translateY(-7px); }
  62%  { transform:scale(1.03) translateY(1px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes etbPopInUp {
  0%   { opacity:0; transform:scale(.86) translateY(7px); }
  62%  { transform:scale(1.03) translateY(-1px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes etbFadeIn { from{opacity:0} to{opacity:1} }
@keyframes etbSlideUp{ from{transform:translateY(100%)} to{transform:translateY(0)} }

.etb-scroll::-webkit-scrollbar{height:3px}
.etb-scroll::-webkit-scrollbar-track{background:transparent}
.etb-scroll::-webkit-scrollbar-thumb{background:#d4d4d4;border-radius:99px}
.etb-scroll{-ms-overflow-style:none;scrollbar-width:thin}

/* ── TOOLBAR BUTTON ── */
.etb-btn{
  display:flex;align-items:center;justify-content:center;gap:3px;
  padding:0 9px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:#666;
  font-size:.78rem;font-weight:500;flex-shrink:0;
  position:relative;overflow:hidden;outline:none;
  transition:background .12s,color .12s,transform .1s,box-shadow .12s;
  min-width:36px;-webkit-tap-highlight-color:transparent;
}
.etb-btn:hover:not(.etb-on){
  background:#f2f2f2;color:#0a0a0a;
  transform:translateY(-1px);
  box-shadow:0 2px 8px rgba(0,0,0,.07);
}
.etb-btn.etb-on{background:#0a0a0a;color:#fff;}
.etb-btn:active{transform:scale(.92)!important}

/* ── DROP BUTTON ── */
.etb-drop{
  display:flex;align-items:center;gap:5px;
  padding:0 10px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:#555;
  font-size:.8rem;font-weight:600;flex-shrink:0;letter-spacing:.01em;
  transition:background .12s,color .12s;
  -webkit-tap-highlight-color:transparent;
}
.etb-drop:hover,.etb-drop.etb-on{background:#f2f2f2;color:#0a0a0a}
.etb-drop.etb-on{background:#0a0a0a!important;color:#fff!important}
.etb-drop.etb-on .etb-chev{filter:invert(1)}

/* ── SELECT ── */
.etb-sel{
  display:flex;align-items:center;gap:4px;height:36px;
  padding:0 9px;border-radius:9px;
  border:1.5px solid #e0e0e0;background:#fff;cursor:pointer;
  font-size:.78rem;font-weight:500;color:#0a0a0a;flex-shrink:0;
  transition:border-color .12s,box-shadow .12s;
}
.etb-sel:hover{border-color:#0a0a0a;box-shadow:0 0 0 3px rgba(0,0,0,.06)}

/* ── POPUP CARD ── */
.etb-popup{
  position:fixed;z-index:99999;
  background:#fff;border:1px solid #e4e4e4;border-radius:16px;
  box-shadow:0 2px 0 rgba(0,0,0,.03),0 8px 32px rgba(0,0,0,.1),0 24px 64px rgba(0,0,0,.07);
  overflow:hidden;
}
.etb-popup.etb-down{animation:etbPopIn .22s cubic-bezier(.34,1.56,.64,1) both}
.etb-popup.etb-up{animation:etbPopInUp .22s cubic-bezier(.34,1.56,.64,1) both}

.etb-ph{
  padding:11px 16px 8px;
  font-size:.67rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:#aaa;border-bottom:1px solid #f0f0f0;
}

/* ── DROPDOWN ITEM ── */
.etb-di{
  display:flex;align-items:center;gap:10px;width:100%;
  padding:9px 16px;background:none;border:none;cursor:pointer;
  font-size:.84rem;color:#0a0a0a;text-align:left;
  transition:background .08s;
}
.etb-di:hover{background:#f5f5f5}
.etb-di.etb-red{color:#dc2626}

/* ── GRID BTN ── */
.etb-gb{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  padding:10px 6px;border-radius:10px;border:none;cursor:pointer;
  background:transparent;color:#555;
  font-size:.68rem;font-weight:500;text-align:center;
  transition:background .1s,color .1s,transform .12s;min-width:62px;
}
.etb-gb:hover{background:#f2f2f2;color:#0a0a0a;transform:translateY(-2px)}
.etb-gb:active{transform:scale(.91)}

/* ── COLOR SWATCH ── */
.etb-sw{
  width:22px;height:22px;border-radius:6px;cursor:pointer;
  border:2px solid rgba(255,255,255,.5);
  box-shadow:0 1px 3px rgba(0,0,0,.18);
  transition:transform .1s,box-shadow .1s;position:relative;
}
.etb-sw:hover{transform:scale(1.3);box-shadow:0 3px 10px rgba(0,0,0,.3);z-index:1}

/* ── DIVIDERS ── */
.etb-sep{width:1px;height:20px;background:#e4e4e4;margin:0 3px;flex-shrink:0;opacity:.85}

/* ═══════════════════════════════════════════════
   MOBILE BOTTOM BAR
═══════════════════════════════════════════════ */
.etb-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:#fff;border-top:1.5px solid #e8e8e8;
  padding-bottom:env(safe-area-inset-bottom,0px);
  box-shadow:0 -4px 28px rgba(0,0,0,.08);
  animation:etbSlideUp .22s cubic-bezier(.25,.46,.45,.94);
}

/* mobile action button */
.etb-mab{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  padding:9px 6px 7px;min-width:50px;border:none;cursor:pointer;
  background:transparent;color:#555;flex-shrink:0;
  font-size:.62rem;font-weight:500;letter-spacing:.01em;
  transition:background .12s,color .12s,transform .1s;
  border-radius:10px;-webkit-tap-highlight-color:transparent;
}
.etb-mab:hover,.etb-mab.etb-on{background:#f0f0f0;color:#0a0a0a}
.etb-mab.etb-on{background:#0a0a0a;color:#fff}
.etb-mab:active{transform:scale(.88)}

/* mobile row */
.etb-mrow{
  display:flex;align-items:center;
  padding:4px 10px;overflow-x:auto;gap:0;
  -ms-overflow-style:none;scrollbar-width:none;
}
.etb-mrow::-webkit-scrollbar{display:none}
.etb-mrow-sep{width:1px;height:34px;background:#ebebeb;margin:0 4px;flex-shrink:0}
.etb-mrow-label{
  font-size:.57rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:#c0c0c0;padding:0 8px;flex-shrink:0;white-space:nowrap;
}
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("etb-css")) return;
  const s = document.createElement("style");
  s.id = "etb-css";
  s.textContent = ETB_CSS;
  document.head.appendChild(s);
}

/* ── Ico ─────────────────────────────────────────────────────────────── */
function Ico({
  svg, Fallback, size = 15, inv,
}: {
  svg?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  size?: number;
  inv?: boolean;
}) {
  const [ok, setOk] = useState(true);
  if (svg && ok) {
    return <img src={`/assets/icons/svg/${svg}.svg`} alt="" width={size} height={size}
      style={{ display: "inline-block", flexShrink: 0, filter: inv ? "invert(1)" : undefined }}
      onError={() => setOk(false)} />;
  }
  return <Fallback size={size} strokeWidth={1.75} />;
}

/* ── Ripple ──────────────────────────────────────────────────────────── */
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 2.4;
    const r = document.createElement("span");
    r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(0,0,0,.1);border-radius:50%;pointer-events:none;animation:etbRipple .55s ease-out forwards`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }, []);
}

/* ── TB ──────────────────────────────────────────────────────────────── */
function TB({ icon: sv, Fallback, label, onClick, active, kbd, children }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; kbd?: string; children?: React.ReactNode;
}) {
  injectCSS();
  const ripple = useRipple();
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      onClick={ripple as any}
      title={`${label}${kbd ? ` (${kbd})` : ""}`}
      className={`etb-btn${active ? " etb-on" : ""}`}
    >
      <Ico svg={sv} Fallback={Fallback} size={16} inv={active} />
      {children}
    </button>
  );
}

/* ── Sep, DSep, DHeader ──────────────────────────────────────────────── */
const Sep = () => <div className="etb-sep" />;
const DSep = () => <div style={{ height: 1, background: "#f0f0f0", margin: "4px 8px" }} />;
const DHeader = ({ t }: { t: string }) => <div className="etb-ph">{t}</div>;

/* ── PopupCard ───────────────────────────────────────────────────────── */
function PopupCard({ btnRef, open, onClose, align = "left", minWidth = 230, children }: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean; onClose: () => void;
  align?: "left" | "right" | "center"; minWidth?: number; children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, up: false });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const up = window.innerHeight - rect.bottom < 320 && rect.top > window.innerHeight - rect.bottom;
    let left = align === "right" ? rect.right - minWidth : align === "center" ? rect.left + rect.width / 2 - minWidth / 2 : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - minWidth - 8));
    setPos({ top: up ? rect.top - 8 : rect.bottom + 6, left, up });
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, [open, align, minWidth, onClose, btnRef]);
  if (!open) return null;
  return (
    <div ref={ref} className={`etb-popup ${pos.up ? "etb-up" : "etb-down"}`}
      style={{ top: pos.up ? undefined : pos.top, bottom: pos.up ? window.innerHeight - pos.top : undefined, left: pos.left, minWidth }}
      onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

/* ── Drop ────────────────────────────────────────────────────────────── */
function Drop({ label, icon: sv, Fallback, children, align = "left", minWidth = 230, preferUp }: {
  label?: string; icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode; align?: "left" | "right" | "center"; minWidth?: number; preferUp?: boolean;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={16} inv={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={11} className="etb-chev"
          style={{ opacity: .5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s cubic-bezier(.34,1.56,.64,1)" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={minWidth}>
        <div style={{ paddingBottom: 6 }} onClick={() => setOpen(false)}>{children}</div>
      </PopupCard>
    </div>
  );
}

/* ── DI ──────────────────────────────────────────────────────────────── */
function DI({ icon: sv, Fallback, label, onClick, kbd, red }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; kbd?: string; red?: boolean;
}) {
  return (
    <button onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      className={`etb-di${red ? " etb-red" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".7rem", opacity: .35, marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{kbd}</span>}
    </button>
  );
}

/* ── GridDrop ────────────────────────────────────────────────────────── */
function GridDrop({ label, icon: sv, Fallback, items, columns = 3, title, align = "left" }: {
  label?: string; icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  items: { icon?: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; onClick: () => void }[];
  columns?: number; title?: string; align?: "left" | "right" | "center";
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={16} inv={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={11} className="etb-chev"
          style={{ opacity: .5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s cubic-bezier(.34,1.56,.64,1)" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={250}>
        {title && <DHeader t={title} />}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 4, padding: 10 }}
          onClick={() => setOpen(false)}>
          {items.map((item, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); item.onClick(); }}
              className="etb-gb"
              style={{ animation: `etbFadeIn .16s ease both`, animationDelay: `${i * 22}ms` }}>
              <Ico svg={item.icon} Fallback={item.Icon} size={18} />
              <span style={{ lineHeight: 1.2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ── ColorPickerDrop ─────────────────────────────────────────────────── */
function ColorPickerDrop({ icon: sv, Fallback, onColor, title = "Cor" }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onColor: (c: string) => void; title?: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const COLORS = [
    "#000000","#1a1a2e","#374151","#6b7280","#9ca3af","#d1d5db","#e5e7eb","#ffffff",
    "#dc2626","#ea580c","#d97706","#ca8a04","#65a30d","#16a34a","#059669","#0d9488",
    "#0891b2","#0284c7","#2563eb","#4f46e5","#7c3aed","#9333ea","#c026d3","#db2777",
    "#fca5a5","#fdba74","#fcd34d","#86efac","#6ee7b7","#93c5fd","#c4b5fd","#f9a8d4",
  ];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={16} inv={open} />
        <ChevronDown size={11} className="etb-chev" style={{ opacity: .5 }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={222}>
        <DHeader t={title} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5, padding: 12 }}
          onClick={() => setOpen(false)}>
          {COLORS.map(c => (
            <button key={c} onMouseDown={(e) => { e.preventDefault(); onColor(c); }}
              className="etb-sw" title={c}
              style={{ background: c, outline: c === "#ffffff" ? "1px solid #e0e0e0" : "none" }} />
          ))}
        </div>
        <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: ".72rem", color: "#aaa" }}>Personalizado:</span>
          <input type="color" onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { onColor(e.target.value); setOpen(false); }}
            style={{ width: 32, height: 26, border: "1.5px solid #e0e0e0", borderRadius: 7, cursor: "pointer", padding: 2 }} />
        </div>
      </PopupCard>
    </div>
  );
}

/* ── Sel ─────────────────────────────────────────────────────────────── */
function Sel({ options, value, onChange, width = 100 }: {
  options: { label: string; value: string }[]; value?: string; onChange: (v: string) => void; width?: number;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = options.find(o => o.value === value);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className="etb-sel" style={{ width }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? options[0]?.label}
        </span>
        <ChevronDown size={10}
          style={{ opacity: .45, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .18s ease" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={width}>
        <div style={{ padding: "4px 0", maxHeight: 290, overflowY: "auto" }} onClick={() => setOpen(false)}>
          {options.map(o => (
            <button key={o.value} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); }}
              className="etb-di"
              style={{ background: value === o.value ? "#0a0a0a" : "none", color: value === o.value ? "#fff" : "#0a0a0a", fontWeight: value === o.value ? 700 : 400 }}>
              {o.label}
              {value === o.value && <CheckCircle size={13} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ── Mobile helpers ──────────────────────────────────────────────────── */
function MobBtn({ icon: sv, Fallback, label, onClick, active, labelOnly }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; labelOnly?: boolean;
}) {
  injectCSS();
  return (
    <button onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      className={`etb-mab${active ? " etb-on" : ""}`}>
      {labelOnly
        ? <span style={{ fontSize: ".85rem", fontWeight: 900, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{label}</span>
        : <Ico svg={sv} Fallback={Fallback} size={20} inv={active} />
      }
      {!labelOnly && <span>{label}</span>}
    </button>
  );
}
const MobSep = () => <div className="etb-mrow-sep" />;

/* ── Data ────────────────────────────────────────────────────────────── */
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
const FONT_SIZES = ["8","9","10","11","12","14","16","18","20","22","24","28","32","36","48","72"].map(s => ({ label: `${s}pt`, value: s }));

/* ── Props ───────────────────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
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
      document.querySelectorAll("font[size='7']").forEach(f => {
        (f as HTMLElement).removeAttribute("size");
        (f as HTMLElement).style.fontSize = `${sz}pt`;
      });
    }
    setFontSize(sz);
  };
  const applyFont = (ff: string) => { exec("fontName", ff); setFontFamily(ff); };

  /* ══ MOBILE BOTTOM BAR ══════════════════════ */
  if (isMobile) {
    return (
      <div className="etb-bar">

        {/* ─ Row 1: Core text formatting ─ */}
        <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 6 }}>
          <MobBtn icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} />
          <MobBtn icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} />
          <MobBtn icon="underline" Fallback={Underline} label="Subl." onClick={onUnderline} />
          <MobBtn icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />

          <MobSep />

          <MobBtn icon="align-left" Fallback={AlignLeft} label="Esq." onClick={onAlignLeft} />
          <MobBtn icon="align-center" Fallback={AlignCenter} label="Centro" onClick={onAlignCenter} />
          <MobBtn icon="align-right" Fallback={AlignRight} label="Dir." onClick={onAlignRight} />
          <MobBtn icon="align-justify" Fallback={AlignJustify} label="Just." onClick={onAlignJustify} />

          <MobSep />

          <MobBtn icon="list-bullet" Fallback={List} label="Lista" onClick={onBulletList} />
          <MobBtn icon="list-number" Fallback={ListOrdered} label="Num." onClick={onNumberedList} />

          <MobSep />

          <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={(c) => exec("foreColor", c)} title="Cor do texto" />
          <ColorPickerDrop icon="highlighter" Fallback={Highlighter} onColor={(c) => exec("hiliteColor", c)} title="Realçar" />

          <MobSep />

          <MobBtn icon="link" Fallback={Link} label="Link" onClick={onLink} />
          <MobBtn icon="image" Fallback={Image} label="Img" onClick={onImage} />
          <MobBtn icon="table" Fallback={Table} label="Tabela" onClick={onTable} />
        </div>

        {/* ─ Row 2: Headings, extras, actions ─ */}
        <div className="etb-mrow" style={{ paddingTop: 4, paddingBottom: 6 }}>
          <MobBtn Fallback={Heading1} label="H1" onClick={onHeading1} labelOnly />
          <MobBtn Fallback={Heading2} label="H2" onClick={onHeading2} labelOnly />
          <MobBtn Fallback={Heading3} label="H3" onClick={onHeading3} labelOnly />

          <MobSep />

          <MobBtn icon="superscript" Fallback={Superscript} label="Sup" onClick={onSuperscript} />
          <MobBtn icon="subscript" Fallback={Subscript} label="Sub" onClick={onSubscript} />
          <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
          <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />

          <MobSep />

          <MobBtn icon="arrow-undo" Fallback={Undo2} label="Desfaz." onClick={onUndo} />
          <MobBtn icon="arrow-redo" Fallback={Redo2} label="Refaz." onClick={onRedo} />

          <MobSep />

          <MobBtn icon="save" Fallback={Save} label="Guardar" onClick={onSave} />
          <MobBtn icon="download" Fallback={FileDown} label="PDF" onClick={onExportPDF} />
          <MobBtn icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />

          <MobSep />

          {/* More overflow */}
          <Drop label="Mais" Fallback={MoreHorizontal} align="right" minWidth={224} preferUp>
            <DI icon="document-add" Fallback={FileText} label="Novo documento" onClick={onNewDocument} />
            <DI icon="document-text" Fallback={BookOpen} label="Abrir documento" onClick={onOpenDocument} />
            <DSep />
            <DI Fallback={CheckSquare} label="Lista de tarefas" onClick={() =>
              exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")
            } />
            <DI Fallback={Plus} label="Aumentar indentação" onClick={() => exec("indent")} />
            <DI Fallback={Minus} label="Diminuir indentação" onClick={() => exec("outdent")} />
            <DI Fallback={WrapText} label="Quebra de página" onClick={() =>
              exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e0e0e0;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>")
            } />
            <DSep />
            <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} red />
          </Drop>
        </div>

      </div>
    );
  }

  /* ══ DESKTOP ════════════════════════════════ */
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", flexShrink: 0 }}>

      {/* ─ Row 1 ─ */}
      <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 10px 4px" }}>

        <Drop label="Ficheiro" icon="folder-open" Fallback={FileText} minWidth={250}>
          <DHeader t="Ficheiro" />
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
        <TB icon="arrow-undo" Fallback={Undo2} label="Desfazer" onClick={onUndo} kbd="Ctrl+Z" />
        <TB icon="arrow-redo" Fallback={Redo2} label="Refazer" onClick={onRedo} kbd="Ctrl+Y" />
        <Sep />

        <Drop label="Estilos" icon="text" Fallback={Pilcrow} minWidth={228}>
          <DHeader t="Estilo de parágrafo" />
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

        <Sel options={FONT_FAMILIES} value={fontFamily} onChange={applyFont} width={132} />
        <Sel options={FONT_SIZES} value={fontSize} onChange={applyFontSize} width={74} />
        <Sep />

        <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
        <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
        <TB icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
        <TB icon="eye" Fallback={Eye} label="Pré-visualizar" onClick={() => { }} />
        <Sep />
        <TB icon="zoom-in" Fallback={ZoomIn} label="Ampliar" onClick={() => { }} />
        <TB icon="zoom-out" Fallback={ZoomOut} label="Reduzir" onClick={() => { }} />
        <TB icon="resize" Fallback={Maximize2} label="Ecrã completo" onClick={() => { }} />
      </div>

      {/* ─ Row 2 ─ */}
      <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 10px 7px" }}>

        <TB icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} kbd="Ctrl+B" />
        <TB icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} kbd="Ctrl+I" />
        <TB icon="underline" Fallback={Underline} label="Sublinhado" onClick={onUnderline} kbd="Ctrl+U" />
        <TB icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
        <TB icon="superscript" Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
        <TB icon="subscript" Fallback={Subscript} label="Subscrito" onClick={onSubscript} />
        <Sep />

        <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={(c) => exec("foreColor", c)} title="Cor do texto" />
        <ColorPickerDrop icon="highlighter" Fallback={Highlighter} onColor={(c) => exec("hiliteColor", c)} title="Realçar texto" />
        <Sep />

        <TB icon="align-left" Fallback={AlignLeft} label="Alinhar esquerda" onClick={onAlignLeft} />
        <TB icon="align-center" Fallback={AlignCenter} label="Centrar" onClick={onAlignCenter} />
        <TB icon="align-right" Fallback={AlignRight} label="Alinhar direita" onClick={onAlignRight} />
        <TB icon="align-justify" Fallback={AlignJustify} label="Justificar" onClick={onAlignJustify} />
        <Sep />

        <TB icon="list-bullet" Fallback={List} label="Lista com marcadores" onClick={onBulletList} />
        <TB icon="list-number" Fallback={ListOrdered} label="Lista numerada" onClick={onNumberedList} />
        <TB icon="list" Fallback={CheckSquare} label="Lista de tarefas" onClick={() =>
          exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")
        } />
        <TB icon="indent-increase" Fallback={Plus} label="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon="indent-decrease" Fallback={Minus} label="Diminuir indentação" onClick={() => exec("outdent")} />
        <Sep />

        <TB icon="link" Fallback={Link} label="Inserir link" onClick={onLink} />
        <TB icon="image" Fallback={Image} label="Inserir imagem" onClick={onImage} />
        <TB icon="table" Fallback={Table} label="Inserir tabela" onClick={onTable} />
        <TB icon="code-slash" Fallback={Code} label="Código inline" onClick={() =>
          exec("insertHTML", "<code style='background:#f4f4f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.88em'>código</code>")
        } />
        <TB icon="remove" Fallback={SeparatorHorizontal} label="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />
        <Sep />

        <GridDrop label="Inserir" icon="apps" Fallback={Plus} title="Inserir elemento" columns={3} items={[
          { icon: "quote", Icon: Quote, label: "Citação", onClick: () => onQuote?.() },
          { icon: "code-slash", Icon: Code, label: "Código", onClick: () => onCode?.() },
          { Icon: Bookmark, label: "Nota rodapé", onClick: () => exec("insertHTML", "<sup style='color:#888;font-size:.7em'>[nota]</sup>") },
          { icon: "alert-circle", Icon: AlertTriangle, label: "Aviso", onClick: () => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui.</div><p></p>") },
          { icon: "information-circle", Icon: Info, label: "Info", onClick: () => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>") },
          { icon: "checkmark-circle", Icon: CheckCircle, label: "Sucesso", onClick: () => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>✅ Sucesso:</strong> Escreve aqui.</div><p></p>") },
          { icon: "close-circle", Icon: XCircle, label: "Erro", onClick: () => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>❌ Erro:</strong> Escreve aqui.</div><p></p>") },
          { Icon: Calendar, label: "Data/hora", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
          { Icon: WrapText, label: "Quebra pág.", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e0e0e0;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
          { Icon: ClipboardList, label: "Nota", onClick: () => onAddNote?.() },
          { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => { } },
          { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#f1f1f1;color:#333;padding:2px 8px;border-radius:99px;font-size:.78em;font-weight:600'>etiqueta</span>") },
        ]} />

        <Drop label="Formatar" icon="options" Fallback={Settings2} minWidth={250}>
          <DHeader t="Formatar texto" />
          <DI Fallback={CaseUpper} label="MAIÚSCULAS" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
          <DI Fallback={CaseSensitive} label="minúsculas" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
          <DI Fallback={CaseSensitive} label="Primeira Maiúscula" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, c => c.toUpperCase())); }} />
          <DSep />
          <DI icon="swap-horizontal" Fallback={FileCode} label="Localizar e substituir" onClick={() => {
            const find = prompt("Localizar:"); if (!find) return;
            const rep = prompt("Substituir por:") ?? "";
            const el = document.querySelector("[contenteditable]") as HTMLElement;
            if (el) el.innerHTML = el.innerHTML.replaceAll(find, rep);
          }} />
          <DI Fallback={Hash} label="Contar palavras" onClick={() => {
            const el = document.querySelector("[contenteditable]") as HTMLElement; if (!el) return;
            const t = el.innerText.trim();
            alert(`Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.length}`);
          }} />
          <DSep />
          <DI icon="pencil" Fallback={PenLine} label="Modo de revisão" onClick={() => { }} />
          <DI icon="stats-chart" Fallback={BarChart3} label="Estatísticas" onClick={() => { }} />
          <DSep />
          <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} red />
        </Drop>

        <Sep />

        <Drop label="Partilhar" icon="share-social" Fallback={Share2} minWidth={228} align="right">
          <DHeader t="Partilhar & Exportar" />
          <DI icon="people" Fallback={Users} label="Convidar colaborador" onClick={() => { }} />
          <DI icon="share-social" Fallback={Share2} label="Copiar link" onClick={onShare} />
          <DSep />
          <DI icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
          <DI icon="document-text" Fallback={FileText} label="Exportar Word" onClick={onDownload} />
          <DI icon="cloud-upload" Fallback={CloudUpload} label="Guardar na nuvem" onClick={onSave} />
          <DI icon="cloud-done" Fallback={CloudCog} label="Estado da nuvem" onClick={() => { }} />
          <DSep />
          <DI icon="logo-twitter" Fallback={Share2} label="Publicar no X" onClick={() => { }} />
          <DI icon="logo-linkedin" Fallback={Users} label="Publicar no LinkedIn" onClick={() => { }} />
        </Drop>

      </div>
    </div>
  );
}
