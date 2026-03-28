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
  ClipboardList, Calendar, ChevronDown, Settings2,
  Zap, Eye, PenLine, Users, BarChart3, ZoomIn, ZoomOut, Maximize2,
  Cloud, CloudUpload, CloudCog, Star, Heart, Tag, ArrowLeft,
  FolderOpen, Type as FontIcon, X, ChevronUp,
} from "lucide-react";

/* ─── Custom App Icons ─────────────────────────────────────────────── */
function AppIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/icons/app_icon.svg"
        alt="Doction"
        width={size}
        height={size}
        className={className}
        style={{ display: "block", flexShrink: 0, filter: "invert(1) brightness(10)" }}
        onError={() => setOk(false)}
      />
    );
  }
  // Fallback: minimal D
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#222" />
      <text x="16" y="23" fontFamily="Georgia,serif" fontWeight="900" fontSize="18" fill="#fff" textAnchor="middle">D</text>
    </svg>
  );
}

function ArrowBackIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src="/assets/icons/svg/arrow-back.svg"
      alt=""
      width={size}
      height={size}
      style={{ display: "inline-block", flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

/* ─── CSS ──────────────────────────────────────────────────────────── */
const ETB_CSS = `
@keyframes etbRipple  { to { opacity:0; transform:scale(2.6); } }
@keyframes etbPopIn   {
  0%   { opacity:0; transform:scale(.88) translateY(-6px); }
  65%  { transform:scale(1.02) translateY(1px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes etbPopInUp {
  0%   { opacity:0; transform:scale(.88) translateY(6px); }
  65%  { transform:scale(1.02) translateY(-1px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes etbFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes etbSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes etbSheetIn {
  from { opacity:0; transform:translateY(18px) scale(.97); }
  to   { opacity:1; transform:none; }
}
@keyframes etbOverlayIn { from{opacity:0} to{opacity:1} }

.etb-scroll::-webkit-scrollbar{height:3px;width:3px}
.etb-scroll::-webkit-scrollbar-track{background:transparent}
.etb-scroll::-webkit-scrollbar-thumb{background:#404040;border-radius:99px}
.etb-scroll{-ms-overflow-style:none;scrollbar-width:thin}

/* ── TOOLBAR BUTTON (dark) ── */
.etb-btn{
  display:flex;align-items:center;justify-content:center;gap:3px;
  padding:0 8px;height:32px;border-radius:8px;border:none;cursor:pointer;
  background:transparent;color:#888;
  font-size:.78rem;font-weight:500;flex-shrink:0;
  position:relative;overflow:hidden;outline:none;
  transition:background .12s,color .12s,transform .09s;
  min-width:32px;-webkit-tap-highlight-color:transparent;
}
.etb-btn:hover:not(.etb-on){ background:#2a2a2a;color:#e0e0e0; }
.etb-btn.etb-on{ background:#f0f0f0;color:#111; }
.etb-btn:active{ transform:scale(.90)!important }

/* ── DROP BUTTON (dark) ── */
.etb-drop{
  display:flex;align-items:center;gap:4px;
  padding:0 9px;height:32px;border-radius:8px;border:none;cursor:pointer;
  background:transparent;color:#888;
  font-size:.78rem;font-weight:600;flex-shrink:0;
  transition:background .12s,color .12s;
  -webkit-tap-highlight-color:transparent;
}
.etb-drop:hover,.etb-drop.etb-on{ background:#2a2a2a;color:#e0e0e0; }
.etb-drop.etb-on{ background:#f0f0f0!important;color:#111!important; }

/* ── SELECT (dark) ── */
.etb-sel{
  display:flex;align-items:center;gap:4px;height:32px;
  padding:0 8px;border-radius:8px;
  border:1px solid #303030;background:#1e1e1e;cursor:pointer;
  font-size:.78rem;font-weight:500;color:#ccc;flex-shrink:0;
  transition:border-color .12s;
}
.etb-sel:hover{ border-color:#555;color:#fff; }

/* ── POPUP CARD (dark) ── */
.etb-popup{
  position:fixed;z-index:99999;
  background:#1c1c1c;border:1px solid #333;border-radius:14px;
  box-shadow:0 2px 0 rgba(0,0,0,.3),0 12px 40px rgba(0,0,0,.6);
  overflow:hidden;
}
.etb-popup.etb-down{ animation:etbPopIn .2s cubic-bezier(.34,1.56,.64,1) both }
.etb-popup.etb-up{ animation:etbPopInUp .2s cubic-bezier(.34,1.56,.64,1) both }

.etb-ph{
  padding:10px 14px 7px;
  font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:#555;border-bottom:1px solid #282828;
}

/* ── DROPDOWN ITEM (dark) ── */
.etb-di{
  display:flex;align-items:center;gap:9px;width:100%;
  padding:8px 14px;background:none;border:none;cursor:pointer;
  font-size:.83rem;color:#d0d0d0;text-align:left;
  transition:background .08s;
}
.etb-di:hover{ background:#282828 }
.etb-di.etb-red{ color:#f87171 }

/* ── GRID BTN ── */
.etb-gb{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  padding:10px 6px;border-radius:10px;border:none;cursor:pointer;
  background:transparent;color:#888;
  font-size:.68rem;font-weight:500;text-align:center;
  transition:background .1s,color .1s,transform .12s;min-width:60px;
}
.etb-gb:hover{ background:#282828;color:#e0e0e0;transform:translateY(-2px) }
.etb-gb:active{ transform:scale(.91) }

/* ── COLOR SWATCH ── */
.etb-sw{
  width:22px;height:22px;border-radius:6px;cursor:pointer;
  border:2px solid rgba(255,255,255,.12);
  box-shadow:0 1px 3px rgba(0,0,0,.4);
  transition:transform .1s,box-shadow .1s;position:relative;
}
.etb-sw:hover{ transform:scale(1.3);z-index:1 }

/* ── DIVIDERS ── */
.etb-sep{ width:1px;height:18px;background:#2e2e2e;margin:0 3px;flex-shrink:0; }

/* ── DARK OVERLAY ── */
.etb-overlay{
  position:fixed;inset:0;z-index:99990;
  background:rgba(0,0,0,.75);
  animation:etbOverlayIn .18s ease;
}

/* ── MODAL SHEET (PC = centered dialog, mobile = bottom sheet) ── */
.etb-modal{
  position:fixed;z-index:99995;
  background:#1c1c1c;border:1px solid #333;
  box-shadow:0 24px 80px rgba(0,0,0,.7);
  animation:etbSheetIn .22s cubic-bezier(.25,.46,.45,.94);
}
.etb-modal.etb-modal-desktop{
  border-radius:18px;
  top:50%;left:50%;transform:translate(-50%,-50%);
  min-width:480px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;
}
.etb-modal.etb-modal-mobile{
  border-radius:20px 20px 0 0;
  bottom:0;left:0;right:0;
  max-height:85vh;overflow:hidden;display:flex;flex-direction:column;
}

/* ── HANDLEBAR ── */
.etb-handle{
  width:36px;height:4px;border-radius:2px;background:#444;
  margin:10px auto 0;flex-shrink:0;cursor:grab;
}

/* ── MOBILE BAR ── */
.etb-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:#141414;border-top:1px solid #252525;
  padding-bottom:env(safe-area-inset-bottom,0px);
  box-shadow:0 -4px 24px rgba(0,0,0,.4);
  animation:etbSlideUp .22s cubic-bezier(.25,.46,.45,.94);
}

/* ── MOBILE ACTION BTN ── */
.etb-mab{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  padding:8px 5px 6px;min-width:46px;border:none;cursor:pointer;
  background:transparent;color:#666;flex-shrink:0;
  font-size:.58rem;font-weight:500;letter-spacing:.01em;
  transition:background .12s,color .12s,transform .1s;
  border-radius:9px;-webkit-tap-highlight-color:transparent;
}
.etb-mab:hover,.etb-mab.etb-on{ background:#1f1f1f;color:#e0e0e0 }
.etb-mab.etb-on{ background:#f0f0f0!important;color:#111!important }
.etb-mab:active{ transform:scale(.86) }

/* ── MOBILE ROW ── */
.etb-mrow{
  display:flex;align-items:center;
  padding:3px 8px;overflow-x:auto;gap:0;
  -ms-overflow-style:none;scrollbar-width:none;
}
.etb-mrow::-webkit-scrollbar{ display:none }
.etb-mrow-sep{ width:1px;height:30px;background:#282828;margin:0 3px;flex-shrink:0; }

/* ── IOS TABS ── */
.etb-ios-tabs{
  display:flex;align-items:center;
  background:#262626;border-radius:10px;padding:2px;
  margin:0 14px 12px;flex-shrink:0;
}
.etb-ios-tab{
  flex:1;height:32px;border:none;border-radius:8px;cursor:pointer;
  background:transparent;color:#666;
  font-size:.78rem;font-weight:600;letter-spacing:.01em;
  transition:background .16s,color .16s,box-shadow .16s;
}
.etb-ios-tab.etb-ios-active{
  background:#fff;color:#111;
  box-shadow:0 1px 4px rgba(0,0,0,.35),0 2px 8px rgba(0,0,0,.2);
}

/* ── FONT MODAL ITEM ── */
.etb-font-item{
  display:flex;align-items:center;justify-content:space-between;
  padding:11px 16px;border:none;background:none;cursor:pointer;
  width:100%;text-align:left;transition:background .08s;
  border-bottom:1px solid #242424;
}
.etb-font-item:hover{ background:#242424 }
.etb-font-item:last-child{ border-bottom:none }

/* ── ZOOM MODAL (mobile only) ── */
.etb-zoom-modal{
  position:fixed;z-index:99996;
  background:#1c1c1c;border:1px solid #333;border-radius:20px 20px 0 0;
  bottom:0;left:0;right:0;
  padding:0 24px 32px;
  box-shadow:0 -12px 48px rgba(0,0,0,.5);
  animation:etbSlideUp .24s cubic-bezier(.25,.46,.45,.94);
}

/* ── DESKTOP TOOLBAR ── */
.etb-desktop-bar{
  background:#181818;border-bottom:1px solid #242424;flex-shrink:0;
}
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("etb-css")) return;
  const s = document.createElement("style");
  s.id = "etb-css";
  s.textContent = ETB_CSS;
  document.head.appendChild(s);
}

/* ─── Ico ─────────────────────────────────────────────────────────── */
function Ico({ svg, Fallback, size = 15, invert }: {
  svg?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  size?: number;
  invert?: boolean;
}) {
  const [ok, setOk] = useState(true);
  if (svg && ok) {
    return (
      <img
        src={`/assets/icons/svg/${svg}.svg`}
        alt=""
        width={size}
        height={size}
        style={{ display: "inline-block", flexShrink: 0, filter: invert ? "invert(1) brightness(10)" : "invert(1) brightness(.6)" }}
        onError={() => setOk(false)}
      />
    );
  }
  return <Fallback size={size} strokeWidth={1.75} />;
}

/* ─── Ripple ──────────────────────────────────────────────────────── */
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 2.4;
    const r = document.createElement("span");
    r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(255,255,255,.08);border-radius:50%;pointer-events:none;animation:etbRipple .5s ease-out forwards`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }, []);
}

