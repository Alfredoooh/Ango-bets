import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link, Image, Table,
  Undo2, Redo2, Save, Share2, Highlighter, Superscript,
  Subscript, Code, Quote, Palette, Minus, Plus,
  Heading1, Heading2, Heading3, Heading4, Heading5, FileDown, FileText,
  Trash2, CheckSquare, SeparatorHorizontal,
  CaseSensitive, CaseUpper, Hash, Pilcrow, WrapText, FileCode,
  BookOpen, Bookmark, AlertTriangle, Info, CheckCircle, XCircle,
  ClipboardList, Calendar, ChevronDown, Settings2, AlignVerticalJustifyStart,
  Eye, PenLine, Users, BarChart3, CloudUpload, CloudCog,
  Tag, Search, X, Check,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   CSS — zero border-radius em tudo, toolbar compacto
───────────────────────────────────────────────────────────────── */
const ETB_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600&family=Roboto:wght@400;500&family=Open+Sans:wght@400;600&family=Raleway:wght@400;600&family=Nunito:wght@400;600&family=Poppins:wght@400;600&family=Source+Code+Pro:wght@400;600&family=Fira+Code:wght@400&family=JetBrains+Mono:wght@400;500&family=DM+Serif+Display&family=Cormorant+Garamond:wght@400;600&family=EB+Garamond:wght@400&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=PT+Serif:wght@400;700&family=Josefin+Sans:wght@400;600&family=Ubuntu:wght@400;500&family=Exo+2:wght@400;600&family=Quicksand:wght@400;600&family=Pacifico&family=Dancing+Script:wght@400;600&family=Caveat:wght@400;600&family=Kalam:wght@400&family=Sacramento&family=Great+Vibes&display=swap');

@keyframes etbRipple  { to{opacity:0;transform:scale(2.6)} }
@keyframes etbFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes etbSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes etbModalIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

