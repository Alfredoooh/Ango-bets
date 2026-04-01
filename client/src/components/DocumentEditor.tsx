import { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  isMobile?: boolean;
  documentTitle?: string;
  onTitleChange?: (title: string) => void;
}

const PAGE_W         = 794;
const PAGE_H         = 1123;

function computeAdaptiveZoom(containerW: number): number {
  const raw = ((containerW - 32) / PAGE_W) * 100;
  return Math.max(25, Math.min(150, Math.round(raw)));
}

/* ─────────────────────────────────────────────────────────────────────
   Canvas-editor types
───────────────────────────────────────────────────────────────── */
type ObjType = "text" | "image";
interface CanvasObj {
  id: string;
  type: ObjType;
  x: number; y: number;
  w: number; h: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  fontFamily?: string;
}
interface PageData {
  bgUrl: string;
  objects: CanvasObj[];
}

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ─────────────────────────────────────────────────────────────────────
   PDF.js dynamic loader
───────────────────────────────────────────────────────────────── */
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve((window as any).pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise(res => {
    canvas.toBlob(b => res(b ? URL.createObjectURL(b) : ""), "image/jpeg", 0.92);
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Lucide SVG fallbacks
───────────────────────────────────────────────────────────────── */
const LUCIDE: Record<string, (sz: number) => JSX.Element> = {
  "file-text":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
  "file-plus":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>),
  "clock":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  "users":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  "archive":       sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>),
  "settings":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  "search":        sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  "more-vertical": sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>),
  "share":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>),
  "edit":          sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>),
  "trash":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  "x":             sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  "zoom-in":       sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  "zoom-out":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  "download":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  "star":          sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  "arrow-left":    sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>),
  "sidebar":       sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>),
  "moon":          sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  "sun":           sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  "monitor":       sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>),
  "check":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  "type":          sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>),
  "image":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
  "file-import":   sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="16" x2="12" y2="10"/></svg>),
  "globe":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  "chevron-right": sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  "chevron-down":  sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
};

function Icon({ src, fallback, size = 18, color = "currentColor", opacity = 1, style }: {
  src?: string; fallback: string; size?: number; color?: string; opacity?: number; style?: React.CSSProperties;
}) {
  const [useFallback, setUseFallback] = useState(!src);
  useEffect(() => { setUseFallback(!src); }, [src]);
  const wrapStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, color, opacity, width: size, height: size, ...style,
  };
  if (useFallback) {
    const fn = LUCIDE[fallback];
    return <span style={wrapStyle}>{fn ? fn(size) : null}</span>;
  }
  return (
    <img src={src} alt="" width={size} height={size}
      onError={() => setUseFallback(true)}
      style={{ flexShrink: 0, opacity, display: "block", ...style }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   RenameModal
───────────────────────────────────────────────────────────────── */
function RenameModal({ isDark, currentTitle, onConfirm, onCancel }: {
  isDark: boolean; currentTitle: string;
  onConfirm: (title: string) => void; onCancel: () => void;
}) {
  const [value, setValue] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.select(), 80); }, []);
  const bg      = isDark ? "#1e1e1e" : "#ffffff";
  const border  = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const textClr = isDark ? "#f0f0f0" : "#111";
  const subClr  = isDark ? "rgba(255,255,255,.40)" : "rgba(0,0,0,.45)";
  const inputBg = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)";
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,.45)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 9901, background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "24px 24px 20px", width: "min(340px,90vw)", boxShadow: "0 24px 80px rgba(0,0,0,.4)" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: textClr, marginBottom: 4 }}>Renomear documento</div>
        <div style={{ fontSize: ".8rem", color: subClr, marginBottom: 16 }}>Insira o novo nome do documento</div>
        <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && value.trim()) onConfirm(value.trim()); if (e.key === "Escape") onCancel(); }}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${border}`, background: inputBg, color: textClr, fontSize: ".9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          autoFocus />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${border}`, background: "none", cursor: "pointer", fontSize: ".85rem", color: subClr, fontWeight: 500, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => { if (value.trim()) onConfirm(value.trim()); }} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", fontSize: ".85rem", fontWeight: 600, fontFamily: "inherit", opacity: value.trim() ? 1 : 0.5 }}>Renomear</button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PdfProgressModal