/* ─── TB ──────────────────────────────────────────────────────────── */
function TB({ icon: sv, Fallback, label, onClick, active, kbd }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; kbd?: string;
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
      <Ico svg={sv} Fallback={Fallback} size={15} invert={active} />
    </button>
  );
}

const Sep = () => <div className="etb-sep" />;
const DSep = () => <div style={{ height: 1, background: "#242424", margin: "3px 6px" }} />;
const DHeader = ({ t }: { t: string }) => <div className="etb-ph">{t}</div>;

/* ─── Overlay ─────────────────────────────────────────────────────── */
function Overlay({ onClick }: { onClick: () => void }) {
  return <div className="etb-overlay" onClick={onClick} />;
}

/* ─── PopupCard ───────────────────────────────────────────────────── */
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
    setPos({ top: up ? rect.top - 8 : rect.bottom + 5, left, up });

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

/* ─── Modal (desktop = centered, mobile = bottom sheet) ──────────── */
function Modal({ open, onClose, title, children, isMobile }: {
  open: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; isMobile: boolean;
}) {
  const startY = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);

  // Swipe down to close on mobile
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 60) onClose();
    startY.current = null;
  };

  if (!open) return null;
  return (
    <>
      <Overlay onClick={onClose} />
      <div
        ref={ref}
        className={`etb-modal ${isMobile ? "etb-modal-mobile" : "etb-modal-desktop"}`}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        {isMobile && <div className="etb-handle" />}
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", flexShrink: 0 }}>
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#e0e0e0" }}>{title}</span>
            {!isMobile && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4, borderRadius: 6, display: "flex" }}>
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </>
  );
}