/* scrollbar */
.etb-scroll::-webkit-scrollbar{height:2px}
.etb-scroll::-webkit-scrollbar-thumb{background:#d4d4d4}
.etb-scroll{scrollbar-width:thin}

/* toolbar button — compacto 30px */
.etb-btn{
  display:flex;align-items:center;justify-content:center;
  padding:0 7px;height:30px;border-radius:0;border:none;cursor:pointer;
  background:transparent;color:#888;
  font-size:.76rem;font-weight:500;flex-shrink:0;
  position:relative;overflow:hidden;outline:none;
  transition:background .1s,color .1s;
  min-width:30px;-webkit-tap-highlight-color:transparent;
}
.etb-btn:hover:not(.etb-on){background:#f0f0f0;color:#1a1a1a}
.etb-btn.etb-on{background:#1a1a1a;color:#fff}
.etb-btn:active{opacity:.7}

/* toolbar drop-trigger */
.etb-drop{
  display:flex;align-items:center;gap:4px;
  padding:0 8px;height:30px;border-radius:0;border:none;cursor:pointer;
  background:transparent;color:#666;
  font-size:.76rem;font-weight:600;flex-shrink:0;
  transition:background .1s,color .1s;-webkit-tap-highlight-color:transparent;
}
.etb-drop:hover,.etb-drop.etb-on{background:#f0f0f0;color:#1a1a1a}
.etb-drop.etb-on{background:#1a1a1a!important;color:#fff!important}
.etb-drop.etb-on .etb-chev{filter:invert(1)}

/* font/size selector pill */
.etb-sel{
  display:flex;align-items:center;gap:4px;height:30px;
  padding:0 8px;border-radius:0;
  border:1.5px solid #e0e0e0;background:#fff;cursor:pointer;
  font-size:.76rem;font-weight:500;color:#1a1a1a;flex-shrink:0;
  transition:border-color .1s;
}
.etb-sel:hover{border-color:#1a1a1a}

/* separator */
.etb-sep{width:1px;height:16px;background:#e4e4e4;margin:0 2px;flex-shrink:0}

/* modal overlay */
.etb-overlay{
  position:fixed;inset:0;z-index:99998;
  background:rgba(0,0,0,.52);
  display:flex;align-items:center;justify-content:center;
  animation:etbFadeIn .14s ease both;
}
/* modal box — sem border-radius */
.etb-modal{
  background:#fff;border-radius:0;
  box-shadow:0 16px 56px rgba(0,0,0,.3);
  animation:etbModalIn .18s ease both;
  overflow:hidden;display:flex;flex-direction:column;
  max-height:88vh;
}

/* bottom sheet — sem border-radius */
.etb-sheet{
  position:fixed;bottom:0;left:0;right:0;z-index:99999;
  background:#fff;border-radius:0;
  box-shadow:0 -4px 40px rgba(0,0,0,.18);
  will-change:transform;
  max-height:90vh;overflow:hidden;display:flex;flex-direction:column;
}
.etb-sheet-handle-zone{
  display:flex;justify-content:center;padding:13px 0 8px;
  flex-shrink:0;cursor:grab;
}
.etb-sheet-handle-bar{width:38px;height:4px;border-radius:99px;background:#d8d8d8}

/* modal list items */
.etb-di{
  display:flex;align-items:center;gap:10px;width:100%;
  padding:10px 18px;background:none;border:none;cursor:pointer;
  font-size:.84rem;color:#1a1a1a;text-align:left;transition:background .07s;
}
.etb-di:hover{background:#f5f5f5}
.etb-di.etb-red{color:#dc2626}
.etb-di-sep{height:1px;background:#f0f0f0;margin:3px 0}
.etb-di-hdr{
  padding:10px 18px 6px;font-size:.63rem;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;color:#aaa;
  border-bottom:1px solid #f0f0f0;
}

/* grid item */
.etb-gb{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:5px;padding:10px 4px;border-radius:0;border:none;cursor:pointer;
  background:transparent;color:#666;font-size:.67rem;font-weight:500;
  text-align:center;transition:background .1s,color .1s;min-width:58px;
}
.etb-gb:hover{background:#f0f0f0;color:#1a1a1a}
.etb-gb:active{opacity:.7}

/* color swatch */
.etb-sw{
  width:24px;height:24px;border-radius:0;cursor:pointer;
  border:2px solid rgba(255,255,255,.4);
  box-shadow:0 1px 3px rgba(0,0,0,.18);
  transition:transform .1s,box-shadow .1s;
}
.etb-sw:hover{transform:scale(1.25);box-shadow:0 3px 10px rgba(0,0,0,.28);z-index:1}

/* font list item */
.etb-font-item{
  display:flex;align-items:center;gap:12px;width:100%;
  padding:11px 18px;background:none;border:none;cursor:pointer;
  text-align:left;transition:background .07s;border-bottom:1px solid #f5f5f5;
}
.etb-font-item:hover{background:#f8f8f8}
.etb-font-item.etb-sel-font{background:#f0f0f0}

/* color hex input */
.etb-hex{
  flex:1;padding:8px 10px;border:1.5px solid #e0e0e0;border-radius:0;
  font-size:.82rem;font-weight:600;font-family:monospace;outline:none;
  transition:border-color .1s;
}
.etb-hex:focus{border-color:#1a1a1a}

/* dialog */
.etb-dlg-title{padding:18px 20px 12px;font-size:.92rem;font-weight:700;color:#1a1a1a;border-bottom:1px solid #f0f0f0}
.etb-dlg-body{padding:16px 20px}
.etb-dlg-foot{display:flex;border-top:1px solid #f0f0f0}
.etb-dlg-btn{flex:1;padding:14px;border:none;cursor:pointer;font-size:.84rem;font-weight:600;background:#fff;color:#1a1a1a;transition:background .1s;border-radius:0}
.etb-dlg-btn:hover{background:#f5f5f5}
.etb-dlg-btn.etb-primary{background:#1a1a1a;color:#fff}
.etb-dlg-btn.etb-primary:hover{background:#2a2a2a}
.etb-dlg-input{
  width:100%;padding:10px 12px;border:1.5px solid #e0e0e0;border-radius:0;
  font-size:.88rem;outline:none;box-sizing:border-box;transition:border-color .1s;
}
.etb-dlg-input:focus{border-color:#1a1a1a}

/* mobile bottom bar */
.etb-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:#fff;border-top:1.5px solid #e8e8e8;
  padding-bottom:env(safe-area-inset-bottom,0px);
  box-shadow:0 -4px 24px rgba(0,0,0,.07);
  animation:etbSlideUp .2s cubic-bezier(.25,.46,.45,.94);
}
/* iOS tabs */
.etb-tabs{display:flex;background:#efefef;padding:2px;flex-shrink:0}
.etb-tab{
  flex:1;height:30px;border-radius:0;border:none;cursor:pointer;
  font-size:.72rem;font-weight:600;color:#888;background:transparent;
  transition:all .13s;-webkit-tap-highlight-color:transparent;
}
.etb-tab.etb-active{background:#fff;color:#1a1a1a;box-shadow:0 1px 3px rgba(0,0,0,.09)}

/* mobile action button */
.etb-mab{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:2px;padding:6px 6px 4px;min-width:46px;border:none;cursor:pointer;
  background:transparent;color:#666;flex-shrink:0;
  font-size:.6rem;font-weight:500;letter-spacing:.01em;
  transition:background .1s,color .1s;border-radius:0;
  -webkit-tap-highlight-color:transparent;
}
.etb-mab:hover,.etb-mab.etb-on{background:#ebebeb;color:#1a1a1a}
.etb-mab.etb-on{background:#1a1a1a;color:#fff}
.etb-mab:active{opacity:.7}

.etb-mrow{
  display:flex;align-items:center;padding:2px 6px;
  overflow-x:auto;gap:0;scrollbar-width:none;
}
.etb-mrow::-webkit-scrollbar{display:none}
.etb-mrow-sep{width:1px;height:28px;background:#e8e8e8;margin:0 3px;flex-shrink:0}

/* size stepper */
.etb-stepper{display:flex;align-items:center;border:1.5px solid #e0e0e0;height:36px}
.etb-stepper-btn{width:38px;height:100%;border:none;background:#fff;cursor:pointer;font-size:1.1rem;color:#1a1a1a;display:flex;align-items:center;justify-content:center;transition:background .1s}
.etb-stepper-btn:active{background:#f0f0f0}
.etb-stepper-val{min-width:46px;text-align:center;font-size:.92rem;font-weight:800;border-left:1.5px solid #e0e0e0;border-right:1.5px solid #e0e0e0;height:100%;display:flex;align-items:center;justify-content:center;background:#fafafa}

/* table grid picker */
.etb-tgrid{display:grid;gap:3px;padding:12px}
.etb-tcell{
  width:28px;height:28px;border:1.5px solid #e0e0e0;border-radius:0;
  background:#fff;cursor:pointer;transition:background .07s,border-color .07s;
}
.etb-tcell.etb-thov{background:#1a1a1a;border-color:#1a1a1a}
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("etb-css")) return;
  const s = document.createElement("style");
  s.id = "etb-css"; s.textContent = ETB_CSS;
  document.head.appendChild(s);
}

/* ── Ico ── */
function Ico({ svg, Fallback, size = 15, inv }: {
  svg?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  size?: number; inv?: boolean;
}) {
  const [ok, setOk] = useState(true);
  if (svg && ok)
    return <img src={`/assets/icons/svg/${svg}.svg`} alt="" width={size} height={size}
      style={{ display: "inline-block", flexShrink: 0, filter: inv ? "invert(1)" : undefined }}
      onError={() => setOk(false)} />;
  return <Fallback size={size} strokeWidth={1.75} />;
}

/* ── ripple ── */
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const b = e.currentTarget, r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2.4;
    const s = document.createElement("span");
    s.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px;background:rgba(0,0,0,.07);border-radius:50%;pointer-events:none;animation:etbRipple .48s ease-out forwards`;
    b.appendChild(s); setTimeout(() => s.remove(), 500);
  }, []);
}

function TB({ icon: sv, Fallback, label, onClick, active, kbd }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; kbd?: string;
}) {
  injectCSS(); const ripple = useRipple();
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick?.(); }} onClick={ripple as any}
      title={`${label}${kbd ? ` (${kbd})` : ""}`} className={`etb-btn${active ? " etb-on" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={15} inv={active} />
    </button>
  );
}

const Sep = () => <div className="etb-sep" />;
const MobSep = () => <div className="etb-mrow-sep" />;

/* ════════════════════════════════════════════════════════════
   BOTTOM SHEET — swipe suave, só fecha pelo handle
════════════════════════════════════════════════════════════ */
function BottomSheet({ open, onClose, title, children, height = "auto" }: {
  open: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; height?: number | "auto";
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // swipe state
  const dragStartY = useRef<number | null>(null);
  const dragOnHandle = useRef(false);
  const currentDy = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); }
  }, [open]);

  const doClose = useCallback(() => {
    if (!sheetRef.current || !overlayRef.current) { onClose(); return; }
    const sh = sheetRef.current, ov = overlayRef.current;
    const shH = sh.offsetHeight;
    sh.style.transition = "transform .28s cubic-bezier(.4,0,.6,1)";
    sh.style.transform = `translateY(${shH}px)`;
    ov.style.transition = "opacity .28s ease";
    ov.style.opacity = "0";
    setTimeout(() => { setMounted(false); setClosing(false); onClose(); }, 290);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragOnHandle.current = true; // this handler is only on the handle zone
    currentDy.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragOnHandle.current || dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy < 0) return; // não deixa puxar para cima
    currentDy.current = dy;
    const sh = sheetRef.current;
    if (!sh) return;
    sh.style.transform = `translateY(${dy}px)`;
    // overlay escurece/clareia com o movimento
    const ov = overlayRef.current;
    if (ov) {
      const ratio = Math.max(0, 1 - dy / sh.offsetHeight);
      ov.style.opacity = String(ratio * 0.52);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragOnHandle.current) return;
    const sh = sheetRef.current;
    const threshold = sh ? sh.offsetHeight * 0.38 : 120;
    if (currentDy.current > threshold) {
      doClose();
    } else {
      // snap back
      if (sh) {
        sh.style.transition = "transform .22s cubic-bezier(.34,1.56,.64,1)";
        sh.style.transform = "translateY(0)";
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = "opacity .22s ease";
        overlayRef.current.style.opacity = "0.52";
      }
    }
    dragOnHandle.current = false;
    dragStartY.current = null;
    currentDy.current = 0;
  }, [doClose]);

  if (!mounted) return null;

  const sheetStyle: React.CSSProperties = {
    animation: closing ? "none" : "etbSlideUp .24s cubic-bezier(.25,.46,.45,.94) both",
    ...(typeof height === "number" ? { height } : {}),
  };

  return (
    <>
      <div ref={overlayRef}
        style={{ position: "fixed", inset: 0, zIndex: 99998, background: "rgba(0,0,0,.52)", animation: "etbFadeIn .14s ease both" }}
        onClick={doClose} />
      <div ref={sheetRef} className="etb-sheet" style={{ zIndex: 99999, ...sheetStyle, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        {/* handle — única zona de swipe */}
        <div className="etb-sheet-handle-zone"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          <div className="etb-sheet-handle-bar" />
        </div>
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 12px", flexShrink: 0, borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#1a1a1a" }}>{title}</span>
            <button onClick={doClose} style={{ background: "#f0f0f0", border: "none", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MODAL — centrado, sem border-radius, overlay clicável fecha
════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, children, width = 440 }: {
  open: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="etb-overlay" onClick={onClose}>
      <div className="etb-modal" style={{ width, maxWidth: "96vw" }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#1a1a1a" }}>{title}</span>
            <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   NATIVE DIALOG (substitui alert/prompt do browser)
════════════════════════════════════════════════════════════ */
interface DlgAction { label: string; primary?: boolean; danger?: boolean; onClick: (v?: string) => void }
function NativeDlg({ open, title, message, input, actions }: {
  open: boolean; title: string; message?: string;
  input?: { placeholder: string; defaultValue?: string; type?: string };
  actions: DlgAction[];
}) {
  const [val, setVal] = useState(input?.defaultValue ?? "");
  useEffect(() => { if (open) setVal(input?.defaultValue ?? ""); }, [open, input?.defaultValue]);
  if (!open) return null;
  return (
    <div className="etb-overlay" style={{ zIndex: 999999 }}>
      <div className="etb-modal" style={{ minWidth: 300, maxWidth: "94vw" }}>
        <div className="etb-dlg-title">{title}</div>
        <div className="etb-dlg-body">
          {message && <p style={{ margin: "0 0 10px", fontSize: ".86rem", color: "#555", lineHeight: 1.5, whiteSpace: "pre-line" }}>{message}</p>}
          {input && <input autoFocus className="etb-dlg-input" type={input.type ?? "text"}
            value={val} onChange={e => setVal(e.target.value)} placeholder={input.placeholder}
            onKeyDown={e => { if (e.key === "Enter") actions.find(a => a.primary)?.onClick(val); }} />}
        </div>
        <div className="etb-dlg-foot">
          {actions.map((a, i) => (
            <button key={i} className={`etb-dlg-btn${a.primary ? " etb-primary" : ""}`}
              style={a.danger ? { color: "#dc2626" } : {}}
              onClick={() => a.onClick(input ? val : undefined)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function useDialog() {
  type Cfg = Parameters<typeof NativeDlg>[0] & { resolve?: () => void };
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const show = useCallback((config: {
    title: string; message?: string;
    input?: { placeholder: string; defaultValue?: string; type?: string };
    actions: Omit<DlgAction, "onClick">[];
  }): Promise<{ action: number; value?: string }> => {
    return new Promise(res => {
      setCfg({
        ...config, open: true,
        actions: config.actions.map((a, i) => ({
          ...a, onClick: (v?: string) => { setCfg(null); res({ action: i, value: v }); },
        })),
      });
    });
  }, []);
  const Dialog = cfg ? <NativeDlg {...cfg} /> : null;
  return { show, Dialog };
}

/* ════════════════════════════════════════════════════════════
   DESKTOP MODAL DROP — abre modal em vez de popup flutuante
════════════════════════════════════════════════════════════ */
function ModalDrop({ label, icon: sv, Fallback, children, title, width = 280 }: {
  label?: string; icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode; title?: string; width?: number;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} inv={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={10} className="etb-chev"
          style={{ opacity: .5, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title ?? label} width={width}>
        <div style={{ paddingBottom: 8 }} onClick={() => setOpen(false)}>
          {children}
        </div>
      </Modal>
    </>
  );
}

/* DI, DSep, DHeader */
function DI({ icon: sv, Fallback, label, onClick, kbd, red }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; kbd?: string; red?: boolean;
}) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick?.(); }} className={`etb-di${red ? " etb-red" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".7rem", opacity: .35 }}>{kbd}</span>}
    </button>
  );
}
const DSep = () => <div className="etb-di-sep" />;
const DH = ({ t }: { t: string }) => <div className="etb-di-hdr">{t}</div>;

/* ════════════════════════════════════════════════════════════
   GRID DROP — abre modal com grelha
════════════════════════════════════════════════════════════ */
function GridDrop({ label, icon: sv, Fallback, items, cols = 3, title }: {
  label?: string; icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  items: { icon?: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; onClick: () => void }[];
  cols?: number; title?: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} inv={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={10} className="etb-chev" style={{ opacity: .5, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title ?? label} width={cols * 80 + 40}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 4, padding: 12 }}
          onClick={() => setOpen(false)}>
          {items.map((item, i) => (
            <button key={i} onMouseDown={e => { e.preventDefault(); item.onClick(); }} className="etb-gb">
              <Ico svg={item.icon} Fallback={item.Icon} size={18} />
              <span style={{ lineHeight: 1.25 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   TABLE PICKER MODAL
════════════════════════════════════════════════════════════ */
function TableModal({ open, onClose, onInsert }: {
  open: boolean; onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
}) {
  const MAX = 10;
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const [sel, setSel] = useState({ r: 0, c: 0 });

  const apply = (r: number, c: number) => {
    onInsert(r, c); onClose();
    setSel({ r: 0, c: 0 }); setHover({ r: 0, c: 0 });
  };

  return (
    <Modal open={open} onClose={onClose} title="Inserir tabela" width={340}>
      <div style={{ padding: "12px 20px 8px" }}>
        <div style={{ fontSize: ".82rem", color: "#888", marginBottom: 10 }}>
          {hover.r > 0 && hover.c > 0 ? `${hover.r} × ${hover.c}` : "Seleciona o tamanho da tabela"}
        </div>
        {/* grid de seleção */}
        <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${MAX},28px)`, gap: 3 }}>
          {Array.from({ length: MAX * MAX }, (_, i) => {
            const r = Math.floor(i / MAX) + 1, c = (i % MAX) + 1;
            const active = r <= hover.r && c <= hover.c;
            return (
              <div key={i} className={`etb-tcell${active ? " etb-thov" : ""}`}
                onMouseEnter={() => setHover({ r, c })}
                onMouseLeave={() => setHover({ r: 0, c: 0 })}
                onClick={() => apply(r, c)} />
            );
          })}
        </div>
        {/* input manual */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontSize: ".78rem", color: "#888", flexShrink: 0 }}>Linhas</span>
            <input type="number" min={1} max={50} defaultValue={3}
              id="etb-tr"
              style={{ width: "100%", padding: "7px 8px", border: "1.5px solid #e0e0e0", fontSize: ".84rem", outline: "none", borderRadius: 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontSize: ".78rem", color: "#888", flexShrink: 0 }}>Colunas</span>
            <input type="number" min={1} max={20} defaultValue={3}
              id="etb-tc"
              style={{ width: "100%", padding: "7px 8px", border: "1.5px solid #e0e0e0", fontSize: ".84rem", outline: "none", borderRadius: 0 }} />
          </div>
          <button
            onClick={() => {
              const r = parseInt((document.getElementById("etb-tr") as HTMLInputElement)?.value || "3");
              const c = parseInt((document.getElementById("etb-tc") as HTMLInputElement)?.value || "3");
              if (r > 0 && c > 0) apply(r, c);
            }}
            style={{ padding: "7px 14px", background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: ".82rem", fontWeight: 700, flexShrink: 0, borderRadius: 0 }}>
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   FONT PICKER — modal desktop / bottom sheet mobile
════════════════════════════════════════════════════════════ */
const ALL_FONTS = [
  { label: "Calibri",          value: "Calibri, sans-serif",                          category: "Sans-serif" },
  { label: "Arial",            value: "Arial, sans-serif",                            category: "Sans-serif" },
  { label: "Helvetica",        value: "'Helvetica Neue', Helvetica, sans-serif",      category: "Sans-serif" },
  { label: "Verdana",          value: "Verdana, sans-serif",                          category: "Sans-serif" },
  { label: "Tahoma",           value: "Tahoma, sans-serif",                           category: "Sans-serif" },
  { label: "Segoe UI",         value: "'Segoe UI', system-ui, sans-serif",            category: "Sans-serif" },
  { label: "Inter",            value: "'Inter', sans-serif",                          category: "Sans-serif" },
  { label: "Roboto",           value: "'Roboto', sans-serif",                         category: "Sans-serif" },
  { label: "Open Sans",        value: "'Open Sans', sans-serif",                      category: "Sans-serif" },
  { label: "Lato",             value: "'Lato', sans-serif",                           category: "Sans-serif" },
  { label: "Montserrat",       value: "'Montserrat', sans-serif",                     category: "Sans-serif" },
  { label: "Raleway",          value: "'Raleway', sans-serif",                        category: "Sans-serif" },
  { label: "Nunito",           value: "'Nunito', sans-serif",                         category: "Sans-serif" },
  { label: "Poppins",          value: "'Poppins', sans-serif",                        category: "Sans-serif" },
  { label: "Josefin Sans",     value: "'Josefin Sans', sans-serif",                   category: "Sans-serif" },
  { label: "Ubuntu",           value: "'Ubuntu', sans-serif",                         category: "Sans-serif" },
  { label: "Quicksand",        value: "'Quicksand', sans-serif",                      category: "Sans-serif" },
  { label: "Georgia",          value: "Georgia, serif",                               category: "Serif" },
  { label: "Times New Roman",  value: "'Times New Roman', Times, serif",              category: "Serif" },
  { label: "Garamond",         value: "Garamond, serif",                              category: "Serif" },
  { label: "Baskerville",      value: "Baskerville, serif",                           category: "Serif" },
  { label: "Cambria",          value: "Cambria, serif",                               category: "Serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif",                    category: "Serif" },
  { label: "Merriweather",     value: "'Merriweather', serif",                        category: "Serif" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif",                   category: "Serif" },
  { label: "Cormorant Garamond",value: "'Cormorant Garamond', serif",                category: "Serif" },
  { label: "EB Garamond",      value: "'EB Garamond', serif",                         category: "Serif" },
  { label: "Libre Baskerville",value: "'Libre Baskerville', serif",                   category: "Serif" },
  { label: "Crimson Text",     value: "'Crimson Text', serif",                        category: "Serif" },
  { label: "PT Serif",         value: "'PT Serif', serif",                            category: "Serif" },
  { label: "Courier New",      value: "'Courier New', Courier, monospace",            category: "Monospace" },
  { label: "Consolas",         value: "Consolas, monospace",                          category: "Monospace" },
  { label: "Source Code Pro",  value: "'Source Code Pro', monospace",                 category: "Monospace" },
  { label: "Fira Code",        value: "'Fira Code', monospace",                       category: "Monospace" },
  { label: "JetBrains Mono",   value: "'JetBrains Mono', monospace",                  category: "Monospace" },
  { label: "Impact",           value: "Impact, sans-serif",                           category: "Display" },
  { label: "Arial Black",      value: "'Arial Black', sans-serif",                    category: "Display" },
  { label: "Futura",           value: "Futura, 'Century Gothic', sans-serif",         category: "Display" },
  { label: "Pacifico",         value: "'Pacifico', cursive",                          category: "Handwriting" },
  { label: "Dancing Script",   value: "'Dancing Script', cursive",                    category: "Handwriting" },
  { label: "Caveat",           value: "'Caveat', cursive",                            category: "Handwriting" },
  { label: "Kalam",            value: "'Kalam', cursive",                             category: "Handwriting" },
  { label: "Sacramento",       value: "'Sacramento', cursive",                        category: "Handwriting" },
  { label: "Great Vibes",      value: "'Great Vibes', cursive",                       category: "Handwriting" },
  { label: "Comic Sans MS",    value: "'Comic Sans MS', cursive",                     category: "Handwriting" },
  { label: "San Francisco",    value: "-apple-system, 'SF Pro Display', sans-serif",  category: "Sistema" },
  { label: "System UI",        value: "system-ui, sans-serif",                        category: "Sistema" },
];
const FONT_CATS = ["Todas", "Sans-serif", "Serif", "Monospace", "Display", "Handwriting", "Sistema"];
const FONT_SIZES = ["8","9","10","11","12","13","14","16","18","20","22","24","26","28","32","36","40","44","48","56","64","72","96"];

function FontPickerContent({ onSelect, currentFont, onClose }: {
  onSelect: (f: string) => void; currentFont: string; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const filtered = ALL_FONTS.filter(f =>
    (cat === "Todas" || f.category === cat) && f.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar fonte..."
            style={{ width: "100%", padding: "7px 10px 7px 28px", border: "1.5px solid #e8e8e8", borderRadius: 0, fontSize: ".8rem", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {FONT_CATS.map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); setCat(c); }}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 0, border: "none", background: cat === c ? "#1a1a1a" : "#f0f0f0", color: cat === c ? "#fff" : "#666", fontSize: ".7rem", fontWeight: 600, cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0
          ? <div style={{ padding: 28, textAlign: "center", color: "#ccc", fontSize: ".84rem" }}>Nenhuma fonte encontrada</div>
          : filtered.map(f => (
            <button key={f.value} onMouseDown={e => { e.preventDefault(); onSelect(f.value); onClose(); }}
              className={`etb-font-item${currentFont === f.value ? " etb-sel-font" : ""}`}>
              <span style={{ fontFamily: f.value, fontSize: "1.05rem", color: "#1a1a1a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.label}
              </span>
              <span style={{ fontSize: ".65rem", color: "#ccc", flexShrink: 0 }}>{f.category}</span>
              {currentFont === f.value && <Check size={12} style={{ color: "#1a1a1a", flexShrink: 0 }} />}
            </button>
          ))}
      </div>
    </>
  );
}

function FontPickerBtn({ value, onChange, isMobile }: {
  value: string; onChange: (f: string) => void; isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = ALL_FONTS.find(f => f.value === value) ?? ALL_FONTS[0];
  const btn = (
    <button onMouseDown={e => { e.preventDefault(); setOpen(true); }}
      className="etb-sel" style={{ minWidth: isMobile ? 80 : 140 }}>
      <span style={{ fontFamily: value, fontSize: ".78rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
        {current.label}
      </span>
      <ChevronDown size={10} style={{ opacity: .45, flexShrink: 0 }} />
    </button>
  );

  if (isMobile) return (
    <>
      {btn}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Escolher fonte" height={560}>
        <FontPickerContent onSelect={onChange} currentFont={value} onClose={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
  return (
    <>
      {btn}
      <Modal open={open} onClose={() => setOpen(false)} title="Escolher fonte" width={420}>
        <div style={{ display: "flex", flexDirection: "column", height: 500 }}>
          <FontPickerContent onSelect={onChange} currentFont={value} onClose={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   FONT SIZE CONTROL
════════════════════════════════════════════════════════════ */
function FontSizeControl({ value, onChange, isMobile }: {
  value: string; onChange: (v: string) => void; isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bump = (d: number) => onChange(String(Math.max(6, Math.min(200, (parseInt(value) || 12) + d))));
  const apply = (v: string) => { const n = parseInt(v); if (!isNaN(n) && n > 0) onChange(String(n)); setOpen(false); };

  const sizeList = (
    <div style={{ overflowY: "auto", maxHeight: 320 }}>
      {FONT_SIZES.map(s => (
        <button key={s} onMouseDown={e => { e.preventDefault(); apply(s); }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 18px", background: value === s ? "#1a1a1a" : "none", border: "none", cursor: "pointer", fontSize: ".84rem", color: value === s ? "#fff" : "#1a1a1a", fontWeight: value === s ? 700 : 400, borderRadius: 0 }}>
          <span>{s}pt</span>
          {value === s && <Check size={12} />}
        </button>
      ))}
    </div>
  );

  if (isMobile) return (
    <>
      <div style={{ display: "flex", flexShrink: 0 }}>
        <div className="etb-stepper">
          <button className="etb-stepper-btn" onMouseDown={e => { e.preventDefault(); bump(-1); }}>−</button>
          <div className="etb-stepper-val" onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>{value}</div>
          <button className="etb-stepper-btn" onMouseDown={e => { e.preventDefault(); bump(1); }}>+</button>
        </div>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Tamanho da fonte">
        {sizeList}
      </BottomSheet>
    </>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      <button onMouseDown={e => { e.preventDefault(); bump(-1); }}
        style={{ width: 22, height: 30, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        <Minus size={11} />
      </button>
      <button onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className="etb-sel" style={{ width: 52, justifyContent: "center", fontWeight: 700 }}>
        {value}
      </button>
      <button onMouseDown={e => { e.preventDefault(); bump(1); }}
        style={{ width: 22, height: 30, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        <Plus size={11} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Tamanho da fonte" width={180}>
        <div style={{ paddingBottom: 6 }}>{sizeList}</div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COLOR PICKER — sem input[type=color] do browser
════════════════════════════════════════════════════════════ */
const COLORS = [
  "#000000","#1a1a2e","#374151","#6b7280","#9ca3af","#d1d5db","#e5e7eb","#ffffff",
  "#dc2626","#ea580c","#d97706","#ca8a04","#65a30d","#16a34a","#059669","#0d9488",
  "#0891b2","#0284c7","#2563eb","#4f46e5","#7c3aed","#9333ea","#c026d3","#db2777",
  "#fca5a5","#fdba74","#fcd34d","#86efac","#6ee7b7","#93c5fd","#c4b5fd","#f9a8d4",
];

function ColorPickerContent({ onColor, onClose }: { onColor: (c: string) => void; onClose: () => void }) {
  const [hex, setHex] = useState("#000000");
  const isValid = (h: string) => /^#[0-9a-f]{6}$/i.test(h);
  return (
    <>
      <div style={{ padding: "10px 14px 4px" }}>
        <DH t="Paleta" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 4, padding: "10px 0 8px" }}>
          {COLORS.map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); onColor(c); onClose(); }}
              className="etb-sw" style={{ background: c, outline: c === "#ffffff" ? "1px solid #e0e0e0" : "none" }} />
          ))}
        </div>
      </div>
      <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: ".68rem", color: "#aaa", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", margin: "10px 0 6px" }}>Hex personalizado</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 30, height: 30, background: isValid(hex) ? hex : "#ccc", border: "1.5px solid #e0e0e0", flexShrink: 0 }} />
          <input className="etb-hex" value={hex} onChange={e => setHex(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && isValid(hex)) { onColor(hex); onClose(); } }}
            placeholder="#000000" spellCheck={false}
            style={{ borderColor: hex.length > 0 && !isValid(hex) ? "#dc2626" : undefined }} />
          <button onMouseDown={e => { e.preventDefault(); if (isValid(hex)) { onColor(hex); onClose(); } }}
            style={{ height: 34, padding: "0 12px", background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: ".8rem", fontWeight: 700, flexShrink: 0, borderRadius: 0 }}>✓</button>
        </div>
      </div>
    </>
  );
}

function ColorPickerDrop({ icon: sv, Fallback, onColor, title }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onColor: (c: string) => void; title: string;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={15} inv={open} />
        <ChevronDown size={9} className="etb-chev" style={{ opacity: .5 }} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} width={280}>
        <ColorPickerContent onColor={onColor} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/* mobile color sheet */
function MobColorBtn({ onColor, label, icon: sv, Fallback }: {
  onColor: (c: string) => void; label: string;
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onMouseDown={e => { e.preventDefault(); setOpen(true); }} className="etb-mab">
        <Ico svg={sv} Fallback={Fallback} size={19} />
        <span>{label}</span>
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <ColorPickerContent onColor={c => { onColor(c); setOpen(false); }} onClose={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   IMAGE INSERT — file picker nativo no mobile
════════════════════════════════════════════════════════════ */
function ImageInsertBtn({ onImage, isMobile }: { onImage: () => void; isMobile: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const el = document.querySelector("[contenteditable]") as HTMLElement;
      if (el) { el.focus(); document.execCommand("insertHTML", false, `<img src="${src}" style="max-width:100%;height:auto;display:block;margin:8px 0"/><p></p>`); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  if (isMobile) return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      <button onMouseDown={e => { e.preventDefault(); fileRef.current?.click(); }} className="etb-mab">
        <Ico svg="image" Fallback={Image} size={19} />
        <span>Imagem</span>
      </button>
    </>
  );
  return <TB icon="image" Fallback={Image} label="Inserir imagem" onClick={onImage} />;
}

/* ════════════════════════════════════════════════════════════
   MOBILE BTN
════════════════════════════════════════════════════════════ */
function MobBtn({ icon: sv, Fallback, label, onClick, active, labelOnly }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; labelOnly?: boolean;
}) {
  injectCSS();
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      className={`etb-mab${active ? " etb-on" : ""}`}>
      {labelOnly
        ? <span style={{ fontSize: ".84rem", fontWeight: 900, lineHeight: 1 }}>{label}</span>
        : <Ico svg={sv} Fallback={Fallback} size={19} inv={active} />}
      {!labelOnly && <span>{label}</span>}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   PROPS
════════════════════════════════════════════════════════════ */
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
  onCode?: () => void; onQuote?: () => void;
  onSuperscript?: () => void; onSubscript?: () => void;
  onClearFormatting?: () => void; onExportPDF?: () => void;
  onAddNote?: () => void;
  isMobile?: boolean;
}

/* ════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════ */
export default function EditorToolbar(props: EditorToolbarProps) {
  injectCSS();
  const {
    onBold, onItalic, onUnderline, onStrikethrough, onAlignLeft, onAlignCenter,
    onAlignRight, onAlignJustify, onBulletList, onNumberedList, onLink, onImage,
    onTable, onSave, onUndo, onRedo, onNewDocument, onOpenDocument,
    onDownload, onShare, onHeading1, onHeading2, onHeading3, onCode, onQuote,
    onSuperscript, onSubscript, onClearFormatting, onExportPDF,
    onAddNote, isMobile = false,
  } = props;

  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Calibri, sans-serif");
  const [mobileTab, setMobileTab] = useState(0);
  const [tableOpen, setTableOpen] = useState(false);
  const { show: showDlg, Dialog: DlgEl } = useDialog();

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const applyFontSize = useCallback((sz: string) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${sz}pt`;
      try { range.surroundContents(span); }
      catch { const f = range.extractContents(); span.appendChild(f); range.insertNode(span); }
      sel.removeAllRanges();
    }
    setFontSize(sz);
  }, []);

  const applyFont = useCallback((ff: string) => { exec("fontName", ff); setFontFamily(ff); }, []);

  const insertTable = (rows: number, cols: number) => {
    let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++)
        html += `<td style="border:1.5px solid #ccc;padding:6px 10px;min-width:40px">&nbsp;</td>`;
      html += "</tr>";
    }
    html += "</tbody></table><p></p>";
    exec("insertHTML", html);
  };

  const doWordCount = async () => {
    const el = document.querySelector("[contenteditable]") as HTMLElement; if (!el) return;
    const t = el.innerText.trim();
    await showDlg({
      title: "Contagem de palavras",
      message: `Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.replace(/\s/g, "").length}\nCom espaços: ${t.length}\nLinhas: ${t.split("\n").length}`,
      actions: [{ label: "Fechar", primary: true }],
    });
  };

  const doFindReplace = async () => {
    const r1 = await showDlg({ title: "Localizar", input: { placeholder: "Texto a localizar..." }, actions: [{ label: "Cancelar" }, { label: "Continuar", primary: true }] });
    if (r1.action !== 1 || !r1.value) return;
    const find = r1.value;
    const r2 = await showDlg({ title: "Substituir por", input: { placeholder: "Substituir por..." }, actions: [{ label: "Cancelar" }, { label: "Substituir tudo", primary: true }] });
    if (r2.action !== 1) return;
    const el = document.querySelector("[contenteditable]") as HTMLElement;
    if (el) el.innerHTML = el.innerHTML.replaceAll(find, r2.value ?? "");
  };

  const doLink = async () => {
    const r = await showDlg({ title: "Inserir link", input: { placeholder: "https://...", type: "url" }, actions: [{ label: "Cancelar" }, { label: "Inserir", primary: true }] });
    if (r.action === 1 && r.value) exec("createLink", r.value);
  };

  /* ═ MOBILE ══════════════════════════════════════════════════════ */
  if (isMobile) {
    const TABS = ["Texto", "Inserir", "Formato", "Mais"];
    return (
      <>
        {DlgEl}
        <TableModal open={tableOpen} onClose={() => setTableOpen(false)} onInsert={insertTable} />
        <div className="etb-bar">
          <div style={{ padding: "7px 10px 4px" }}>
            <div className="etb-tabs">
              {TABS.map((t, i) => (
                <button key={t} className={`etb-tab${mobileTab === i ? " etb-active" : ""}`}
                  onMouseDown={e => { e.preventDefault(); setMobileTab(i); }}>{t}</button>
              ))}
            </div>
          </div>

          {/* TAB 0 — Texto */}
          {mobileTab === 0 && (
            <div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 6, paddingBottom: 6, gap: 6 }}>
                <FontPickerBtn value={fontFamily} onChange={applyFont} isMobile />
                <MobSep />
                <FontSizeControl value={fontSize} onChange={applyFontSize} isMobile />
              </div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} />
                <MobBtn icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} />
                <MobBtn icon="underline" Fallback={Underline} label="Subl." onClick={onUnderline} />
                <MobBtn icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
                <MobBtn icon="superscript" Fallback={Superscript} label="Sup" onClick={onSuperscript} />
                <MobBtn icon="subscript" Fallback={Subscript} label="Sub" onClick={onSubscript} />
              </div>
              <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn icon="align-left" Fallback={AlignLeft} label="Esq." onClick={onAlignLeft} />
                <MobBtn icon="align-center" Fallback={AlignCenter} label="Centro" onClick={onAlignCenter} />
                <MobBtn icon="align-right" Fallback={AlignRight} label="Dir." onClick={onAlignRight} />
                <MobBtn icon="align-justify" Fallback={AlignJustify} label="Just." onClick={onAlignJustify} />
                <MobSep />
                <MobColorBtn onColor={c => exec("foreColor", c)} label="Cor" icon="color-palette" Fallback={Palette} />
                <MobColorBtn onColor={c => exec("hiliteColor", c)} label="Realçar" icon="highlighter" Fallback={Highlighter} />
                <MobSep />
                <MobBtn icon="arrow-undo" Fallback={Undo2} label="Desfaz." onClick={onUndo} />
                <MobBtn icon="arrow-redo" Fallback={Redo2} label="Refaz." onClick={onRedo} />
              </div>
            </div>
          )}

          {/* TAB 1 — Inserir */}
          {mobileTab === 1 && (
            <div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn icon="list-bullet" Fallback={List} label="Lista" onClick={onBulletList} />
                <MobBtn icon="list-number" Fallback={ListOrdered} label="Núm." onClick={onNumberedList} />
                <MobBtn Fallback={CheckSquare} label="Tarefa" onClick={() => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")} />
                <MobSep />
                <MobBtn icon="link" Fallback={Link} label="Link" onClick={() => doLink()} />
                <ImageInsertBtn onImage={onImage} isMobile />
                <MobBtn icon="table" Fallback={Table} label="Tabela" onClick={() => setTableOpen(true)} />
                <MobSep />
                <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
                <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
              </div>
              <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn Fallback={AlertTriangle} label="Aviso" onClick={() => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui.</div><p></p>")} />
                <MobBtn Fallback={Info} label="Info" onClick={() => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>")} />
                <MobBtn Fallback={CheckCircle} label="Sucesso" onClick={() => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>✅</strong> Escreve aqui.</div><p></p>")} />
                <MobBtn Fallback={XCircle} label="Erro" onClick={() => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>❌</strong> Escreve aqui.</div><p></p>")} />
                <MobSep />
                <MobBtn Fallback={SeparatorHorizontal} label="Linha" onClick={() => exec("insertHorizontalRule")} />
                <MobBtn Fallback={Calendar} label="Data" onClick={() => exec("insertText", new Date().toLocaleString("pt-PT"))} />
                <MobBtn Fallback={Plus} label="Indent+" onClick={() => exec("indent")} />
                <MobBtn Fallback={Minus} label="Indent-" onClick={() => exec("outdent")} />
              </div>
            </div>
          )}

          {/* TAB 2 — Formato */}
          {mobileTab === 2 && (
            <div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn Fallback={Heading1} label="H1" onClick={onHeading1} labelOnly />
                <MobBtn Fallback={Heading2} label="H2" onClick={onHeading2} labelOnly />
                <MobBtn Fallback={Heading3} label="H3" onClick={onHeading3} labelOnly />
                <MobBtn Fallback={Heading4} label="H4" onClick={() => exec("formatBlock", "<h4>")} labelOnly />
                <MobBtn Fallback={Heading5} label="H5" onClick={() => exec("formatBlock", "<h5>")} labelOnly />
                <MobSep />
                <MobBtn icon="text" Fallback={Pilcrow} label="Normal" onClick={() => exec("formatBlock", "<p>")} />
                <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
                <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
              </div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn Fallback={CaseUpper} label="MAIUSC." onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
                <MobBtn Fallback={CaseSensitive} label="minusc." onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
                <MobSep />
                <MobBtn Fallback={AlignVerticalJustifyStart} label="1.0" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1"; }} />
                <MobBtn Fallback={AlignVerticalJustifyStart} label="1.5" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1.5"; }} />
                <MobBtn Fallback={AlignVerticalJustifyStart} label="2.0" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "2"; }} />
              </div>
              <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn Fallback={FileCode} label="Localizar" onClick={() => doFindReplace()} />
                <MobBtn Fallback={Hash} label="Palavras" onClick={() => doWordCount()} />
                <MobSep />
                <MobBtn Fallback={Trash2} label="Limpar" onClick={onClearFormatting} />
              </div>
            </div>
          )}

          {/* TAB 3 — Mais */}
          {mobileTab === 3 && (
            <div>
              <div className="etb-mrow" style={{ borderBottom: "1px solid #f0f0f0", paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn icon="save" Fallback={Save} label="Guardar" onClick={onSave} />
                <MobBtn icon="download" Fallback={FileDown} label="PDF" onClick={onExportPDF} />
                <MobBtn icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
                <MobSep />
                <MobBtn icon="document-add" Fallback={FileText} label="Novo" onClick={onNewDocument} />
                <MobBtn icon="document-text" Fallback={BookOpen} label="Abrir" onClick={onOpenDocument} />
                <MobBtn icon="document" Fallback={FileText} label="Word" onClick={onDownload} />
              </div>
              <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4 }}>
                <MobBtn icon="eye" Fallback={Eye} label="Ver" onClick={() => { }} />
                <MobBtn icon="pencil" Fallback={PenLine} label="Revisão" onClick={() => { }} />
                <MobBtn icon="cloud-upload" Fallback={CloudUpload} label="Nuvem" onClick={onSave} />
                <MobSep />
                <MobBtn Fallback={Users} label="Convidar" onClick={() => { }} />
                <MobBtn Fallback={ClipboardList} label="Nota" onClick={() => onAddNote?.()} />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ═ DESKTOP ═══════════════════════════════════════════════════ */
  return (
    <>
      {DlgEl}
      <TableModal open={tableOpen} onClose={() => setTableOpen(false)} onInsert={insertTable} />
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", flexShrink: 0 }}>

        {/* Row 1 — compacto */}
        <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 1, padding: "4px 8px 3px" }}>
          <ModalDrop label="Ficheiro" icon="folder-open" Fallback={FileText} width={260}>
            <DH t="Ficheiro" />
            <DI icon="document-add" Fallback={FileText} label="Novo documento" onClick={onNewDocument} kbd="Ctrl+N" />
            <DI icon="document-text" Fallback={BookOpen} label="Abrir documento" onClick={onOpenDocument} />
            <DSep />
            <DI icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
            <DI icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
            <DI icon="document" Fallback={FileText} label="Exportar Word" onClick={onDownload} />
            <DSep />
            <DI icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
            <DI icon="cloud-upload" Fallback={CloudUpload} label="Guardar na nuvem" onClick={onSave} />
          </ModalDrop>

          <Sep />
          <TB icon="arrow-undo" Fallback={Undo2} label="Desfazer" onClick={onUndo} kbd="Ctrl+Z" />
          <TB icon="arrow-redo" Fallback={Redo2} label="Refazer" onClick={onRedo} kbd="Ctrl+Y" />
          <Sep />

          <ModalDrop label="Estilos" icon="text" Fallback={Pilcrow} width={240}>
            <DH t="Estilo de parágrafo" />
            <DI icon="text" Fallback={Pilcrow} label="Parágrafo normal" onClick={() => exec("formatBlock", "<p>")} />
            <DSep />
            <DI Fallback={Heading1} label="Título 1" onClick={onHeading1} />
            <DI Fallback={Heading2} label="Título 2" onClick={onHeading2} />
            <DI Fallback={Heading3} label="Título 3" onClick={onHeading3} />
            <DI Fallback={Heading4} label="Título 4" onClick={() => exec("formatBlock", "<h4>")} />
            <DI Fallback={Heading5} label="Título 5" onClick={() => exec("formatBlock", "<h5>")} />
            <DSep />
            <DI icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
            <DI icon="code-slash" Fallback={Code} label="Bloco de código" onClick={onCode} />
          </ModalDrop>

          <FontPickerBtn value={fontFamily} onChange={applyFont} isMobile={false} />
          <FontSizeControl value={fontSize} onChange={applyFontSize} isMobile={false} />
          <Sep />
          <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
          <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
          <TB icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
          <TB icon="eye" Fallback={Eye} label="Pré-visualizar" onClick={() => { }} />
        </div>

        {/* Row 2 — compacto */}
        <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 1, padding: "1px 8px 5px" }}>
          <TB icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} kbd="Ctrl+B" />
          <TB icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} kbd="Ctrl+I" />
          <TB icon="underline" Fallback={Underline} label="Sublinhado" onClick={onUnderline} kbd="Ctrl+U" />
          <TB icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
          <TB icon="superscript" Fallback={Superscript} label="Sobrescrito" onClick={onSuperscript} />
          <TB icon="subscript" Fallback={Subscript} label="Subscrito" onClick={onSubscript} />
          <Sep />
          <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={c => exec("foreColor", c)} title="Cor do texto" />
          <ColorPickerDrop icon="highlighter" Fallback={Highlighter} onColor={c => exec("hiliteColor", c)} title="Realçar texto" />
          <Sep />
          <TB icon="align-left" Fallback={AlignLeft} label="Alinhar esquerda" onClick={onAlignLeft} />
          <TB icon="align-center" Fallback={AlignCenter} label="Centrar" onClick={onAlignCenter} />
          <TB icon="align-right" Fallback={AlignRight} label="Alinhar direita" onClick={onAlignRight} />
          <TB icon="align-justify" Fallback={AlignJustify} label="Justificar" onClick={onAlignJustify} />
          <Sep />
          <TB icon="list-bullet" Fallback={List} label="Lista com marcadores" onClick={onBulletList} />
          <TB icon="list-number" Fallback={ListOrdered} label="Lista numerada" onClick={onNumberedList} />
          <TB Fallback={CheckSquare} label="Lista de tarefas" onClick={() => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")} />
          <TB icon="indent-increase" Fallback={Plus} label="Indent+" onClick={() => exec("indent")} />
          <TB icon="indent-decrease" Fallback={Minus} label="Indent-" onClick={() => exec("outdent")} />
          <Sep />
          <TB icon="link" Fallback={Link} label="Inserir link" onClick={() => doLink()} />
          <ImageInsertBtn onImage={onImage} isMobile={false} />
          <TB icon="table" Fallback={Table} label="Inserir tabela" onClick={() => setTableOpen(true)} />
          <TB icon="code-slash" Fallback={Code} label="Código inline" onClick={() => exec("insertHTML", "<code style='background:#f4f4f4;padding:1px 5px;font-family:monospace;font-size:.88em'>código</code>")} />
          <TB icon="remove" Fallback={SeparatorHorizontal} label="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />
          <Sep />

          <GridDrop label="Inserir" icon="apps" Fallback={Plus} title="Inserir elemento" cols={3} items={[
            { icon: "quote", Icon: Quote, label: "Citação", onClick: () => onQuote?.() },
            { icon: "code-slash", Icon: Code, label: "Código", onClick: () => onCode?.() },
            { Icon: Bookmark, label: "Nota rodapé", onClick: () => exec("insertHTML", "<sup style='color:#888;font-size:.7em'>[nota]</sup>") },
            { Icon: AlertTriangle, label: "Aviso", onClick: () => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>⚠️</strong> Escreve aqui.</div><p></p>") },
            { Icon: Info, label: "Info", onClick: () => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>ℹ️</strong> Escreve aqui.</div><p></p>") },
            { Icon: CheckCircle, label: "Sucesso", onClick: () => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>✅</strong> Escreve aqui.</div><p></p>") },
            { Icon: XCircle, label: "Erro", onClick: () => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;font-size:.9em'><strong>❌</strong> Escreve aqui.</div><p></p>") },
            { Icon: Calendar, label: "Data/hora", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
            { Icon: WrapText, label: "Quebra pág.", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e0e0e0;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
            { Icon: ClipboardList, label: "Nota", onClick: () => onAddNote?.() },
            { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => { } },
            { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#f1f1f1;color:#333;padding:2px 8px;font-size:.78em;font-weight:600'>etiqueta</span>") },
          ]} />

          <ModalDrop label="Formatar" icon="options" Fallback={Settings2} width={280}>
            <DH t="Transformar texto" />
            <DI Fallback={CaseUpper} label="MAIÚSCULAS" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
            <DI Fallback={CaseSensitive} label="minúsculas" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
            <DI Fallback={CaseSensitive} label="Primeira Maiúscula" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, c => c.toUpperCase())); }} />
            <DSep />
            <DH t="Espaçamento de linha" />
            <DI Fallback={AlignVerticalJustifyStart} label="Simples (1.0)" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1"; }} />
            <DI Fallback={AlignVerticalJustifyStart} label="1.5 linhas" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1.5"; }} />
            <DI Fallback={AlignVerticalJustifyStart} label="Duplo (2.0)" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "2"; }} />
            <DSep />
            <DI icon="swap-horizontal" Fallback={FileCode} label="Localizar e substituir" onClick={() => doFindReplace()} />
            <DI Fallback={Hash} label="Contar palavras" onClick={() => doWordCount()} />
            <DSep />
            <DI icon="pencil" Fallback={PenLine} label="Modo de revisão" onClick={() => { }} />
            <DSep />
            <DI Fallback={Trash2} label="Limpar formatação" onClick={onClearFormatting} red />
          </ModalDrop>

          <Sep />

          <ModalDrop label="Partilhar" icon="share-social" Fallback={Share2} width={260}>
            <DH t="Partilhar & Exportar" />
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
          </ModalDrop>
        </div>
      </div>
    </>
  );
}
