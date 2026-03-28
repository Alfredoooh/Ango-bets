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
  Zap, Eye, PenLine, Users, BarChart3, Cloud, CloudUpload, CloudCog,
  Star, Heart, Tag, Search,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────────── */
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
@keyframes etbFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes etbSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes etbModalIn {
  0%  { opacity:0; transform:scale(.93) translateY(14px); }
  100%{ opacity:1; transform:scale(1)   translateY(0); }
}

.etb-scroll::-webkit-scrollbar{height:3px}
.etb-scroll::-webkit-scrollbar-track{background:transparent}
.etb-scroll::-webkit-scrollbar-thumb{background:#d4d4d4;border-radius:99px}
.etb-scroll{-ms-overflow-style:none;scrollbar-width:thin}

.etb-btn{
  display:flex;align-items:center;justify-content:center;gap:3px;
  padding:0 9px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:#888;
  font-size:.78rem;font-weight:500;flex-shrink:0;
  position:relative;overflow:hidden;outline:none;
  transition:background .12s,color .12s,transform .1s,box-shadow .12s;
  min-width:36px;-webkit-tap-highlight-color:transparent;
}
.etb-btn:hover:not(.etb-on){background:#f0f0f0;color:#1a1a1a;transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.06);}
.etb-btn.etb-on{background:#1a1a1a;color:#fff;}
.etb-btn:active{transform:scale(.92)!important}

.etb-drop{
  display:flex;align-items:center;gap:5px;
  padding:0 10px;height:36px;border-radius:9px;border:none;cursor:pointer;
  background:transparent;color:#777;
  font-size:.8rem;font-weight:600;flex-shrink:0;letter-spacing:.01em;
  transition:background .12s,color .12s;-webkit-tap-highlight-color:transparent;
}
.etb-drop:hover,.etb-drop.etb-on{background:#f0f0f0;color:#1a1a1a}
.etb-drop.etb-on{background:#1a1a1a!important;color:#fff!important}
.etb-drop.etb-on .etb-chev{filter:invert(1)}

.etb-sel{
  display:flex;align-items:center;gap:4px;height:36px;
  padding:0 9px;border-radius:9px;
  border:1.5px solid #e0e0e0;background:#fff;cursor:pointer;
  font-size:.78rem;font-weight:500;color:#1a1a1a;flex-shrink:0;
  transition:border-color .12s,box-shadow .12s;
}
.etb-sel:hover{border-color:#1a1a1a;box-shadow:0 0 0 3px rgba(0,0,0,.05)}

.etb-popup{
  position:fixed;z-index:99999;
  background:#fff;border:1px solid #e4e4e4;border-radius:16px;
  box-shadow:0 2px 0 rgba(0,0,0,.03),0 8px 32px rgba(0,0,0,.1),0 24px 64px rgba(0,0,0,.07);
  overflow:hidden;
}
.etb-popup.etb-down{animation:etbPopIn .22s cubic-bezier(.34,1.56,.64,1) both}
.etb-popup.etb-up{animation:etbPopInUp .22s cubic-bezier(.34,1.56,.64,1) both}

.etb-ph{padding:11px 16px 8px;font-size:.67rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#aaa;border-bottom:1px solid #f0f0f0;}

.etb-di{display:flex;align-items:center;gap:10px;width:100%;padding:9px 16px;background:none;border:none;cursor:pointer;font-size:.84rem;color:#1a1a1a;text-align:left;transition:background .08s;}
.etb-di:hover{background:#f4f4f4}
.etb-di.etb-red{color:#dc2626}

.etb-gb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border-radius:10px;border:none;cursor:pointer;background:transparent;color:#777;font-size:.68rem;font-weight:500;text-align:center;transition:background .1s,color .1s,transform .12s;min-width:62px;}
.etb-gb:hover{background:#f0f0f0;color:#1a1a1a;transform:translateY(-2px)}
.etb-gb:active{transform:scale(.91)}

.etb-sw{width:22px;height:22px;border-radius:6px;cursor:pointer;border:2px solid rgba(255,255,255,.5);box-shadow:0 1px 3px rgba(0,0,0,.18);transition:transform .1s,box-shadow .1s;position:relative;}
.etb-sw:hover{transform:scale(1.3);box-shadow:0 3px 10px rgba(0,0,0,.3);z-index:1}

.etb-sep{width:1px;height:20px;background:#e4e4e4;margin:0 3px;flex-shrink:0;opacity:.85}

/* modal */
.etb-modal-overlay{position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;animation:etbFadeIn .15s ease both;}
.etb-modal{background:#fff;border-radius:20px;box-shadow:0 8px 48px rgba(0,0,0,.22);animation:etbModalIn .22s cubic-bezier(.34,1.56,.64,1) both;overflow:hidden;display:flex;flex-direction:column;max-height:88vh;}

/* mobile sheet */
.etb-sheet{position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -4px 40px rgba(0,0,0,.14);animation:etbSlideUp .24s cubic-bezier(.25,.46,.45,.94) both;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;}
.etb-sheet-handle{display:flex;justify-content:center;padding:14px 0 8px;flex-shrink:0;}
.etb-sheet-handle-bar{width:40px;height:4px;border-radius:99px;background:#e0e0e0;}

/* iOS tabs */
.etb-ios-tabs{display:flex;gap:0;background:#f2f2f2;border-radius:10px;padding:2px;flex-shrink:0;}
.etb-ios-tab{flex:1;height:32px;border-radius:8px;border:none;cursor:pointer;font-size:.75rem;font-weight:600;color:#888;background:transparent;transition:all .18s cubic-bezier(.34,1.56,.64,1);-webkit-tap-highlight-color:transparent;}
.etb-ios-tab.etb-active{background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,.12),0 1px 0 rgba(0,0,0,.04);}

/* bottom bar */
.etb-bar{position:fixed;bottom:0;left:0;right:0;z-index:200;background:#fff;border-top:1.5px solid #e8e8e8;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -4px 28px rgba(0,0,0,.08);animation:etbSlideUp .22s cubic-bezier(.25,.46,.45,.94);}

.etb-mab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:7px 6px 5px;min-width:46px;border:none;cursor:pointer;background:transparent;color:#777;flex-shrink:0;font-size:.62rem;font-weight:500;letter-spacing:.01em;transition:background .12s,color .12s,transform .1s;border-radius:10px;-webkit-tap-highlight-color:transparent;}
.etb-mab:hover,.etb-mab.etb-on{background:#ebebeb;color:#1a1a1a}
.etb-mab.etb-on{background:#1a1a1a;color:#fff}
.etb-mab:active{transform:scale(.88)}

.etb-mrow{display:flex;align-items:center;padding:3px 10px;overflow-x:auto;gap:0;-ms-overflow-style:none;scrollbar-width:none;}
.etb-mrow::-webkit-scrollbar{display:none}
.etb-mrow-sep{width:1px;height:30px;background:#ebebeb;margin:0 4px;flex-shrink:0}

.etb-font-item{display:flex;align-items:center;gap:12px;width:100%;padding:11px 16px;background:none;border:none;cursor:pointer;text-align:left;transition:background .08s;border-bottom:1px solid #f5f5f5;}
.etb-font-item:hover{background:#f8f8f8}
.etb-font-item.etb-selected{background:#f0f0f0}
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("etb-css")) return;
  const s = document.createElement("style");
  s.id = "etb-css";
  s.textContent = ETB_CSS;
  document.head.appendChild(s);
}

/* ── Ico ── */
function Ico({ svg, Fallback, size = 15, inv }: {
  svg?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  size?: number; inv?: boolean;
}) {
  const [ok, setOk] = useState(true);
  if (svg && ok) {
    return <img src={`/assets/icons/svg/${svg}.svg`} alt="" width={size} height={size}
      style={{ display: "inline-block", flexShrink: 0, filter: inv ? "invert(1)" : undefined }}
      onError={() => setOk(false)} />;
  }
  return <Fallback size={size} strokeWidth={1.75} />;
}

/* ── Ripple ── */
function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 2.4;
    const r = document.createElement("span");
    r.style.cssText = `position:absolute;width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;background:rgba(0,0,0,.08);border-radius:50%;pointer-events:none;animation:etbRipple .55s ease-out forwards`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }, []);
}

/* ── TB ── */
function TB({ icon: sv, Fallback, label, onClick, active, kbd, children }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; kbd?: string; children?: React.ReactNode;
}) {
  injectCSS();
  const ripple = useRipple();
  return (
    <button onMouseDown={(e) => { e.preventDefault(); onClick?.(); }} onClick={ripple as any}
      title={`${label}${kbd ? ` (${kbd})` : ""}`} className={`etb-btn${active ? " etb-on" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={16} inv={active} />
      {children}
    </button>
  );
}

const Sep = () => <div className="etb-sep" />;
const DSep = () => <div style={{ height: 1, background: "#f0f0f0", margin: "4px 8px" }} />;
const DHeader = ({ t }: { t: string }) => <div className="etb-ph">{t}</div>;

/* ══ FONT DATA ══════════════════════════════════════════════════ */
const ALL_FONTS = [
  { label: "Calibri",        value: "Calibri, sans-serif",                         category: "Sans-serif" },
  { label: "Arial",          value: "Arial, sans-serif",                           category: "Sans-serif" },
  { label: "Helvetica",      value: "'Helvetica Neue', Helvetica, sans-serif",     category: "Sans-serif" },
  { label: "Verdana",        value: "Verdana, sans-serif",                         category: "Sans-serif" },
  { label: "Trebuchet MS",   value: "'Trebuchet MS', sans-serif",                  category: "Sans-serif" },
  { label: "Tahoma",         value: "Tahoma, sans-serif",                          category: "Sans-serif" },
  { label: "Gill Sans",      value: "'Gill Sans', sans-serif",                     category: "Sans-serif" },
  { label: "Century Gothic", value: "'Century Gothic', sans-serif",                category: "Sans-serif" },
  { label: "Optima",         value: "Optima, sans-serif",                          category: "Sans-serif" },
  { label: "Segoe UI",       value: "'Segoe UI', system-ui, sans-serif",           category: "Sans-serif" },
  { label: "Georgia",        value: "Georgia, serif",                              category: "Serif" },
  { label: "Times New Roman",value: "'Times New Roman', Times, serif",             category: "Serif" },
  { label: "Garamond",       value: "Garamond, 'EB Garamond', serif",             category: "Serif" },
  { label: "Palatino",       value: "'Palatino Linotype', Palatino, serif",        category: "Serif" },
  { label: "Book Antiqua",   value: "'Book Antiqua', Palatino, serif",             category: "Serif" },
  { label: "Baskerville",    value: "Baskerville, 'Baskerville Old Face', serif",  category: "Serif" },
  { label: "Cambria",        value: "Cambria, serif",                              category: "Serif" },
  { label: "Constantia",     value: "Constantia, serif",                           category: "Serif" },
  { label: "Didot",          value: "Didot, 'Didot LT STD', serif",               category: "Serif" },
  { label: "Rockwell",       value: "Rockwell, serif",                             category: "Serif" },
  { label: "Courier New",    value: "'Courier New', Courier, monospace",           category: "Monospace" },
  { label: "Monaco",         value: "Monaco, 'Lucida Console', monospace",         category: "Monospace" },
  { label: "Consolas",       value: "Consolas, monospace",                         category: "Monospace" },
  { label: "Lucida Console", value: "'Lucida Console', monospace",                 category: "Monospace" },
  { label: "Andale Mono",    value: "'Andale Mono', monospace",                    category: "Monospace" },
  { label: "Impact",         value: "Impact, 'Arial Narrow', sans-serif",          category: "Display" },
  { label: "Arial Black",    value: "'Arial Black', 'Arial Bold', sans-serif",     category: "Display" },
  { label: "Copperplate",    value: "Copperplate, 'Copperplate Gothic Light', serif", category: "Display" },
  { label: "Futura",         value: "Futura, 'Century Gothic', sans-serif",        category: "Display" },
  { label: "Papyrus",        value: "Papyrus, fantasy",                            category: "Display" },
  { label: "Comic Sans MS",  value: "'Comic Sans MS', cursive",                    category: "Handwriting" },
  { label: "Brush Script MT", value: "'Brush Script MT', cursive",                category: "Handwriting" },
  { label: "San Francisco",  value: "-apple-system, 'SF Pro Display', sans-serif", category: "System" },
  { label: "System UI",      value: "system-ui, sans-serif",                       category: "System" },
];
const FONT_CATEGORIES = ["Todas", "Sans-serif", "Serif", "Monospace", "Display", "Handwriting", "System"];
const FONT_SIZES = ["8","9","10","11","12","14","16","18","20","22","24","28","32","36","40","48","56","64","72","96"].map(s => ({ label: s, value: s }));

/* ══ FONT PICKER MODAL ══════════════════════════════════════════ */
function FontPickerModal({ open, onClose, onSelect, currentFont, isMobile }: {
  open: boolean; onClose: () => void; onSelect: (f: string) => void;
  currentFont: string; isMobile: boolean;
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const startY = useRef<number | null>(null);

  const filtered = ALL_FONTS.filter(f =>
    (cat === "Todas" || f.category === cat) &&
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  const inner = (
    <>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: ".95rem", fontWeight: 700, color: "#1a1a1a" }}>Escolher fonte</span>
          {!isMobile && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 22, lineHeight: 1, padding: "0 2px" }}>×</button>
          )}
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar fonte..."
            style={{ width: "100%", padding: "8px 12px 8px 30px", border: "1.5px solid #ebebeb", borderRadius: 10, fontSize: ".82rem", outline: "none", background: "#fafafa" }}
            onFocus={e => (e.target.style.borderColor = "#1a1a1a")}
            onBlur={e => (e.target.style.borderColor = "#ebebeb")} />
        </div>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {FONT_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none",
              background: cat === c ? "#1a1a1a" : "#f0f0f0",
              color: cat === c ? "#fff" : "#666",
              fontSize: ".72rem", fontWeight: 600, cursor: "pointer", transition: "all .14s",
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#ccc", fontSize: ".85rem" }}>Nenhuma fonte encontrada</div>
        ) : filtered.map(font => (
          <button key={font.value}
            onMouseDown={(e) => { e.preventDefault(); onSelect(font.value); onClose(); }}
            className={`etb-font-item${currentFont === font.value ? " etb-selected" : ""}`}>
            <span style={{ fontFamily: font.value, fontSize: "1.1rem", color: "#1a1a1a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {font.label}
            </span>
            <span style={{ fontSize: ".67rem", color: "#ccc", flexShrink: 0 }}>{font.category}</span>
            {currentFont === font.value && <CheckCircle size={13} style={{ color: "#1a1a1a", flexShrink: 0 }} />}
          </button>
        ))}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 99997, background: "rgba(0,0,0,.4)", animation: "etbFadeIn .15s ease both" }} />
        <div className="etb-sheet" style={{ zIndex: 99998, paddingBottom: "env(safe-area-inset-bottom,0px)" }}
          onTouchStart={e => { startY.current = e.touches[0].clientY; }}
          onTouchMove={e => { if (startY.current !== null && e.touches[0].clientY - startY.current > 70) onClose(); }}>
          <div className="etb-sheet-handle"><div className="etb-sheet-handle-bar" /></div>
          {inner}
        </div>
      </>
    );
  }
  return (
    <div className="etb-modal-overlay" onClick={onClose}>
      <div className="etb-modal" style={{ width: 420, height: 560 }} onClick={e => e.stopPropagation()}>
        {inner}
      </div>
    </div>
  );
}

/* ══ FONT SIZE CONTROL ══════════════════════════════════════════ */
function FontSizeControl({ value, onChange, isMobile }: {
  value: string; onChange: (v: string) => void; isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inp, setInp] = useState(value);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const startY = useRef<number | null>(null);

  useEffect(() => { setInp(value); }, [value]);

  const openIt = () => {
    if (!isMobile && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.left) });
    }
    setOpen(true);
  };

  const apply = (v: string) => {
    const n = parseInt(v);
    if (!isNaN(n) && n > 0 && n < 400) { onChange(String(n)); setInp(String(n)); }
    setOpen(false);
  };

  const sizeList = (
    <div style={{ padding: "6px 0" }}>
      <div style={{ padding: "6px 12px 10px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => apply(String(Math.max(1, parseInt(inp || "12") - 1)))}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Minus size={13} />
          </button>
          <input value={inp} onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key === "Enter" && apply(inp)}
            onBlur={() => apply(inp)}
            style={{ width: 52, textAlign: "center", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "6px 4px", fontSize: ".88rem", fontWeight: 700, outline: "none" }} />
          <button onClick={() => apply(String(parseInt(inp || "12") + 1))}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={13} />
          </button>
        </div>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {FONT_SIZES.map(s => (
          <button key={s.value} onMouseDown={(e) => { e.preventDefault(); apply(s.value); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "8px 16px",
              background: value === s.value ? "#1a1a1a" : "none", border: "none", cursor: "pointer",
              fontSize: ".84rem", color: value === s.value ? "#fff" : "#1a1a1a", fontWeight: value === s.value ? 700 : 400,
            }}>
            <span>{s.label}pt</span>
            {value === s.value && <CheckCircle size={13} />}
          </button>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); openIt(); }} className="etb-mab">
          <span style={{ fontSize: ".9rem", fontWeight: 800 }}>{value}</span>
          <span>Tamanho</span>
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99997, background: "rgba(0,0,0,.4)", animation: "etbFadeIn .15s ease both" }} />
            <div className="etb-sheet" style={{ zIndex: 99998, paddingBottom: "env(safe-area-inset-bottom,0px)" }}
              onTouchStart={e => { startY.current = e.touches[0].clientY; }}
              onTouchMove={e => { if (startY.current !== null && e.touches[0].clientY - startY.current > 70) setOpen(false); }}>
              <div className="etb-sheet-handle"><div className="etb-sheet-handle-bar" /></div>
              <div style={{ padding: "8px 20px 14px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                <span style={{ fontSize: ".9rem", fontWeight: 700 }}>Tamanho da fonte</span>
              </div>
              {sizeList}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={(e) => { e.preventDefault(); openIt(); }}
        className="etb-sel" style={{ width: 68, justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600 }}>{value}pt</span>
        <ChevronDown size={10} style={{ opacity: .45 }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99997 }} />
          <div className="etb-popup etb-down" style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: 130, zIndex: 99998 }}>
            {sizeList}
          </div>
        </>
      )}
    </div>
  );
}

/* ══ PopupCard ══════════════════════════════════════════════════ */
function PopupCard({ btnRef, open, onClose, align = "left", minWidth = 230, children }: {
  btnRef: React.RefObject<HTMLButtonElement | null>; open: boolean; onClose: () => void;
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
      onMouseDown={e => e.stopPropagation()}>
      {children}
    </div>
  );
}

/* ── Drop ── */
function Drop({ label, icon: sv, Fallback, children, align = "left", minWidth = 230 }: {
  label?: string; icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode; align?: "left" | "right" | "center"; minWidth?: number;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
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

/* ── DI ── */
function DI({ icon: sv, Fallback, label, onClick, kbd, red }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; kbd?: string; red?: boolean;
}) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      className={`etb-di${red ? " etb-red" : ""}`}>
      <Ico svg={sv} Fallback={Fallback} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span style={{ fontSize: ".7rem", opacity: .35, marginLeft: "auto" }}>{kbd}</span>}
    </button>
  );
}

/* ── GridDrop ── */
function GridDrop({ label, icon: sv, Fallback, items, columns = 3, title, align = "left" }: {
  label?: string; icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  items: { icon?: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; onClick: () => void }[];
  columns?: number; title?: string; align?: "left" | "right" | "center";
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={16} inv={open} />
        {label && <span>{label}</span>}
        <ChevronDown size={11} className="etb-chev" style={{ opacity: .5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s cubic-bezier(.34,1.56,.64,1)" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} align={align} minWidth={250}>
        {title && <DHeader t={title} />}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 4, padding: 10 }}
          onClick={() => setOpen(false)}>
          {items.map((item, i) => (
            <button key={i} onMouseDown={e => { e.preventDefault(); item.onClick(); }}
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

/* ── ColorPickerDrop ── */
function ColorPickerDrop({ icon: sv, Fallback, onColor, title = "Cor" }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
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
      <button ref={btnRef} onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className={`etb-drop${open ? " etb-on" : ""}`}>
        <Ico svg={sv} Fallback={Fallback} size={16} inv={open} />
        <ChevronDown size={11} className="etb-chev" style={{ opacity: .5 }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={222}>
        <DHeader t={title} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5, padding: 12 }}
          onClick={() => setOpen(false)}>
          {COLORS.map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); onColor(c); }}
              className="etb-sw" title={c}
              style={{ background: c, outline: c === "#ffffff" ? "1px solid #e0e0e0" : "none" }} />
          ))}
        </div>
        <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: ".72rem", color: "#aaa" }}>Personalizado:</span>
          <input type="color" onMouseDown={e => e.stopPropagation()}
            onChange={e => { onColor(e.target.value); setOpen(false); }}
            style={{ width: 32, height: 26, border: "1.5px solid #e0e0e0", borderRadius: 7, cursor: "pointer", padding: 2 }} />
        </div>
      </PopupCard>
    </div>
  );
}

/* ── Sel ── */
function Sel({ options, value, onChange, width = 100 }: {
  options: { label: string; value: string }[]; value?: string; onChange: (v: string) => void; width?: number;
}) {
  injectCSS();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = options.find(o => o.value === value);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button ref={btnRef} onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className="etb-sel" style={{ width }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? options[0]?.label}
        </span>
        <ChevronDown size={10} style={{ opacity: .45, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .18s ease" }} />
      </button>
      <PopupCard btnRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={width}>
        <div style={{ padding: "4px 0", maxHeight: 290, overflowY: "auto" }} onClick={() => setOpen(false)}>
          {options.map(o => (
            <button key={o.value} onMouseDown={e => { e.preventDefault(); onChange(o.value); }}
              className="etb-di"
              style={{ background: value === o.value ? "#1a1a1a" : "none", color: value === o.value ? "#fff" : "#1a1a1a", fontWeight: value === o.value ? 700 : 400 }}>
              {o.label}
              {value === o.value && <CheckCircle size={13} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      </PopupCard>
    </div>
  );
}

/* ── FontPickerBtn ── */
function FontPickerBtn({ value, onChange, isMobile }: {
  value: string; onChange: (f: string) => void; isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = ALL_FONTS.find(f => f.value === value) ?? ALL_FONTS[0];
  return (
    <>
      <button onMouseDown={e => { e.preventDefault(); setOpen(true); }}
        className="etb-sel" style={{ width: isMobile ? "auto" : 148, gap: 6, minWidth: isMobile ? 0 : 148 }}>
        <span style={{ fontFamily: value, fontSize: ".82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
          {current.label}
        </span>
        <ChevronDown size={10} style={{ opacity: .45, flexShrink: 0 }} />
      </button>
      <FontPickerModal open={open} onClose={() => setOpen(false)} onSelect={onChange} currentFont={value} isMobile={isMobile} />
    </>
  );
}

/* ── MobBtn ── */
function MobBtn({ icon: sv, Fallback, label, onClick, active, labelOnly }: {
  icon?: string; Fallback: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string; onClick?: () => void; active?: boolean; labelOnly?: boolean;
}) {
  injectCSS();
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick?.(); }}
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
  onCode?: () => void; onQuote?: () => void; onHighlight?: () => void;
  onSuperscript?: () => void; onSubscript?: () => void;
  onClearFormatting?: () => void; onExportPDF?: () => void;
  onAddNote?: () => void; onColorPicker?: () => void;
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
    onHighlight, onSuperscript, onSubscript, onClearFormatting, onExportPDF,
    onAddNote, onColorPicker, isMobile = false,
  } = props;

  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Calibri, sans-serif");
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

  /* ═ MOBILE ════════════════════════════════════════════════ */
  if (isMobile) {
    const TABS = ["Texto", "Inserir", "Formato", "Mais"];
    return (
      <div className="etb-bar">
        <div style={{ padding: "8px 12px 4px" }}>
          <div className="etb-ios-tabs">
            {TABS.map((t, i) => (
              <button key={t} className={`etb-ios-tab${mobileTab === i ? " etb-active" : ""}`}
                onClick={() => setMobileTab(i)}>{t}</button>
            ))}
          </div>
        </div>

        {mobileTab === 0 && (
          <div>
            <div className="etb-mrow" style={{ borderBottom: "1px solid #f5f5f5", paddingTop: 4, paddingBottom: 5 }}>
              <FontPickerBtn value={fontFamily} onChange={applyFont} isMobile={true} />
              <MobSep />
              <FontSizeControl value={fontSize} onChange={applyFontSize} isMobile={true} />
              <MobSep />
              <MobBtn icon="bold" Fallback={Bold} label="Negrito" onClick={onBold} />
              <MobBtn icon="italic" Fallback={Italic} label="Itálico" onClick={onItalic} />
              <MobBtn icon="underline" Fallback={Underline} label="Subl." onClick={onUnderline} />
              <MobBtn icon="strikethrough" Fallback={Strikethrough} label="Riscado" onClick={onStrikethrough} />
            </div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 5 }}>
              <MobBtn icon="align-left" Fallback={AlignLeft} label="Esq." onClick={onAlignLeft} />
              <MobBtn icon="align-center" Fallback={AlignCenter} label="Centro" onClick={onAlignCenter} />
              <MobBtn icon="align-right" Fallback={AlignRight} label="Dir." onClick={onAlignRight} />
              <MobBtn icon="align-justify" Fallback={AlignJustify} label="Just." onClick={onAlignJustify} />
              <MobSep />
              <ColorPickerDrop icon="color-palette" Fallback={Palette} onColor={c => exec("foreColor", c)} title="Cor do texto" />
              <ColorPickerDrop icon="highlighter" Fallback={Highlighter} onColor={c => exec("hiliteColor", c)} title="Realçar" />
              <MobSep />
              <MobBtn icon="superscript" Fallback={Superscript} label="Sup" onClick={onSuperscript} />
              <MobBtn icon="subscript" Fallback={Subscript} label="Sub" onClick={onSubscript} />
              <MobSep />
              <MobBtn icon="arrow-undo" Fallback={Undo2} label="Desfaz." onClick={onUndo} />
              <MobBtn icon="arrow-redo" Fallback={Redo2} label="Refaz." onClick={onRedo} />
            </div>
          </div>
        )}

        {mobileTab === 1 && (
          <div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4, borderBottom: "1px solid #f5f5f5" }}>
              <MobBtn icon="list-bullet" Fallback={List} label="Lista" onClick={onBulletList} />
              <MobBtn icon="list-number" Fallback={ListOrdered} label="Num." onClick={onNumberedList} />
              <MobBtn icon="link" Fallback={Link} label="Link" onClick={onLink} />
              <MobBtn icon="image" Fallback={Image} label="Imagem" onClick={onImage} />
              <MobBtn icon="table" Fallback={Table} label="Tabela" onClick={onTable} />
              <MobSep />
              <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
              <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
              <MobBtn Fallback={CheckSquare} label="Tarefa" onClick={() => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")} />
            </div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 5 }}>
              <MobBtn Fallback={AlertTriangle} label="Aviso" onClick={() => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️ Atenção:</strong> Escreve aqui.</div><p></p>")} />
              <MobBtn Fallback={Info} label="Info" onClick={() => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️ Info:</strong> Escreve aqui.</div><p></p>")} />
              <MobBtn Fallback={SeparatorHorizontal} label="Linha" onClick={() => exec("insertHorizontalRule")} />
              <MobSep />
              <MobBtn Fallback={Plus} label="Indent+" onClick={() => exec("indent")} />
              <MobBtn Fallback={Minus} label="Indent-" onClick={() => exec("outdent")} />
              <MobBtn Fallback={Calendar} label="Data" onClick={() => exec("insertText", new Date().toLocaleString("pt-PT"))} />
            </div>
          </div>
        )}

        {mobileTab === 2 && (
          <div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4, borderBottom: "1px solid #f5f5f5" }}>
              <MobBtn Fallback={Heading1} label="H1" onClick={onHeading1} labelOnly />
              <MobBtn Fallback={Heading2} label="H2" onClick={onHeading2} labelOnly />
              <MobBtn Fallback={Heading3} label="H3" onClick={onHeading3} labelOnly />
              <MobBtn Fallback={Heading4} label="H4" onClick={() => exec("formatBlock", "<h4>")} labelOnly />
              <MobSep />
              <MobBtn icon="text" Fallback={Pilcrow} label="Normal" onClick={() => exec("formatBlock", "<p>")} />
              <MobBtn icon="quote" Fallback={Quote} label="Citação" onClick={onQuote} />
              <MobBtn icon="code-slash" Fallback={Code} label="Código" onClick={onCode} />
            </div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 5 }}>
              <MobBtn Fallback={CaseUpper} label="MAIUSC." onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
              <MobBtn Fallback={CaseSensitive} label="minusc." onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
              <MobSep />
              <MobBtn Fallback={Trash2} label="Limpar" onClick={onClearFormatting} />
            </div>
          </div>
        )}

        {mobileTab === 3 && (
          <div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 4, borderBottom: "1px solid #f5f5f5" }}>
              <MobBtn icon="save" Fallback={Save} label="Guardar" onClick={onSave} />
              <MobBtn icon="download" Fallback={FileDown} label="PDF" onClick={onExportPDF} />
              <MobBtn icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
              <MobSep />
              <MobBtn icon="document-add" Fallback={FileText} label="Novo" onClick={onNewDocument} />
              <MobBtn icon="document-text" Fallback={BookOpen} label="Abrir" onClick={onOpenDocument} />
            </div>
            <div className="etb-mrow" style={{ paddingTop: 3, paddingBottom: 5 }}>
              <MobBtn icon="pencil" Fallback={PenLine} label="Revisão" onClick={() => { }} />
              <MobBtn icon="eye" Fallback={Eye} label="Ver" onClick={() => { }} />
              <MobBtn Fallback={Hash} label="Palavras" onClick={() => {
                const el = document.querySelector("[contenteditable]") as HTMLElement; if (!el) return;
                const t = el.innerText.trim();
                alert(`Palavras: ${t.split(/\s+/).filter(Boolean).length}\nCaracteres: ${t.length}`);
              }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═ DESKTOP ═══════════════════════════════════════════════ */
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", flexShrink: 0 }}>

      {/* Row 1 */}
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

        <FontPickerBtn value={fontFamily} onChange={applyFont} isMobile={false} />
        <FontSizeControl value={fontSize} onChange={applyFontSize} isMobile={false} />
        <Sep />
        <TB icon="save" Fallback={Save} label="Guardar" onClick={onSave} kbd="Ctrl+S" />
        <TB icon="download" Fallback={FileDown} label="Exportar PDF" onClick={onExportPDF} />
        <TB icon="share-social" Fallback={Share2} label="Partilhar" onClick={onShare} />
        <TB icon="eye" Fallback={Eye} label="Pré-visualizar" onClick={() => { }} />
      </div>

      {/* Row 2 */}
      <div className="etb-scroll" style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 10px 7px" }}>
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
        <TB icon="list" Fallback={CheckSquare} label="Lista de tarefas" onClick={() => exec("insertHTML", "<ul style='list-style:none;padding:0'><li style='display:flex;align-items:center;gap:8px'><input type='checkbox'> Tarefa nova</li></ul>")} />
        <TB icon="indent-increase" Fallback={Plus} label="Aumentar indentação" onClick={() => exec("indent")} />
        <TB icon="indent-decrease" Fallback={Minus} label="Diminuir indentação" onClick={() => exec("outdent")} />
        <Sep />
        <TB icon="link" Fallback={Link} label="Inserir link" onClick={onLink} />
        <TB icon="image" Fallback={Image} label="Inserir imagem" onClick={onImage} />
        <TB icon="table" Fallback={Table} label="Inserir tabela" onClick={onTable} />
        <TB icon="code-slash" Fallback={Code} label="Código inline" onClick={() => exec("insertHTML", "<code style='background:#f4f4f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.88em'>código</code>")} />
        <TB icon="remove" Fallback={SeparatorHorizontal} label="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />
        <Sep />

        <GridDrop label="Inserir" icon="apps" Fallback={Plus} title="Inserir elemento" columns={3} items={[
          { icon: "quote", Icon: Quote, label: "Citação", onClick: () => onQuote?.() },
          { icon: "code-slash", Icon: Code, label: "Código", onClick: () => onCode?.() },
          { Icon: Bookmark, label: "Nota rodapé", onClick: () => exec("insertHTML", "<sup style='color:#888;font-size:.7em'>[nota]</sup>") },
          { Icon: AlertTriangle, label: "Aviso", onClick: () => exec("insertHTML", "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>⚠️</strong> Escreve aqui.</div><p></p>") },
          { Icon: Info, label: "Info", onClick: () => exec("insertHTML", "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>ℹ️</strong> Escreve aqui.</div><p></p>") },
          { Icon: CheckCircle, label: "Sucesso", onClick: () => exec("insertHTML", "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>✅</strong> Escreve aqui.</div><p></p>") },
          { Icon: XCircle, label: "Erro", onClick: () => exec("insertHTML", "<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:8px 0;border-radius:6px;font-size:.9em'><strong>❌</strong> Escreve aqui.</div><p></p>") },
          { Icon: Calendar, label: "Data/hora", onClick: () => exec("insertText", new Date().toLocaleString("pt-PT")) },
          { Icon: WrapText, label: "Quebra pág.", onClick: () => exec("insertHTML", "<div style='page-break-after:always;border-bottom:2px dashed #e0e0e0;margin:24px 0;text-align:center;color:#ccc;font-size:.72em;padding-bottom:8px'>— Quebra de página —</div>") },
          { Icon: ClipboardList, label: "Nota", onClick: () => onAddNote?.() },
          { icon: "stats-chart", Icon: BarChart3, label: "Gráfico", onClick: () => { } },
          { icon: "pricetag", Icon: Tag, label: "Etiqueta", onClick: () => exec("insertHTML", "<span style='background:#f1f1f1;color:#333;padding:2px 8px;border-radius:99px;font-size:.78em;font-weight:600'>etiqueta</span>") },
        ]} />

        <Drop label="Formatar" icon="options" Fallback={Settings2} minWidth={260}>
          <DHeader t="Formatar texto" />
          <DI Fallback={CaseUpper} label="MAIÚSCULAS" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toUpperCase()); }} />
          <DI Fallback={CaseSensitive} label="minúsculas" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().toLowerCase()); }} />
          <DI Fallback={CaseSensitive} label="Primeira Maiúscula" onClick={() => { const s = window.getSelection(); if (s && !s.isCollapsed) exec("insertText", s.toString().replace(/\b\w/g, c => c.toUpperCase())); }} />
          <DSep />
          <DHeader t="Espaçamento" />
          <DI Fallback={AlignVerticalJustifyStart} label="Simples (1.0)" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1"; }} />
          <DI Fallback={AlignVerticalJustifyStart} label="1.5 linhas" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "1.5"; }} />
          <DI Fallback={AlignVerticalJustifyStart} label="Duplo (2.0)" onClick={() => { const el = document.querySelector("[contenteditable]") as HTMLElement; if (el) el.style.lineHeight = "2"; }} />
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