/* ─── Drop ────────────────────────────────────────────────────────── */
function Drop({ label, icon: sv, Fallback, children, align = "left", minWidth = 230, isMobile = false, modalTitle }: {
  label?: string; icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode; align?: "left" | "right" | "center"; minWidth?: number;
  isMobile?: boolean; modalTitle?: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (isMobile && modalTitle) {
    return (
      <>
        <button onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
          className={`etb-mab${open ? " etb-on" : ""}`}>
          <Ico svg={sv} Fallback={Fallback} size={20} invert={open} />
          {label && <span style={{ fontSize: ".57rem" }}>{label}</span>}
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} isMobile={true}>
          <div style={{ overflowY: "auto", paddingBottom: 8 }} onClick={() => setOpen(false)}>
            {children}
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} invert={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={10} style={{ opacity: .4, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .18s" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={minWidth}>
        <div style={{ paddingBottom: 5 }} onClick={() => setOpen(false)}>{children}</div>
      </PopupCard>
    </div>
  );
}

/* ─── DI ──────────────────────────────────────────────────────────── */
function DI({ icon: sv, Fallback, label, onClick, kbd, red }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; kbd?: string; red?: boolean;
}) {
  return (
    <button onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      className={`etb-di${red ? " etb-red" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={14} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".69rem", opacity: .3, fontVariantNumeric: "tabular-nums" }}>{kbd}</span>}
    </button>
  );
}

/* ─── GridDrop ────────────────────────────────────────────────────── */
function GridDrop({ label, icon: sv, Fallback, items, columns = 3, title, align = "left", isMobile = false }: {
  label?: string; icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  items: { icon?: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; onClick: () => void }[];
  columns?: number; title?: string; align?: "left" | "right" | "center"; isMobile?: boolean;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (isMobile) {
    return (
      <>
        <button onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
          className={`etb-mab${open ? " etb-on" : ""}`}>
          <Ico svg={sv} Fallback={Fallback} size={20} invert={open} />
          {label && <span style={{ fontSize: ".57rem" }}>{label}</span>}
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title={title} isMobile={true}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 4, padding: "8px 12px 16px" }}
            onClick={() => setOpen(false)}>
            {items.map((item, i) => (
              <button key={i} onMouseDown={(e) => { e.preventDefault(); item.onClick(); }}
                className="etb-gb" style={{ animation: `etbFadeIn .15s ease both`, animationDelay: `${i * 20}ms` }}>
                <Ico svg={item.icon} Fallback={item.Icon} size={20} />
                <span style={{ lineHeight: 1.2, color: "#aaa" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} invert={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={10} style={{ opacity: .4, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .18s" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={260}>
        {title && <DHeader t={title} />}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 4, padding: 10 }}
          onClick={() => setOpen(false)}>
          {items.map((item, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); item.onClick(); }}
              className="etb-gb" style={{ animation: `etbFadeIn .15s ease both`, animationDelay: `${i * 20}ms` }}>
              <Ico svg={item.icon} Fallback={item.Icon} size={17} />
              <span style={{ lineHeight: 1.2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ─── ColorPickerDrop ─────────────────────────────────────────────── */
function ColorPickerDrop({ icon: sv, Fallback, onColor, title = "Cor", isMobile = false, mobileLabel }: {
  icon?: string;
  Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onColor: (c: string) => void; title?: string; isMobile?: boolean; mobileLabel?: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const COLORS = [
    "#000000", "#1c1c1c", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#ffffff",
    "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d", "#16a34a", "#059669", "#0d9488",
    "#0891b2", "#0284c7", "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777",
    "#fca5a5", "#fdba74", "#fcd34d", "#86efac", "#6ee7b7", "#93c5fd", "#c4b5fd", "#f9a8d4",
  ];

  if (isMobile) {
    return (
      <>
        <button onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
          className={`etb-mab${open ? " etb-on" : ""}`}>
          <Ico svg={sv} Fallback={Fallback} size={20} invert={open} />
          {mobileLabel && <span style={{ fontSize: ".57rem" }}>{mobileLabel}</span>}
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title={title} isMobile={true}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, padding: "8px 16px 16px" }}
            onClick={() => setOpen(false)}>
            {COLORS.map(c => (
              <button key={c} onMouseDown={(e) => { e.preventDefault(); onColor(c); setOpen(false); }}
                className="etb-sw" title={c}
                style={{ background: c, outline: c === "#ffffff" ? "1px solid #444" : "none" }} />
            ))}
          </div>
          <div style={{ padding: "0 16px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: ".72rem", color: "#666" }}>Personalizado:</span>
            <input type="color" onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => { onColor(e.target.value); setOpen(false); }}
              style={{ width: 36, height: 28, border: "1px solid #333", borderRadius: 8, cursor: "pointer", padding: 2, background: "#1c1c1c" }} />
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} invert={open} />
        <ChevronDown size={10} style={{ opacity: .4 }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={232}>
        <DHeader t={title} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5, padding: 12 }}
          onClick={() => setOpen(false)}>
          {COLORS.map(c => (
            <button key={c} onMouseDown={(e) => { e.preventDefault(); onColor(c); }}
              className="etb-sw" title={c}
              style={{ background: c, outline: c === "#ffffff" ? "1px solid #444" : "none" }} />
          ))}
        </div>
        <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: ".72rem", color: "#555" }}>Personalizado:</span>
          <input type="color" onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { onColor(e.target.value); setOpen(false); }}
            style={{ width: 32, height: 26, border: "1px solid #333", borderRadius: 7, cursor: "pointer", padding: 2 }} />
        </div>
      </PopupCard>
    </div>
  );
}

/* ─── Sel ─────────────────────────────────────────────────────────── */
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
        <ChevronDown size={10} style={{ opacity: .4, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .16s" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={width}>
        <div style={{ padding: "4px 0", maxHeight: 280, overflowY: "auto" }} onClick={() => setOpen(false)}>
          {options.map(o => (
            <button key={o.value} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); }}
              className="etb-di"
              style={{ background: value === o.value ? "#2a2a2a" : "none", color: value === o.value ? "#fff" : "#d0d0d0", fontWeight: value === o.value ? 700 : 400 }}>
              {o.label}
              {value === o.value && <CheckCircle size={12} style={{ marginLeft: "auto", color: "#888" }} />}
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ─── Font Picker Modal ───────────────────────────────────────────── */
const FONT_FAMILIES = [
  { label: "Calibri", value: "Calibri, sans-serif", stack: "Calibri, Gill Sans, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif", stack: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif", stack: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif", stack: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', monospace", stack: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif", stack: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif", stack: "'Trebuchet MS', sans-serif" },
  { label: "Garamond", value: "Garamond, serif", stack: "Garamond, EB Garamond, serif" },
  { label: "Palatino", value: "'Palatino Linotype', serif", stack: "'Palatino Linotype', Palatino, serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif", stack: "Tahoma, sans-serif" },
  { label: "Impact", value: "Impact, sans-serif", stack: "Impact, Charcoal, sans-serif" },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive", stack: "'Comic Sans MS', cursive" },
  { label: "Lucida", value: "'Lucida Sans', sans-serif", stack: "'Lucida Sans', Geneva, sans-serif" },
  { label: "Book Antiqua", value: "'Book Antiqua', serif", stack: "'Book Antiqua', Palatino, serif" },
  { label: "Gill Sans", value: "'Gill Sans', sans-serif", stack: "'Gill Sans', sans-serif" },
  { label: "Century Gothic", value: "'Century Gothic', sans-serif", stack: "'Century Gothic', CenturyGothic, sans-serif" },
  { label: "Franklin Gothic", value: "'Franklin Gothic Medium', sans-serif", stack: "'Franklin Gothic Medium', sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif", stack: "Helvetica, Arial, sans-serif" },
  { label: "Futura", value: "Futura, 'Century Gothic', sans-serif", stack: "Futura, 'Century Gothic', sans-serif" },
  { label: "Baskerville", value: "Baskerville, serif", stack: "Baskerville, 'Baskerville Old Face', serif" },
];

function FontPickerModal({ open, onClose, current, onChange, isMobile }: {
  open: boolean; onClose: () => void; current: string;
  onChange: (v: string) => void; isMobile: boolean;
}) {
  const startY = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Swipe-to-expand on mobile (grow max-height)
  const [expanded, setExpanded] = useState(false);
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (dy < -50) setExpanded(true);
    if (dy > 60) { if (expanded) setExpanded(false); else onClose(); }
    startY.current = null;
  };

  if (!open) return null;
  return (
    <>
      <Overlay onClick={onClose} />
      <div
        className={`etb-modal ${isMobile ? "etb-modal-mobile" : "etb-modal-desktop"}`}
        style={isMobile ? { maxHeight: expanded ? "92vh" : "55vh", transition: "max-height .32s cubic-bezier(.25,.46,.45,.94)" } : {}}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        {isMobile && <div className="etb-handle" />}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px", flexShrink: 0 }}>
          <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#e0e0e0" }}>Fontes</span>
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4 }}>
                {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          )}
          {!isMobile && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4, borderRadius: 6 }}>
              <X size={16} />
            </button>
          )}
        </div>
        <div ref={bodyRef} style={{ overflowY: "auto", flex: 1 }}>
          {FONT_FAMILIES.map(f => (
            <button key={f.value} onMouseDown={(e) => { e.preventDefault(); onChange(f.value); onClose(); }}
              className="etb-font-item">
              <span style={{ fontFamily: f.stack, fontSize: "1.05rem", color: current === f.value ? "#fff" : "#bbb" }}>
                {f.label}
              </span>
              <span style={{ fontFamily: f.stack, fontSize: ".78rem", color: "#555" }}>
                Texto de amostra
              </span>
              {current === f.value && <CheckCircle size={14} style={{ color: "#aaa", flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Zoom Modal (mobile only) ─────────────────────────────────────── */
function ZoomModal({ open, onClose, zoom, onZoomChange }: {
  open: boolean; onClose: () => void; zoom: number; onZoomChange: (z: number) => void;
}) {
  const startY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 60) onClose();
    startY.current = null;
  };

  if (!open) return null;
  return (
    <>
      <Overlay onClick={onClose} />
      <div
        className="etb-zoom-modal"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="etb-handle" />
        <div style={{ padding: "16px 0 4px", textAlign: "center" }}>
          <span style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#555" }}>Zoom</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: "16px 0 8px" }}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onZoomChange(Math.max(25, zoom - 10))}
            style={{ width: 52, height: 52, borderRadius: 14, background: "#242424", border: "1px solid #333", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}
          >
            <ZoomOut size={22} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onZoomChange(100)}
            style={{ minWidth: 72, height: 52, borderRadius: 14, background: "#1e1e1e", border: "1px solid #333", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, color: "#e0e0e0", fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(zoom)}%
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            style={{ width: 52, height: 52, borderRadius: 14, background: "#242424", border: "1px solid #333", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}
          >
            <ZoomIn size={22} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "8px 0 4px", justifyContent: "center", flexWrap: "wrap" }}>
          {[50, 75, 100, 125, 150].map(z => (
            <button key={z} onClick={() => { onZoomChange(z); onClose(); }}
              style={{ height: 32, padding: "0 14px", borderRadius: 10, background: zoom === z ? "#f0f0f0" : "#242424", border: "1px solid #333", cursor: "pointer", fontSize: ".78rem", fontWeight: 600, color: zoom === z ? "#111" : "#888" }}>
              {z}%
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── MobBtn ──────────────────────────────────────────────────────── */
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
        ? <span style={{ fontSize: ".82rem", fontWeight: 900, fontFamily: "'Georgia',serif", lineHeight: 1, color: active ? "#111" : "#666" }}>{label}</span>
        : <Ico svg={sv} Fallback={Fallback} size={19} invert={active} />
      }
      {!labelOnly && <span>{label}</span>}
    </button>
  );
}
const MobSep = () => <div className="etb-mrow-sep" />;

/* ─── iOS Tabs ────────────────────────────────────────────────────── */
function IOSTabs({ tabs, active, onChange }: {
  tabs: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div className="etb-ios-tabs">
      {tabs.map((t, i) => (
        <button key={t} className={`etb-ios-tab${active === i ? " etb-ios-active" : ""}`}
          onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(i)}>
          {t}
        </button>
      ))}
    </div>
  );
}

/* ─── Font sizes ──────────────────────────────────────────────────── */
const FONT_SIZES = ["8","9","10","11","12","14","16","18","20","22","24","28","32","36","48","72"].map(s => ({ label: `${s}pt`, value: s }));

/* ─── Props ───────────────────────────────────────────────────────── */
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
  zoom?: number;
  onZoomChange?: (z: number) => void;
}

/* ═══════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════ */
export default function EditorToolbar(props: EditorToolbarProps) {
  injectCSS();
  const {
    onBold, onItalic, onUnderline, onStrikethrough, onAlignLeft, onAlignCenter,
    onAlignRight, onAlignJustify, onBulletList, onNumberedList, onLink, onImage,
    onTable, onSave, onUndo, onRedo, onNewDocument, onOpenDocument,
    onDownload, onShare, onHeading1, onHeading2, onHeading3, onCode, onQuote,
    onHighlight, onSuperscript, onSubscript, onClearFormatting, onExportPDF,
    onAddNote, onColorPicker, isMobile = false, zoom = 100, onZoomChange,
  } = props;

  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Calibri, sans-serif");
  const [fontModalOpen, setFontModalOpen] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);

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

  /* ══ MOBILE ══════════════════════════════════════════ */
  if (isMobile) {
    const tabs = ["Texto", "Inserir", "Formato", "Ações"];
    return (
      <>
        {/* Zoom modal — mobile only */}
        <ZoomModal open={zoomModalOpen} onClose={() => setZoomModalOpen(false)} zoom={zoom} onZoomChange={onZoomChange ?? (() => {})} />

        <div className="etb-bar">
          {/* iOS Tabs */}
          <div style={{ paddingTop: 8 }}>
            <IOSTabs tabs={tabs} active={mobileTab} onChange={setMobileTab} />
          </div>

          {/* Tab content */}
          {mobileTab === 0 && (
            <div className="etb-mrow" style={{ paddingBottom: 10 }}>
              <MobBtn icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} />
              <MobBtn icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} />
              <MobBtn icon="underline" Fallback={Underline} label="Subl." onClick={onUnderline} />
              <MobBtn icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
              <MobSep />
              <MobBtn Fallback={Heading1} label="H1" onClick={onHeading1} labelOnly />
              <MobBtn Fallback={Heading2} label="H2" onClick={onHeading2} labelOnly />
              <MobBtn Fallback={Heading3} label="H3" onClick={onHeading3} labelOnly />
              <MobSep />
              <MobBtn icon="superscript" Fallback={Superscript} label="Sup" onClick={onSuperscript} />
              <MobBtn icon="subscript" Fallback={Subscript} label="Sub" onClick={onSubscript} />
              <MobSep />
              {/* Font picker — modal */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setFontModalOpen(true)} className="etb-mab">
                <Type size={19} style={{ color: "#666" }} />
                <span style={{ fontSize: ".57rem" }}>Fonte</span>
              </button>
              <FontPickerModal open={fontModalOpen} onClose={() => setFontModalOpen(false)} current={fontFamily} onChange={applyFont} isMobile={true} />
              {/* Font size inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
                <button onMouseDown={(e) => { e.preventDefault(); const cur = parseInt(fontSize); applyFontSize(String(Math.max(8, cur - 1))); }}
                  className="etb-mab" style={{ minWidth: 32 }}>
                  <Minus size={14} style={{ color: "#666" }} />
                </button>
                <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#888", minWidth: 20, textAlign: "center" }}>{fontSize}</span>
                <button onMouseDown={(e) => { e.preventDefault(); const cur = parseInt(fontSize); applyFontSize(String(Math.min(72, cur + 1))); }}
                  className="etb-mab" style={{ minWidth: 32 }}>
                  <Plus size={14} style={{ color: "#666" }} />
                </button>
              </div>
              <MobSep />
              <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={(c) => exec("foreColor", c)} title="Cor do texto" isMobile mobileLabel="Cor" />
              <ColorPickerDrop icon="highlighter" Fallback={Highlighter} onColor={(c) => exec("hiliteColor", c)} title="Realçar" isMobile mobileLabel="Realçar" />
            </div>
          )}

          {mobileTab === 1 && (
            <div className="etb-mrow" style={{ paddingBottom: 10 }}>
              <MobBtn icon="align-left" Fallback={AlignLeft} label="Esq." onClick={onAlignLeft} />
              <MobBtn icon="align-center" Fallback={AlignCenter} label="Centro" onClick={onAlignCenter} />
              <MobBtn icon="align-right" Fallback={AlignRight} label="Dir." onClick={onAlignRight} />
              <MobBtn icon="align-justify" Fallback={AlignJustify} label="Just." onClick={onAlignJustify} />
              <MobSep />
              <MobBtn icon="list-bullet" Fallback={List} label="Lista" onClick={onBulletList} />
              <MobBtn icon="list-number" Fallback={ListOrdered} label="Num." onClick={onNumberedList} />
              <MobSep />
              <MobBtn icon="link" Fallback={Link} label="Link" onClick={onLink} />
              <MobBtn icon="image" Fallback={Image} label="Imagem" onClick={onImage} />
              <MobBtn icon="table" Fallback={Table} label="Tabela" onClick={onTable} />
              <MobSep />
              <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
              <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
              <MobSep />
              <GridDrop icon="apps" Fallback={Plus} label="Mais" title="Inserir elemento" columns={3} isMobile
                items={[
                  { Icon: CheckSquare, label: "Tarefa", onClick: () => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>") },
                  { Icon: Bookmark, label: "Nota rod.", onClick: () => exec("insertHTML", "<sup style='color:#888;font-size:.7em'>[nota]</sup>") },
                  { icon: "alert-circle", Icon: AlertTriangle, label: "Aviso", onClick: () => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui.</div><p></p>") },
                  { icon: "information-circle", Icon: Info, label: "Info", onClick: () => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>") },
                  { Icon: Calendar, label: "Data", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
                  { Icon: WrapText, label: "Quebra pág.", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #555;margin:24px 0;text-align:center;color:#888;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
                  { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#2a2a2a;color:#ccc;padding:2px 8px;border-radius:99px;font-size:.78em;font-weight:600'>etiqueta</span>") },
                  { icon: "remove", Icon: SeparatorHorizontal, label: "Linha horiz.", onClick: () => exec("insertHorizontalRule") },
                  { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => {} },
                ]}
              />
            </div>
          )}

          {mobileTab === 2 && (
            <div className="etb-mrow" style={{ paddingBottom: 10 }}>
              <MobBtn icon="arrow-undo" Fallback={Undo2} label="Desfaz." onClick={onUndo} />
              <MobBtn icon="arrow-redo" Fallback={Redo2} label="Refaz." onClick={onRedo} />
              <MobSep />
              {/* Zoom — opens modal */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setZoomModalOpen(true)} className="etb-mab">
                <ZoomIn size={19} style={{ color: "#666" }} />
                <span style={{ fontSize: ".57rem" }}>Zoom</span>
              </button>
              <MobSep />
              <Drop icon="options" Fallback={Settings2} label="Formatar" isMobile modalTitle="Formatar texto">
                <DI Fallback={CaseUpper} label="MAIÚSCULAS" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
                <DI Fallback={CaseSensitive} label="minúsculas" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
                <DI Fallback={CaseSensitive} label="Primeira Maiúscula" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, c => c.toUpperCase())); }} />
                <DSep />
                <DI icon="swap-horizontal" Fallback={FileCode} label="Localizar e substituir" onClick={() => { const find = prompt("Localizar:"); if (!find) return; const rep = prompt("Substituir por:") ?? ""; const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.innerHTML = el.innerHTML.replaceAll(find, rep); }} />
                <DI Fallback={Hash} label="Contar palavras" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (!el) return; const t = el.innerText.trim(); alert(`Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.length}`); }} />
                <DSep />
                <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} red />
              </Drop>
            </div>
          )}

          {mobileTab === 3 && (
            <div className="etb-mrow" style={{ paddingBottom: 10 }}>
              <MobBtn icon="save" Fallback={Save} label="Guardar" onClick={onSave} />
              <MobBtn icon="download" Fallback={FileDown} label="PDF" onClick={onExportPDF} />
              <MobBtn icon="document-text" Fallback={FileText} label="Word" onClick={onDownload} />
              <MobBtn icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
              <MobSep />
              <MobBtn icon="document-add" Fallback={FileText} label="Novo" onClick={onNewDocument} />
              <MobBtn icon="folder-open" Fallback={FolderOpen} label="Abrir" onClick={onOpenDocument} />
              <MobSep />
              <MobBtn icon="eye" Fallback={Eye} label="Preview" onClick={() => {}} />
              <MobBtn icon="pencil" Fallback={PenLine} label="Revisão" onClick={() => {}} />
            </div>
          )}
        </div>
      </>
    );
  }

  /* ══ DESKTOP ════════════════════════════════════════ */
  return (
    <div className="etb-desktop-bar">
      {/* Font modal for desktop */}
      <FontPickerModal open={fontModalOpen} onClose={() => setFontModalOpen(false)} current={fontFamily} onChange={applyFont} isMobile={false} />

      {/* ─ Row 1 ─ */}
      <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 1, padding: "5px 10px 3px", overflowX: "auto" }}>

        <Drop label="Ficheiro" icon="folder-open" Fallback={FileText} minWidth={252}>
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

        {/* Font picker — button opens modal on desktop too */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setFontModalOpen(true)}
          className="etb-sel"
          style={{ width: 140, justifyContent: "space-between" }}
          title="Escolher fonte"
        >
          <span style={{ fontFamily: fontFamily, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: ".78rem" }}>
            {FONT_FAMILIES.find(f => f.value === fontFamily)?.label ?? "Calibri"}
          </span>
          <ChevronDown size={10} style={{ opacity: .4, flexShrink: 0 }} />
        </button>

        {/* Font size */}
        <Sel options={FONT_SIZES} value={fontSize} onChange={applyFontSize} width={72} />
        <Sep />

        <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
        <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
        <TB icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
        <TB icon="eye" Fallback={Eye} label="Pré-visualizar" onClick={() => {}} />
        <Sep />
        {/* Zoom — desktop: always shown in toolbar as popup, not modal */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onMouseDown={(e) => { e.preventDefault(); onZoomChange?.(Math.max(25, (zoom ?? 100) - 10)); }}
            className="etb-btn" title="Diminuir zoom (Ctrl+-)">
            <ZoomOut size={14} />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); onZoomChange?.(100); }}
            className="etb-btn" title="Repor 100%"
            style={{ minWidth: 46, fontSize: ".74rem", fontWeight: 700, color: "#888" }}>
            {Math.round(zoom ?? 100)}%
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); onZoomChange?.(Math.min(200, (zoom ?? 100) + 10)); }}
            className="etb-btn" title="Aumentar zoom (Ctrl++)">
            <ZoomIn size={14} />
          </button>
        </div>
        <TB icon="resize" Fallback={Maximize2} label="Ecrã completo" onClick={() => {}} />
      </div>

      {/* ─ Row 2 ─ */}
      <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 1, padding: "2px 10px 6px", overflowX: "auto" }}>

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
          exec("insertHTML", "<code style='background:#2a2a2a;color:#e0e0e0;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.88em'>código</code>")
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
          { Icon: WrapText, label: "Quebra pág.", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #444;margin:24px 0;text-align:center;color:#888;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
          { Icon: ClipboardList, label: "Nota", onClick: () => onAddNote?.() },
          { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => {} },
          { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#2a2a2a;color:#ccc;padding:2px 8px;border-radius:99px;font-size:.78em;font-weight:600'>etiqueta</span>") },
        ]} />

        <Drop label="Formatar" icon="options" Fallback={Settings2} minWidth={258}>
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
          <DI icon="pencil" Fallback={PenLine} label="Modo de revisão" onClick={() => {}} />
          <DI icon="stats-chart" Fallback={BarChart3} label="Estatísticas" onClick={() => {}} />
          <DSep />
          <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} red />
        </Drop>

        <Sep />

        <Drop label="Partilhar" icon="share-social" Fallback={Share2} minWidth={230} align="right">
          <DHeader t="Partilhar & Exportar" />
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