───────────────────────────────────────────────────────────────── */
function PdfProgressModal({ isDark, label, pct }: { isDark: boolean; label: string; pct: number }) {
  const bg      = isDark ? "#1e1e1e" : "#ffffff";
  const border  = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const textClr = isDark ? "#f0f0f0" : "#111";
  const subClr  = isDark ? "rgba(255,255,255,.40)" : "rgba(0,0,0,.45)";
  const trackBg = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,.5)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 9901, background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "28px 28px 24px", width: "min(320px,88vw)", boxShadow: "0 24px 80px rgba(0,0,0,.4)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon src="/assets/icons/svg/pdf-import.svg" fallback="file-import" size={24} color="#fff" />
          </div>
        </div>
        <div style={{ fontSize: ".95rem", fontWeight: 700, color: textClr, textAlign: "center", marginBottom: 6 }}>A importar PDF</div>
        <div style={{ fontSize: ".8rem", color: subClr, textAlign: "center", marginBottom: 20, lineHeight: 1.4 }}>{label}</div>
        <div style={{ height: 6, background: trackBg, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#2563EB", borderRadius: 99, transition: "width .3s ease" }} />
        </div>
        <div style={{ textAlign: "right", marginTop: 6, fontSize: ".75rem", color: subClr }}>{Math.round(pct)}%</div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SettingsModal — preservado do original + language picker custom
───────────────────────────────────────────────────────────────── */
const LANGUAGES = [
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "pt-BR", label: "Português (Brasil)"   },
  { code: "en",    label: "English"               },
  { code: "es",    label: "Español"               },
  { code: "fr",    label: "Français"              },
];

function SettingsModal({ isDark, onClose, onThemeChange }: {
  isDark: boolean; onClose: () => void; onThemeChange: (t: "light" | "dark" | "system") => void;
}) {
  const { theme } = useTheme();
  const [language, setLanguage] = useState("pt-PT");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const bg      = isDark ? "#1c1c1c" : "#ffffff";
  const surface = isDark ? "#282828" : "#f2f2f7";
  const border  = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.09)";
  const textClr = isDark ? "#f0f0f0" : "#111";
  const subClr  = isDark ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.42)";
  const divider = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
  const selBorder = "#2563EB";

  const themes: { id: "light" | "dark" | "system"; label: string; icon: string }[] = [
    { id: "light",  label: "Claro",   icon: "sun"     },
    { id: "dark",   label: "Escuro",  icon: "moon"    },
    { id: "system", label: "Sistema", icon: "monitor" },
  ];

  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,.45)", animation: "fadeInSm .15s ease both" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 9801, background: bg, border: `1px solid ${border}`, borderRadius: 16, width: "min(400px,92vw)", boxShadow: isDark ? "0 24px 80px rgba(0,0,0,.7)" : "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden", animation: "modalIn .2s ease both" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: `1px solid ${divider}` }}>
          <span style={{ fontSize: ".95rem", fontWeight: 700, color: textClr }}>Definições</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon fallback="x" size={14} color={subClr} />
          </button>
        </div>

        <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Aparência */}
          <div>
            <div style={{ fontSize: ".68rem", fontWeight: 700, color: subClr, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Aparência</div>
            <div style={{ display: "flex", gap: 10 }}>
              {themes.map(t => {
                const isActive = theme === t.id;
                return (
                  <button key={t.id} onClick={() => onThemeChange(t.id)} style={{ flex: 1, padding: 0, border: `2px solid ${isActive ? selBorder : border}`, borderRadius: 12, background: isActive ? (isDark ? "rgba(37,99,235,.14)" : "rgba(37,99,235,.08)") : surface, cursor: "pointer", overflow: "hidden", transition: "border-color .12s" }}>
                    <div style={{ width: "100%", height: 52, background: t.id === "dark" ? "#1a1a1a" : t.id === "system" ? "linear-gradient(135deg,#f5f5f5 50%,#1a1a1a 50%)" : "#f5f5f5", display: "flex", flexDirection: "column", gap: 5, padding: "10px 8px" }}>
                      <div style={{ height: 5, borderRadius: 3, background: t.id === "dark" ? "#333" : "#d5d5d5", width: "75%" }} />
                      <div style={{ height: 4, borderRadius: 3, background: t.id === "dark" ? "#2a2a2a" : "#e0e0e0", width: "55%" }} />
                      <div style={{ height: 4, borderRadius: 3, background: t.id === "dark" ? "#2a2a2a" : "#e0e0e0", width: "65%" }} />
                    </div>
                    <div style={{ padding: "7px 4px 9px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <Icon fallback={t.icon} size={13} color={isActive ? selBorder : subClr} />
                      <span style={{ fontSize: ".7rem", fontWeight: isActive ? 700 : 500, color: isActive ? selBorder : subClr }}>{t.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: divider }} />

          {/* Idioma — picker custom, sem <select> nativo */}
          <div>
            <div style={{ fontSize: ".68rem", fontWeight: 700, color: subClr, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Idioma</div>

            {/* Trigger */}
            <button onClick={() => setShowLangPicker(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${showLangPicker ? selBorder : border}`, background: surface, cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s" }}>
              <Icon fallback="globe" size={15} color={subClr} />
              <span style={{ flex: 1, textAlign: "left", fontSize: ".88rem", fontWeight: 500, color: textClr }}>{selectedLang.label}</span>
              <span style={{ display: "inline-flex", transition: "transform .2s", transform: showLangPicker ? "rotate(180deg)" : "none" }}>
                <Icon fallback="chevron-down" size={14} color={subClr} />
              </span>
            </button>

            {/* Lista custom */}
            {showLangPicker && (
              <div style={{ marginTop: 6, borderRadius: 10, border: `1.5px solid ${border}`, background: bg, overflow: "hidden", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,.5)" : "0 8px 32px rgba(0,0,0,.12)", animation: "fadeInSm .12s ease both" }}>
                {LANGUAGES.map((lang, i) => {
                  const isSel = lang.code === language;
                  return (
                    <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", background: isSel ? (isDark ? "rgba(37,99,235,.12)" : "rgba(37,99,235,.06)") : "none", border: "none", borderTop: i > 0 ? `1px solid ${divider}` : "none", cursor: "pointer", fontFamily: "inherit", transition: "background .1s" }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)"; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "none"; }}>
                      <span style={{ flex: 1, textAlign: "left", fontSize: ".88rem", fontWeight: isSel ? 600 : 400, color: isSel ? selBorder : textClr }}>{lang.label}</span>
                      {isSel && <Icon fallback="check" size={14} color={selBorder} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInSm { from{opacity:0} to{opacity:1} }
        @keyframes modalIn  { from{opacity:0;transform:translate(-50%,-50%) scale(.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ZoomModal — mobile (preservado do original)
───────────────────────────────────────────────────────────────── */
function ZoomModal({ zoom, onZoomChange, onClose }: { zoom: number; onZoomChange: (z: number) => void; onClose: () => void }) {
  const startY = useRef<number | null>(null);
  const PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,.5)", animation: "zmFadeIn .16s ease both" }} />
      <div
        onTouchStart={e => { startY.current = e.touches[0].clientY; }}
        onTouchMove={e => { if (startY.current !== null && e.touches[0].clientY - startY.current > 60) onClose(); }}
        onTouchEnd={() => { startY.current = null; }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "#191919", borderRadius: "20px 20px 0 0", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", animation: "zmSlideUp .22s cubic-bezier(.25,.46,.45,.94) both", boxShadow: "0 -4px 48px rgba(0,0,0,.5)" }}>
        <style>{`@keyframes zmFadeIn{from{opacity:0}to{opacity:1}}@keyframes zmSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 99, margin: "12px auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 16px" }}>
          <button onClick={() => onZoomChange(Math.max(25, zoom - 10))} style={{ width: 46, height: 46, borderRadius: 13, border: "1.5px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon fallback="zoom-out" size={20} color="rgba(255,255,255,.9)" />
          </button>
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {PRESETS.map(p => (
              <button key={p} onClick={() => onZoomChange(p)} style={{ flexShrink: 0, height: 46, padding: "0 14px", borderRadius: 12, border: zoom === p ? "1.5px solid rgba(255,255,255,.75)" : "1.5px solid rgba(255,255,255,.09)", background: zoom === p ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.04)", color: zoom === p ? "#fff" : "rgba(255,255,255,.5)", fontSize: ".8rem", fontWeight: zoom === p ? 700 : 500, cursor: "pointer" }}>{p}%</button>
            ))}
          </div>
          <button onClick={() => onZoomChange(Math.min(200, zoom + 10))} style={{ width: 46, height: 46, borderRadius: 13, border: "1.5px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon fallback="zoom-in" size={20} color="rgba(255,255,255,.9)" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PopupMenu (preservado do original)
───────────────────────────────────────────────────────────────── */
function PopupMenu({ items, onClose, anchorRef, isDark }: {
  items: { label: string; src?: string; fallback?: string; onClick: () => void; danger?: boolean }[];
  onClose: () => void; anchorRef: React.RefObject<HTMLElement | null>; isDark: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const dismiss = useCallback(() => { setClosing(true); setTimeout(onClose, 150); }, [onClose]);
  useEffect(() => {
    const h = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) dismiss();
    };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [dismiss, anchorRef]);
  const bg      = isDark ? "#1e1e1e" : "#ffffff";
  const border  = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const hoverBg = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)";
  return (
    <>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(.88) translateY(-10px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes popOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(.9) translateY(-8px)}}.pm-item{transition:background .1s}.pm-item:hover{background:var(--pm-hover)!important}`}</style>
      <div onPointerDown={dismiss} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
      <div ref={menuRef} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 1000, background: bg, border: `1px solid ${border}`, borderRadius: 14, boxShadow: isDark ? "0 16px 56px rgba(0,0,0,.65)" : "0 16px 56px rgba(0,0,0,.13)", minWidth: 195, overflow: "hidden", transformOrigin: "top right", animation: closing ? "popOut .15s cubic-bezier(.4,0,.6,1) both" : "popIn .2s cubic-bezier(.34,1.56,.64,1) both" }}>
        {items.map((item, i) => (
          <button key={i} className="pm-item" onClick={() => { item.onClick(); dismiss(); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 15px", background: "none", border: "none", borderTop: i > 0 ? `1px solid ${border}` : "none", cursor: "pointer", textAlign: "left", color: item.danger ? "#e05555" : textClr, fontSize: ".875rem", fontWeight: 500, "--pm-hover": hoverBg } as React.CSSProperties}>
            {(item.src !== undefined || item.fallback) && <Icon src={item.src} fallback={item.fallback || "file-text"} size={15} color={item.danger ? "#e05555" : textClr} opacity={0.8} />}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DrawerMenu — restaurado do original + ícone sidebar + settings footer
───────────────────────────────────────────────────────────────── */
function DrawerMenu({ onClose, isDark, documentTitle, onOpenSettings }: {
  onClose: () => void; isDark: boolean; documentTitle: string; onOpenSettings: () => void;
}) {
  const [closing, setClosing]     = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const startX   = useRef<number | null>(null);

  const bg           = isDark ? "#101010" : "#f8f8f8";
  const textClr      = isDark ? "#e8e8e8" : "#111111";
  const subClr       = isDark ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.42)";
  const activeItemBg = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.065)";
  const hoverBg      = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.033)";
  const divider      = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

  const dismiss = useCallback(() => { setClosing(true); setTimeout(onClose, 260); }, [onClose]);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (startX.current === null || !panelRef.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < -10) panelRef.current.style.transform = `translateX(${Math.min(0, dx)}px)`;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (dx < -70) { dismiss(); }
    else if (panelRef.current) {
      panelRef.current.style.transition = "transform .22s cubic-bezier(.25,.46,.45,.94)";
      panelRef.current.style.transform  = "translateX(0)";
      setTimeout(() => { if (panelRef.current) panelRef.current.style.transition = ""; }, 250);
    }
  };

  const quickItems = [
    { label: "Nova tarefa",  fallback: "file-plus", src: "/assets/icons/svg/document-add.svg" },
    { label: "Procurar",     fallback: "search",    src: "" },
    { label: "Biblioteca",   fallback: "archive",   src: "" },
  ];
  const projectItems = [
    { label: "Documentos",  fallback: "file-text", src: "/assets/icons/svg/document-text.svg" },
    { label: "Recentes",    fallback: "clock",      src: "" },
    { label: "Favoritos",   fallback: "star",       src: "/assets/icons/svg/star.svg" },
    { label: "Partilhados", fallback: "users",      src: "/assets/icons/svg/people.svg", badge: "Novo" },
    { label: "Arquivo",     fallback: "archive",    src: "" },
  ];

  return (
    <>
      <style>{`
        @keyframes drawerScrimIn  { from{opacity:0} to{opacity:1} }
        @keyframes drawerScrimOut { from{opacity:1} to{opacity:0} }
        @keyframes drawerPanelIn  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes drawerPanelOut { from{transform:translateX(0)} to{transform:translateX(-100%)} }
        .dr-item { transition: background .1s; }
        .dr-item:hover  { background: var(--dr-hover) !important; }
        .dr-item:active { transform: scale(.98); }
      `}</style>
      <div onClick={dismiss} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,.44)", animation: closing ? "drawerScrimOut .26s ease both" : "drawerScrimIn .2s ease both" }} />
      <div ref={panelRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 286, zIndex: 8001, background: bg, borderRight: `1px solid ${divider}`, boxShadow: "6px 0 48px rgba(0,0,0,.26)", display: "flex", flexDirection: "column", willChange: "transform", animation: closing ? "drawerPanelOut .26s cubic-bezier(.4,0,.6,1) both" : "drawerPanelIn .28s cubic-bezier(.25,.46,.45,.94) both" }}>

        {/* Header — ícone app + botão sidebar para fechar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "54px 16px 14px", borderBottom: `1px solid ${divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/icons/app_icon.svg" alt="Doction" width={32} height={32} style={{ borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: ".95rem", fontWeight: 700, color: textClr, letterSpacing: "-.01em" }}>Doction</div>
              <div style={{ fontSize: ".7rem", color: subClr, marginTop: 1 }}>Editor de documentos</div>
            </div>
          </div>
          <button onClick={dismiss} style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: .7 }}>
            <Icon fallback="sidebar" size={20} color={textClr} />
          </button>
        </div>

        {/* Current doc */}
        <div style={{ margin: "10px 10px 0", padding: "9px 12px", borderRadius: 10, background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${divider}`, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon src="/assets/icons/svg/document.svg" fallback="file-text" size={14} color={textClr} opacity={0.7} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: ".63rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>Documento actual</div>
            <div style={{ fontSize: ".82rem", fontWeight: 600, color: textClr, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{documentTitle || "Sem título"}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 4px", marginTop: 8 }}>
          {quickItems.map((item, i) => (
            <button key={i} className="dr-item" onClick={() => setActiveIdx(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, background: activeIdx === i ? activeItemBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: activeIdx === i ? textClr : subClr, fontSize: ".875rem", fontWeight: activeIdx === i ? 600 : 500, "--dr-hover": hoverBg } as React.CSSProperties}>
              <Icon src={item.src} fallback={item.fallback} size={18} color={activeIdx === i ? textClr : subClr} opacity={activeIdx === i ? 1 : 0.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}

          <div style={{ height: 1, background: divider, margin: "6px 4px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 5px" }}>
            <span style={{ fontSize: ".67rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em" }}>Projetos</span>
            <button style={{ width: 22, height: 22, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: subClr, opacity: .7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          {projectItems.map((item, i) => {
            const idx = quickItems.length + i;
            const isActive = activeIdx === idx;
            return (
              <button key={idx} className="dr-item" onClick={() => setActiveIdx(idx)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, background: isActive ? activeItemBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: isActive ? textClr : subClr, fontSize: ".875rem", fontWeight: isActive ? 600 : 500, "--dr-hover": hoverBg } as React.CSSProperties}>
                <Icon src={item.src} fallback={item.fallback} size={18} color={isActive ? textClr : subClr} opacity={isActive ? 1 : 0.75} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {"badge" in item && item.badge && (
                  <span style={{ fontSize: ".65rem", fontWeight: 700, background: "#3B82F6", color: "#fff", borderRadius: 99, padding: "2px 7px" }}>{item.badge}</span>
                )}
              </button>
            );
          })}

          <div style={{ height: 1, background: divider, margin: "6px 4px" }} />
          <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 5px" }}>
            <span style={{ fontSize: ".67rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em" }}>Todas as tarefas</span>
          </div>
          <button className="dr-item" onClick={() => setActiveIdx(99)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 10, background: activeIdx === 99 ? activeItemBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: subClr, fontSize: ".875rem", "--dr-hover": hoverBg } as React.CSSProperties}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "#2a2a2a" : "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon fallback="file-text" size={14} color={subClr} />
            </div>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{documentTitle || "Sem título"}</span>
          </button>
        </div>

        {/* Footer — Definições em baixo */}
        <div style={{ borderTop: `1px solid ${divider}`, padding: "8px 8px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 14px)", display: "flex", flexDirection: "column", gap: 2 }}>
          <button className="dr-item" onClick={() => { dismiss(); setTimeout(onOpenSettings, 300); }}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left", color: subClr, fontSize: ".875rem", fontWeight: 500, "--dr-hover": hoverBg } as React.CSSProperties}>
            <Icon fallback="settings" size={18} color={subClr} opacity={0.85} />
            <span style={{ flex: 1 }}>Definições</span>
          </button>
          <div style={{ margin: "4px 0 2px", padding: "10px 12px", borderRadius: 12, background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.035)", border: `1px solid ${divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon src="/assets/icons/svg/share-social.svg" fallback="share" size={16} color={subClr} opacity={0.7} />
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: textClr }}>Partilhe o Doction</div>
                <div style={{ fontSize: ".68rem", color: subClr }}>Convide amigos para usar</div>
              </div>
            </div>
            <Icon fallback="chevron-right" size={14} color={subClr} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sidebar — desktop (preservado)
───────────────────────────────────────────────────────────────── */
function Sidebar({ isDark, documentTitle, onOpenSettings }: {
  isDark: boolean; documentTitle: string; onOpenSettings: () => void;
}) {
  const bg       = isDark ? "#161616" : "#f5f5f5";
  const border   = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)";
  const textClr  = isDark ? "#e8e8e8" : "#1a1a1a";
  const subClr   = isDark ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.42)";
  const hoverBg  = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
  const activeBg = isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.07)";
  const navItems = [
    { label: "Documentos",  src: "/assets/icons/svg/document-text.svg", fallback: "file-text", active: true,  action: () => {} },
    { label: "Recentes",    src: "",                                     fallback: "clock",     active: false, action: () => {} },
    { label: "Partilhados", src: "/assets/icons/svg/people.svg",         fallback: "users",     active: false, action: () => {} },
    { label: "Arquivo",     src: "",                                     fallback: "archive",   active: false, action: () => {} },
    { label: "Definições",  src: "",                                     fallback: "settings",  active: false, action: onOpenSettings },
  ];
  return (
    <div style={{ width: 240, flexShrink: 0, background: bg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 14px", borderBottom: `1px solid ${border}` }}>
        <img src="/assets/icons/app_icon.svg" alt="Doction" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
        <span style={{ fontSize: ".95rem", fontWeight: 700, color: textClr }}>Doction</span>
      </div>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontSize: ".68rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Aberto</div>
        <div style={{ fontSize: ".82rem", fontWeight: 500, color: textClr, wordBreak: "break-word", lineHeight: 1.4 }}>{documentTitle || "Sem título"}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {navItems.map((item, i) => (
          <button key={i} onClick={item.action}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, background: item.active ? activeBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: item.active ? textClr : subClr, fontSize: ".85rem", fontWeight: item.active ? 600 : 500, transition: "background .12s,color .12s" }}
            onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
            onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = "none"; }}>
            <Icon src={item.src} fallback={item.fallback} size={16} color={item.active ? textClr : subClr} opacity={item.active ? 0.9 : 0.75} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   AppBar (preservado)
───────────────────────────────────────────────────────────────── */
function AppBar({ isDark, isMobile, documentTitle, onMenuClick, onPopupToggle, popupOpen, popupAnchorRef, popupItems, onPopupClose }: {
  isDark: boolean; isMobile: boolean; documentTitle: string;
  onMenuClick: () => void; onPopupToggle: () => void; popupOpen: boolean;
  popupAnchorRef: React.RefObject<HTMLButtonElement | null>;
  popupItems: { label: string; src?: string; fallback?: string; onClick: () => void; danger?: boolean }[];
  onPopupClose: () => void;
}) {
  const bg          = isDark ? "rgba(14,14,14,0.97)" : "#ffffff";
  const titleClr    = isDark ? "#f0f0f0" : "#111111";
  const subLabelClr = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
  const btnHover    = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.07)";
  const iconClr     = isDark ? "rgba(255,255,255,.80)" : "rgba(0,0,0,.72)";
  const shadow      = isDark ? "0 1px 0 rgba(255,255,255,.06)" : "0 1px 0 rgba(0,0,0,.07),0 2px 10px rgba(0,0,0,.03)";
  return (
    <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 10px 0 12px", background: bg, boxShadow: shadow, position: "relative", zIndex: 100 }}>
      <button onClick={isMobile ? onMenuClick : undefined} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "none", cursor: isMobile ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
        <img src="/assets/icons/app_icon.svg" alt="Doction" width={28} height={28} style={{ borderRadius: 7, display: "block" }} />
      </button>
      {isMobile ? (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", maxWidth: "calc(100% - 120px)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", userSelect: "none" }}>
          <span style={{ fontSize: ".875rem", fontWeight: 700, color: titleClr, letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{documentTitle || "Sem título"}</span>
          <span style={{ fontSize: ".65rem", color: subLabelClr, marginTop: 1, fontWeight: 500 }}>Documento</span>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button ref={popupAnchorRef} onClick={onPopupToggle}
          style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: popupOpen ? btnHover : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .12s", padding: 0 }}
          onMouseEnter={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = btnHover; }}
          onMouseLeave={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = "none"; }}>
          <Icon src="/assets/icons/svg/options.svg" fallback="more-vertical" size={20} color={iconClr} />
        </button>
        {popupOpen && <PopupMenu items={popupItems} onClose={onPopupClose} anchorRef={popupAnchorRef as React.RefObject<HTMLElement | null>} isDark={isDark} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CanvasObject — objecto individual arrastável/redimensionável/editável
───────────────────────────────────────────────────────────────── */
function CanvasObject({ obj, isSelected, onSelect, onUpdate, onDelete, zoom }: {
  obj: CanvasObj; isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CanvasObj>) => void;
  onDelete: (id: string) => void;
  zoom: number;
}) {
  const [editing, setEditing] = useState(false);
  const textRef  = useRef<HTMLDivElement>(null);
  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resRef   = useRef<{ sx: number; sy: number; ow: number; oh: number; ox: number; oy: number; c: string } | null>(null);

  /* drag */
  const onMouseDownMove = (e: React.MouseEvent) => {
    if (editing) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(obj.id);
    const scale = zoom / 100;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: obj.x, oy: obj.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onUpdate(obj.id, { x: dragRef.current.ox + (ev.clientX - dragRef.current.sx) / scale, y: dragRef.current.oy + (ev.clientY - dragRef.current.sy) / scale });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* resize */
  const onMouseDownResize = (e: React.MouseEvent, c: string) => {
    e.preventDefault(); e.stopPropagation();
    const scale = zoom / 100;
    resRef.current = { sx: e.clientX, sy: e.clientY, ow: obj.w, oh: obj.h, ox: obj.x, oy: obj.y, c };
    const onMove = (ev: MouseEvent) => {
      if (!resRef.current) return;
      const { sx, sy, ow, oh, ox, oy, c: corner } = resRef.current;
      const dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale;
      let nw = ow, nh = oh, nx = ox, ny = oy;
      if (corner.includes("e")) nw = Math.max(60, ow + dx);
      if (corner.includes("s")) nh = Math.max(30, oh + dy);
      if (corner.includes("w")) { nw = Math.max(60, ow - dx); nx = ox + (ow - nw); }
      if (corner.includes("n")) { nh = Math.max(30, oh - dy); ny = oy + (oh - nh); }
      onUpdate(obj.id, { w: nw, h: nh, x: nx, y: ny });
    };
    const onUp = () => { resRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* double click → edit */
  const onDblClick = (e: React.MouseEvent) => {
    if (obj.type !== "text") return;
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      if (!textRef.current) return;
      textRef.current.focus();
      const r = document.createRange(); r.selectNodeContents(textRef.current); r.collapse(false);
      window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r);
    }, 20);
  };

  const stopEditing = () => {
    if (!editing) return;
    setEditing(false);
    if (textRef.current) onUpdate(obj.id, { content: textRef.current.innerText });
  };

  const SEL = "#3B82F6";
  const H   = 8;

  return (
    <div
      data-canvas-obj="1"
      style={{ position: "absolute", left: obj.x, top: obj.y, width: obj.w, height: obj.h, cursor: editing ? "text" : "move", userSelect: editing ? "text" : "none", outline: isSelected ? `2px solid ${SEL}` : "none", boxSizing: "border-box" }}
      onMouseDown={onMouseDownMove}
      onClick={e => { e.stopPropagation(); onSelect(obj.id); }}
      onDoubleClick={onDblClick}
    >
      {obj.type === "text" ? (
        <div
          ref={textRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={stopEditing}
          onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); stopEditing(); } }}
          style={{ width: "100%", height: "100%", fontSize: obj.fontSize ?? 14, fontWeight: obj.fontWeight ?? "normal", fontFamily: obj.fontFamily ?? "Georgia,'Times New Roman',serif", color: obj.color ?? "#1a1a1a", outline: "none", overflow: "hidden", wordBreak: "break-word", whiteSpace: "pre-wrap", padding: 4, boxSizing: "border-box", background: editing ? "rgba(59,130,246,.06)" : "transparent", lineHeight: 1.5 }}
        >{obj.content}</div>
      ) : (
        <img src={obj.content} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }} draggable={false} />
      )}

      {isSelected && !editing && (
        <>
          {/* Delete */}
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={e => { e.stopPropagation(); onDelete(obj.id); }}
            style={{ position: "absolute", top: -14, right: -14, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.3)", zIndex: 10 }}>
            <Icon fallback="x" size={10} color="#fff" />
          </button>
          {/* Resize handles */}
          {(["nw","ne","sw","se"] as const).map(c => (
            <div key={c} onMouseDown={e => onMouseDownResize(e, c)}
              style={{ position: "absolute", width: H, height: H, background: "#fff", border: `2px solid ${SEL}`, borderRadius: 2, boxSizing: "border-box", cursor: `${c}-resize`, zIndex: 9, top: c.startsWith("n") ? -H/2 : undefined, bottom: c.startsWith("s") ? -H/2 : undefined, left: c.endsWith("w") ? -H/2 : undefined, right: c.endsWith("e") ? -H/2 : undefined }} />
          ))}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CanvasPage — fundo PDF + objectos editáveis
───────────────────────────────────────────────────────────────── */
function CanvasPage({ page, pageIdx, selectedId, onSelectObj, onUpdateObj, onDeleteObj, onAddTextAt, zoom }: {
  page: PageData; pageIdx: number; selectedId: string | null;
  onSelectObj: (id: string | null) => void;
  onUpdateObj: (pi: number, id: string, patch: Partial<CanvasObj>) => void;
  onDeleteObj: (pi: number, id: string) => void;
  onAddTextAt: (pi: number, x: number, y: number) => void;
  zoom: number;
}) {
  const handleDblClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.dataset.canvasObj) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const scale = zoom / 100;
    onAddTextAt(pageIdx, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
  };

  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", overflow: "hidden" }}
      onClick={e => { if (!(e.target as HTMLElement).dataset.canvasObj) onSelectObj(null); }}
      onDoubleClick={handleDblClick}>
      {page.bgUrl && (
        <img src={page.bgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none", userSelect: "none" }} draggable={false} />
      )}
      {page.objects.map(obj => (
        <CanvasObject key={obj.id} obj={obj} isSelected={selectedId === obj.id}
          onSelect={id => onSelectObj(id)}
          onUpdate={(id, patch) => onUpdateObj(pageIdx, id, patch)}
          onDelete={id => onDeleteObj(pageIdx, id)}
          zoom={zoom} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Export
───────────────────────────────────────────────────────────────── */
function exportToPDF(pages: PageData[], documentTitle: string) {
  const pagesHTML = pages.map(pg => {
    const objs = pg.objects.map(o =>
      o.type === "text"
        ? `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;font-size:${o.fontSize ?? 14}px;font-weight:${o.fontWeight ?? "normal"};font-family:${o.fontFamily ?? "Georgia,serif"};color:${o.color ?? "#1a1a1a"};word-break:break-word;white-space:pre-wrap;padding:4px;box-sizing:border-box;">${o.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\n/g,"<br>")}</div>`
        : `<img src="${o.content}" style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;object-fit:contain;" />`
    ).join("");
    const bg = pg.bgUrl ? `background-image:url('${pg.bgUrl}');background-size:100% 100%;` : "background:#fff;";
    return `<div style="width:794px;height:1123px;position:relative;flex-shrink:0;${bg}">${objs}</div>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/><title>${documentTitle}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#e8e8e8;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px}@media print{body{background:none;padding:0;gap:0}}</style></head><body>${pagesHTML}<script>window.onload=()=>window.print();<\/script></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = `${documentTitle || "documento"}.html`; a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function DocumentEditor({
  content, onChange, placeholder = "Duplo clique para adicionar texto…",
  zoom, onZoomChange, isMobile = false,
  documentTitle = "Documento sem título", onTitleChange,
}: DocumentEditorProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const containerRef   = useRef<HTMLDivElement>(null);
  const pinchRef       = useRef<{ dist: number; startZoom: number } | null>(null);
  const pdfInputRef    = useRef<HTMLInputElement>(null);
  const popupAnchorRef = useRef<HTMLButtonElement>(null);

  const [pages,         setPages]         = useState<PageData[]>([{ bgUrl: "", objects: [] }]);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDrawer,    setShowDrawer]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showRename,    setShowRename]    = useState(false);
  const [popupOpen,     setPopupOpen]     = useState(false);
  const [pdfImporting,  setPdfImporting]  = useState(false);
  const [pdfLabel,      setPdfLabel]      = useState("");
  const [pdfPct,        setPdfPct]        = useState(0);

  const canvasBg   = isDark ? "#1c1c1c" : "#e8e8e8";
  const statusBg   = isDark ? "rgba(14,14,14,0.97)"   : "rgba(245,245,245,0.97)";
  const statusBdr  = isDark ? "rgba(255,255,255,.07)"  : "rgba(0,0,0,.09)";
  const statusClr  = isDark ? "rgba(255,255,255,.55)"  : "rgba(0,0,0,.55)";
  const statusSep  = isDark ? "rgba(255,255,255,.18)"  : "rgba(0,0,0,.18)";
  const pageShadow = isDark ? "0 2px 12px rgba(0,0,0,.5),0 8px 40px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.12),0 8px 32px rgba(0,0,0,.08)";
  const pageNumClr = isDark ? "#666" : "#aaa";

  const updateObj = useCallback((pi: number, id: string, patch: Partial<CanvasObj>) => {
    setPages(prev => prev.map((pg, i) => i !== pi ? pg : { ...pg, objects: pg.objects.map(o => o.id === id ? { ...o, ...patch } : o) }));
  }, []);

  const deleteObj = useCallback((pi: number, id: string) => {
    setPages(prev => prev.map((pg, i) => i !== pi ? pg : { ...pg, objects: pg.objects.filter(o => o.id !== id) }));
    setSelectedId(null);
  }, []);

  const addTextAt = useCallback((pi: number, x: number, y: number) => {
    const obj: CanvasObj = { id: uid(), type: "text", x: Math.max(0, x - 60), y: Math.max(0, y - 12), w: 200, h: 40, content: "", fontSize: 14, fontWeight: "normal", color: "#1a1a1a", fontFamily: "Georgia,'Times New Roman',serif" };
    setPages(prev => prev.map((pg, i) => i !== pi ? pg : { ...pg, objects: [...pg.objects, obj] }));
    setSelectedId(obj.id);
  }, []);

  /* Delete key */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const ae = document.activeElement as HTMLElement;
        if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.contentEditable === "true")) return;
        setPages(prev => prev.map((pg, i) => i !== activePageIdx ? pg : { ...pg, objects: pg.objects.filter(o => o.id !== selectedId) }));
        setSelectedId(null);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [selectedId, activePageIdx]);

  /* PDF import */
  const handlePdfImport = useCallback(async (file: File) => {
    setPdfImporting(true); setPdfPct(0); setPdfLabel("A carregar PDF…");
    try {
      const pdfjs = await loadPdfJs();
      const buf   = await file.arrayBuffer();
      const doc   = await pdfjs.getDocument({ data: buf }).promise;
      const total = doc.numPages;
      const newPages: PageData[] = [];
      for (let i = 1; i <= total; i++) {
        setPdfPct(((i - 1) / total) * 100);
        setPdfLabel(`Página ${i} de ${total}…`);
        const pg       = await doc.getPage(i);
        const scale    = PAGE_W / pg.getViewport({ scale: 1 }).width;
        const viewport = pg.getViewport({ scale });
        const canvas   = document.createElement("canvas");
        canvas.width   = Math.round(viewport.width);
        canvas.height  = Math.round(viewport.height);
        await pg.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        const bgUrl = await canvasToBlob(canvas);
        newPages.push({ bgUrl, objects: [] });
        setPdfPct((i / total) * 100);
      }
      setPages(newPages); setSelectedId(null); setActivePageIdx(0);
    } catch (err) { console.error("PDF import error:", err); }
    finally { setPdfImporting(false); setPdfLabel(""); setPdfPct(0); if (pdfInputRef.current) pdfInputRef.current.value = ""; }
  }, []);

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: documentTitle, text: "Partilhado via Doction" }).catch(() => {});
    else navigator.clipboard.writeText(window.location.href).catch(() => {});
  };
  const handleExport        = () => exportToPDF(pages, documentTitle);
  const handleRenameConfirm = (t: string) => { setShowRename(false); onTitleChange?.(t); };

  const popupItems = [
    { label: "Partilhar",    src: "/assets/icons/svg/share-social.svg", fallback: "share",       onClick: handleShare },
    { label: "Importar PDF", src: "/assets/icons/svg/pdf-import.svg",   fallback: "file-import", onClick: () => pdfInputRef.current?.click() },
    { label: "Exportar PDF", src: "/assets/icons/svg/download.svg",     fallback: "download",    onClick: handleExport },
    { label: "Renomear",     src: "/assets/icons/svg/pencil.svg",       fallback: "edit",        onClick: () => setTimeout(() => setShowRename(true), 160) },
    { label: "Definições",   src: "",                                   fallback: "settings",    onClick: () => setShowSettings(true) },
    { label: "Apagar",       src: "",                                   fallback: "trash",       onClick: () => {}, danger: true },
  ];

  /* adaptive zoom */
  useEffect(() => {
    const calc = () => { if (!containerRef.current) return; onZoomChange(isMobile ? computeAdaptiveZoom(containerRef.current.clientWidth) : 100); };
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  /* pinch zoom */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; pinchRef.current = { dist: Math.hypot(dx, dy), startZoom: zoom }; }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; onZoomChange(Math.max(25, Math.min(200, Math.round(pinchRef.current.startZoom * (Math.hypot(dx, dy) / pinchRef.current.dist))))); }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const h = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); onZoomChange(Math.max(25, Math.min(200, zoom + (e.deltaY < 0 ? 10 : -10)))); } };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [zoom, onZoomChange]);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", overflow: "hidden" }}>
      <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfImport(f); }} />

      {!isMobile && <Sidebar isDark={isDark} documentTitle={documentTitle} onOpenSettings={() => setShowSettings(true)} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <AppBar isDark={isDark} isMobile={isMobile} documentTitle={documentTitle}
          onMenuClick={() => setShowDrawer(true)}
          onPopupToggle={() => setPopupOpen(v => !v)}
          popupOpen={popupOpen} popupAnchorRef={popupAnchorRef}
          popupItems={popupItems} onPopupClose={() => setPopupOpen(false)} />

        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ background: canvasBg, touchAction: "pan-y pinch-zoom" }}>

          {showZoomModal && isMobile && <ZoomModal zoom={zoom} onZoomChange={onZoomChange} onClose={() => setShowZoomModal(false)} />}
          {showDrawer    && isMobile && <DrawerMenu onClose={() => setShowDrawer(false)} isDark={isDark} documentTitle={documentTitle} onOpenSettings={() => setShowSettings(true)} />}
          {showRename    && <RenameModal isDark={isDark} currentTitle={documentTitle} onConfirm={handleRenameConfirm} onCancel={() => setShowRename(false)} />}
          {showSettings  && <SettingsModal isDark={isDark} onClose={() => setShowSettings(false)} onThemeChange={t => setTheme(t)} />}
          {pdfImporting  && <PdfProgressModal isDark={isDark} label={pdfLabel} pct={pdfPct} />}

          {/* Hint bar */}
          <div style={{ flexShrink: 0, padding: "4px 14px", background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.025)", borderBottom: `1px solid ${statusBdr}`, fontSize: 11, color: statusClr, display: "flex", gap: 12, alignItems: "center" }}>
            <span>Duplo clique na página → adicionar texto</span>
            <span style={{ opacity: .5 }}>·</span>
            <span>Arrastar → mover</span>
            <span style={{ opacity: .5 }}>·</span>
            <span>Cantos → redimensionar</span>
            <span style={{ opacity: .5 }}>·</span>
            <span>Delete → apagar</span>
          </div>

          {/* Canvas scroll area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: `${(zoom / 100 - 1) * pages.length * (PAGE_H + 24) * 0.5}px` }}>
              {pages.map((page, idx) => (
                <div key={idx} style={{ position: "relative" }} onClick={() => setActivePageIdx(idx)}>
                  {pages.length > 1 && (
                    <div style={{ position: "absolute", top: -20, left: 0, right: 0, textAlign: "center", fontSize: 11, color: pageNumClr, userSelect: "none" }}>Página {idx + 1}</div>
                  )}
                  <div style={{ background: "#ffffff", boxShadow: pageShadow, position: "relative", overflow: "hidden", flexShrink: 0 }}>
                    <CanvasPage
                      page={page} pageIdx={idx}
                      selectedId={activePageIdx === idx ? selectedId : null}
                      onSelectObj={id => { setActivePageIdx(idx); setSelectedId(id); }}
                      onUpdateObj={updateObj} onDeleteObj={deleteObj} onAddTextAt={addTextAt}
                      zoom={zoom} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div style={{ height: 28, background: statusBg, borderTop: `1.5px solid ${statusBdr}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: statusClr, fontWeight: 500 }}>{pdfImporting ? "A importar PDF…" : "Pronto"}</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <span style={{ fontSize: 11, color: statusClr }}>Pág. {activePageIdx + 1} / {pages.length}</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <button onClick={() => isMobile && setShowZoomModal(true)}
              style={{ fontSize: 11, color: statusClr, background: "none", border: "none", cursor: isMobile ? "pointer" : "default", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              {isMobile && <Icon fallback="zoom-in" size={10} color={statusClr} opacity={0.65} />}
              {Math.round(zoom)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
