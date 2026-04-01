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

const PAGE_W          = 794;
const PAGE_H          = 1123;
const PAGE_MARGIN_PX  = 96;
const CONTENT_W       = PAGE_W - PAGE_MARGIN_PX * 2;
const CONTENT_H       = PAGE_H - PAGE_MARGIN_PX * 2;

function computeAdaptiveZoom(containerW: number): number {
  const raw = ((containerW - 32) / PAGE_W) * 100;
  return Math.max(25, Math.min(150, Math.round(raw)));
}

/* ─────────────────────────────────────────────────────────────────────
   Lucide SVG fallbacks
───────────────────────────────────────────────────────────────── */
const LUCIDE: Record<string, (sz: number) => JSX.Element> = {
  "file-text": sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
  "file-plus": sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>),
  "clock":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  "users":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  "archive":   sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>),
  "settings":  sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  "search":    sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  "more-vertical": sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>),
  "share":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>),
  "edit":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>),
  "trash":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  "x":         sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  "zoom-in":   sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  "zoom-out":  sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  "download":  sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  "star":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  "arrow-left":sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>),
  "sidebar":   sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>),
  "moon":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  "sun":       sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  "monitor":   sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>),
  "check":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  "type":      sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>),
  "image":     sz => (<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
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
  return <img src={src} alt="" width={size} height={size} onError={() => setUseFallback(true)}
    style={{ flexShrink: 0, opacity, display: "block", ...style }} />;
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

  const bg     = isDark ? "#1e1e1e" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const textClr = isDark ? "#f0f0f0" : "#111";
  const subClr  = isDark ? "rgba(255,255,255,.40)" : "rgba(0,0,0,.45)";
  const inputBg = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)";

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,.45)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", zIndex: 9901,
        background: bg, border: `1px solid ${border}`,
        borderRadius: 16, padding: "24px 24px 20px",
        width: "min(340px,90vw)",
        boxShadow: "0 24px 80px rgba(0,0,0,.4)",
      }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: textClr, marginBottom: 4 }}>Renomear documento</div>
        <div style={{ fontSize: ".8rem", color: subClr, marginBottom: 16 }}>Insira o novo nome do documento</div>
        <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && value.trim()) onConfirm(value.trim()); if (e.key === "Escape") onCancel(); }}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${border}`, background: inputBg, color: textClr, fontSize: ".9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          autoFocus />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${border}`, background: "none", cursor: "pointer", fontSize: ".85rem", color: subClr, fontWeight: 500, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => { if (value.trim()) onConfirm(value.trim()); }}
            style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", fontSize: ".85rem", fontWeight: 600, fontFamily: "inherit", opacity: value.trim() ? 1 : 0.5 }}>
            Renomear
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SettingsModal — modal inline, sem substituir a página
───────────────────────────────────────────────────────────────── */
function SettingsModal({ isDark, onClose, onThemeChange }: {
  isDark: boolean; onClose: () => void; onThemeChange: (t: "light" | "dark" | "system") => void;
}) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"conta" | "definicoes" | "utilizacao">("definicoes");

  const bg        = isDark ? "#181818" : "#ffffff";
  const surface   = isDark ? "#222" : "#f7f7f7";
  const border    = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const textClr   = isDark ? "#f0f0f0" : "#111";
  const subClr    = isDark ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)";
  const divider   = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
  const selBorder = "#3B82F6";

  const themes: { id: "light" | "dark" | "system"; label: string; icon: string }[] = [
    { id: "light",  label: "Claro",          icon: "sun"     },
    { id: "dark",   label: "Escuro",          icon: "moon"    },
    { id: "system", label: "Seguir Sistema",  icon: "monitor" },
  ];

  const tabs: { id: "conta" | "definicoes" | "utilizacao"; label: string }[] = [
    { id: "conta",      label: "Conta"       },
    { id: "definicoes", label: "Definições"  },
    { id: "utilizacao", label: "Utilização"  },
  ];

  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,.5)", animation: "fadeInSm .15s ease both" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 9801,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "48px 16px 24px", overflowY: "auto",
        pointerEvents: "none",
      }}>
        <div style={{
          width: "min(560px,100%)", background: bg,
          borderRadius: 20, overflow: "hidden",
          boxShadow: isDark ? "0 32px 100px rgba(0,0,0,.8)" : "0 32px 100px rgba(0,0,0,.22)",
          pointerEvents: "all",
          animation: "modalIn .2s ease both",
        }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 22px 16px", borderBottom: `1px solid ${divider}` }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 700, color: textClr }}>Configurações</span>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon fallback="x" size={16} color={subClr} />
            </button>
          </div>

          {/* Workspace header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: `1px solid ${divider}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>D</span>
            </div>
            <div>
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: textClr }}>Doction</div>
              <div style={{ fontSize: ".75rem", color: subClr }}>Pessoal</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${divider}`, padding: "0 22px" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "12px 14px", border: "none", background: "none", cursor: "pointer",
                fontSize: ".84rem", fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? textClr : subClr,
                borderBottom: activeTab === t.id ? `2px solid ${textClr}` : "2px solid transparent",
                marginBottom: -1, transition: "color .12s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "22px 22px 28px" }}>

            {activeTab === "definicoes" && (
              <>
                {/* Geral */}
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Geral</div>

                {/* Idioma */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: ".88rem", fontWeight: 600, color: textClr, marginBottom: 10 }}>Idioma</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${border}`, background: surface, cursor: "pointer" }}>
                    <span style={{ fontSize: ".88rem", color: textClr }}>Português (Portugal)</span>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={subClr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Aparência */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: ".88rem", fontWeight: 600, color: textClr, marginBottom: 12 }}>Aparência</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {themes.map(t => {
                      const isActive = theme === t.id;
                      return (
                        <button key={t.id} onClick={() => onThemeChange(t.id)} style={{
                          flex: 1, padding: "0 0 10px", border: `2px solid ${isActive ? selBorder : border}`,
                          borderRadius: 12, background: isActive ? (isDark ? "rgba(59,130,246,.12)" : "rgba(59,130,246,.07)") : surface,
                          cursor: "pointer", transition: "all .14s",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 0, overflow: "hidden",
                        }}>
                          {/* Preview card */}
                          <div style={{
                            width: "100%", height: 64, marginBottom: 8,
                            background: t.id === "dark" ? "#1a1a1a" : t.id === "system" ? "linear-gradient(135deg, #fff 50%, #1a1a1a 50%)" : "#f5f5f5",
                            display: "flex", flexDirection: "column", gap: 5, padding: "10px 8px",
                          }}>
                            <div style={{ height: 6, borderRadius: 3, background: t.id === "dark" ? "#333" : "#ddd", width: "80%" }} />
                            <div style={{ height: 5, borderRadius: 3, background: t.id === "dark" ? "#2a2a2a" : "#e5e5e5", width: "60%" }} />
                            <div style={{ height: 5, borderRadius: 3, background: t.id === "dark" ? "#2a2a2a" : "#e5e5e5", width: "70%" }} />
                          </div>
                          <span style={{ fontSize: ".73rem", fontWeight: isActive ? 700 : 500, color: isActive ? selBorder : subClr }}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferências de comunicação */}
                <div>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Preferências</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${divider}` }}>
                    <div>
                      <div style={{ fontSize: ".88rem", fontWeight: 500, color: textClr }}>Receber actualizações de produto</div>
                      <div style={{ fontSize: ".76rem", color: subClr, marginTop: 2 }}>Receba acesso antecipado a novidades</div>
                    </div>
                    <ToggleSwitch isDark={isDark} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${divider}` }}>
                    <div>
                      <div style={{ fontSize: ".88rem", fontWeight: 500, color: textClr }}>Gravação automática</div>
                      <div style={{ fontSize: ".76rem", color: subClr, marginTop: 2 }}>Guardar documentos automaticamente</div>
                    </div>
                    <ToggleSwitch isDark={isDark} defaultOn />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${divider}` }}>
                    <div>
                      <div style={{ fontSize: ".88rem", fontWeight: 500, color: textClr }}>Mostrar número de páginas</div>
                    </div>
                    <ToggleSwitch isDark={isDark} defaultOn />
                  </div>
                </div>
              </>
            )}

            {activeTab === "conta" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>D</span>
                </div>
                <div style={{ fontSize: ".94rem", fontWeight: 700, color: textClr }}>Utilizador Doction</div>
                <div style={{ fontSize: ".8rem", color: subClr, marginTop: 4 }}>utilizador@doction.app</div>
                <button style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, border: `1.5px solid ${border}`, background: "none", cursor: "pointer", fontSize: ".85rem", fontWeight: 600, color: "#e05555" }}>
                  Terminar sessão
                </button>
              </div>
            )}

            {activeTab === "utilizacao" && (
              <div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Armazenamento</div>
                <div style={{ padding: "16px", borderRadius: 12, border: `1px solid ${border}`, background: surface }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: ".86rem", color: textClr, fontWeight: 500 }}>Documentos</span>
                    <span style={{ fontSize: ".86rem", color: subClr }}>0.2 MB / 100 MB</span>
                  </div>
                  <div style={{ height: 6, background: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "0.2%", background: "#3B82F6", borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInSm { from{opacity:0} to{opacity:1} }
        @keyframes modalIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

/* Toggle Switch */
function ToggleSwitch({ isDark, defaultOn = false }: { isDark: boolean; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(v => !v)} style={{
      width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
      background: on ? "#3B82F6" : (isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.12)"),
      position: "relative", transition: "background .18s", flexShrink: 0, padding: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 99, background: "#fff",
        position: "absolute", top: 3, left: on ? 21 : 3,
        transition: "left .18s", boxShadow: "0 1px 4px rgba(0,0,0,.22)",
      }} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ZoomModal — mobile only
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
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(255,255,255,.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "6px 24px 18px" }}>
          <Icon fallback="zoom-in" size={17} color="rgba(255,255,255,.85)" />
          <span style={{ fontSize: ".87rem", fontWeight: 700, color: "#e8e8e8" }}>Zoom · {Math.round(zoom)}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 4px" }}>
          <button onClick={() => onZoomChange(Math.max(25, zoom - 10))} style={{ width: 46, height: 46, borderRadius: 13, border: "1.5px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon fallback="zoom-out" size={20} color="rgba(255,255,255,.9)" />
          </button>
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
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
   PopupMenu
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

  const bg = isDark ? "#1e1e1e" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
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
   DrawerMenu — estilo Manus
───────────────────────────────────────────────────────────────── */
function DrawerMenu({ onClose, isDark, documentTitle, onOpenSettings }: {
  onClose: () => void; isDark: boolean; documentTitle: string; onOpenSettings: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const startX   = useRef<number | null>(null);

  const bg         = isDark ? "#101010" : "#f8f8f8";
  const textClr    = isDark ? "#e8e8e8" : "#111111";
  const subClr     = isDark ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.42)";
  const activeItemBg = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.065)";
  const hoverBg    = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.033)";
  const divider    = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 260);
  }, [onClose]);

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
    if (dx < -70) {
      dismiss();
    } else if (panelRef.current) {
      panelRef.current.style.transition = "transform .22s cubic-bezier(.25,.46,.45,.94)";
      panelRef.current.style.transform  = "translateX(0)";
      setTimeout(() => { if (panelRef.current) panelRef.current.style.transition = ""; }, 250);
    }
  };

  /* Items — estilo Manus */
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

      {/* Scrim */}
      <div onClick={dismiss} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,.44)", animation: closing ? "drawerScrimOut .26s ease both" : "drawerScrimIn .2s ease both" }} />

      {/* Painel */}
      <div ref={panelRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 286, zIndex: 8001, background: bg, borderRight: `1px solid ${divider}`, boxShadow: "6px 0 48px rgba(0,0,0,.26)", display: "flex", flexDirection: "column", willChange: "transform", animation: closing ? "drawerPanelOut .26s cubic-bezier(.4,0,.6,1) both" : "drawerPanelIn .28s cubic-bezier(.25,.46,.45,.94) both" }}>

        {/* Header — ícone app + nome + botão ≡ toggle (estilo Manus) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "54px 16px 14px", borderBottom: `1px solid ${divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/icons/app_icon.svg" alt="Doction" width={32} height={32} style={{ borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: ".95rem", fontWeight: 700, color: textClr, letterSpacing: "-.01em" }}>Doction</div>
              <div style={{ fontSize: ".7rem", color: subClr, marginTop: 1 }}>Editor de documentos</div>
            </div>
          </div>
          {/* ícone de toggle do painel — igual ao do Manus (dois rectângulos) */}
          <button onClick={dismiss}
            style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: .7 }}>
            <Icon fallback="sidebar" size={20} color={textClr} />
          </button>
        </div>

        {/* Documento actual */}
        <div style={{ margin: "10px 10px 0", padding: "9px 12px", borderRadius: 10, background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${divider}`, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon src="/assets/icons/svg/document.svg" fallback="file-text" size={14} color={textClr} opacity={0.7} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: ".63rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>Documento actual</div>
            <div style={{ fontSize: ".82rem", fontWeight: 600, color: textClr, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{documentTitle || "Sem título"}</div>
          </div>
        </div>

        {/* Navegação */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 4px", marginTop: 8 }}>

          {/* Acções rápidas */}
          {quickItems.map((item, i) => (
            <button key={i} className="dr-item" onClick={() => setActiveIdx(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, background: activeIdx === i ? activeItemBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: activeIdx === i ? textClr : subClr, fontSize: ".875rem", fontWeight: activeIdx === i ? 600 : 500, "--dr-hover": hoverBg } as React.CSSProperties}>
              <Icon src={item.src} fallback={item.fallback} size={18} color={activeIdx === i ? textClr : subClr} opacity={activeIdx === i ? 1 : 0.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}

          <div style={{ height: 1, background: divider, margin: "6px 4px" }} />

          {/* Projetos */}
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
                {item.badge && (
                  <span style={{ fontSize: ".65rem", fontWeight: 700, background: "#3B82F6", color: "#fff", borderRadius: 99, padding: "2px 7px" }}>{item.badge}</span>
                )}
              </button>
            );
          })}

          <div style={{ height: 1, background: divider, margin: "6px 4px" }} />

          {/* Todas as tarefas */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 5px" }}>
            <span style={{ fontSize: ".67rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em" }}>Todas as tarefas</span>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: subClr, opacity: .6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><polyline points="4 18 10 18"/></svg>
            </button>
          </div>
          <button className="dr-item" onClick={() => setActiveIdx(99)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 10, background: activeIdx === 99 ? activeItemBg : "none", border: "none", cursor: "pointer", textAlign: "left", color: subClr, fontSize: ".875rem", "--dr-hover": hoverBg } as React.CSSProperties}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "#2a2a2a" : "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon fallback="file-text" size={14} color={subClr} />
            </div>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{documentTitle || "Sem título"}</span>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: subClr, opacity: .5, padding: "2px 4px" }} onMouseDown={e => e.stopPropagation()}>
              <Icon fallback="more-vertical" size={14} color={subClr} />
            </button>
          </button>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${divider}`, padding: "8px 8px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 14px)", display: "flex", flexDirection: "column", gap: 2 }}>
          <button className="dr-item" onClick={() => { dismiss(); setTimeout(onOpenSettings, 300); }}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left", color: subClr, fontSize: ".875rem", fontWeight: 500, "--dr-hover": hoverBg } as React.CSSProperties}>
            <Icon fallback="settings" size={18} color={subClr} opacity={0.85} />
            <span style={{ flex: 1 }}>Definições</span>
          </button>
          {/* Partilhar Doction — card estilo Manus */}
          <div style={{ margin: "4px 0 2px", padding: "10px 12px", borderRadius: 12, background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.035)", border: `1px solid ${divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon src="/assets/icons/svg/share-social.svg" fallback="share" size={16} color={subClr} opacity={0.7} />
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: textClr }}>Partilhe o Doction</div>
                <div style={{ fontSize: ".68rem", color: subClr }}>Convide amigos para usar</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={subClr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sidebar — desktop
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
   AppBar
───────────────────────────────────────────────────────────────── */
function AppBar({ isDark, isMobile, documentTitle, onMenuClick, onPopupToggle, popupOpen, popupAnchorRef, popupItems, onPopupClose }: {
  isDark: boolean; isMobile: boolean; documentTitle: string;
  onMenuClick: () => void; onPopupToggle: () => void; popupOpen: boolean;
  popupAnchorRef: React.RefObject<HTMLButtonElement | null>;
  popupItems: { label: string; src?: string; fallback?: string; onClick: () => void; danger?: boolean }[];
  onPopupClose: () => void;
}) {
  const bg       = isDark ? "rgba(14,14,14,0.97)" : "#ffffff";
  const titleClr = isDark ? "#f0f0f0" : "#111111";
  const subLabelClr = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
  const btnHover = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.07)";
  const iconClr  = isDark ? "rgba(255,255,255,.80)" : "rgba(0,0,0,.72)";
  const shadow   = isDark ? "0 1px 0 rgba(255,255,255,.06)" : "0 1px 0 rgba(0,0,0,.07),0 2px 10px rgba(0,0,0,.03)";

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
   Image Resize Handles — handles ao selecionar imagem no editor
───────────────────────────────────────────────────────────────── */
function useImageResize(pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  useEffect(() => {
    const HANDLE_SIZE = 9;
    let activeImg: HTMLImageElement | null = null;
    let activeOverlay: HTMLDivElement | null = null;
    let startX = 0, startY = 0, startW = 0, startH = 0, corner = "";

    function removeOverlay() {
      activeOverlay?.remove(); activeOverlay = null; activeImg = null;
    }

    function attachOverlay(img: HTMLImageElement) {
      removeOverlay();
      activeImg = img;
      const rect = img.getBoundingClientRect();
      const scroll = { x: window.scrollX, y: window.scrollY };

      const ov = document.createElement("div");
      ov.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;border:2px solid #3B82F6;pointer-events:none;z-index:9000;box-sizing:border-box;`;

      const CORNERS = ["nw","ne","sw","se"];
      CORNERS.forEach(c => {
        const h = document.createElement("div");
        const isN = c.startsWith("n"), isW = c.endsWith("w");
        h.style.cssText = `position:absolute;width:${HANDLE_SIZE}px;height:${HANDLE_SIZE}px;background:#fff;border:2px solid #3B82F6;box-sizing:border-box;cursor:${c}-resize;pointer-events:all;z-index:9001;${isN ? "top:-5px" : "bottom:-5px"};${isW ? "left:-5px" : "right:-5px"};`;
        h.dataset.corner = c;
        h.addEventListener("mousedown", startResize);
        ov.appendChild(h);
      });

      document.body.appendChild(ov);
      activeOverlay = ov;

      // Reposição ao scroll/resize
      const reposition = () => {
        if (!activeImg || !activeOverlay) return;
        const r = activeImg.getBoundingClientRect();
        activeOverlay.style.top    = r.top + "px";
        activeOverlay.style.left   = r.left + "px";
        activeOverlay.style.width  = r.width + "px";
        activeOverlay.style.height = r.height + "px";
      };
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
    }

    function startResize(e: MouseEvent) {
      if (!activeImg) return;
      e.preventDefault(); e.stopPropagation();
      corner = (e.currentTarget as HTMLElement).dataset.corner || "se";
      startX = e.clientX; startY = e.clientY;
      startW = activeImg.offsetWidth; startH = activeImg.offsetHeight;
      document.addEventListener("mousemove", doResize);
      document.addEventListener("mouseup", endResize);
    }

    function doResize(e: MouseEvent) {
      if (!activeImg || !activeOverlay) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newW = startW, newH = startH;
      if (corner.includes("e")) newW = Math.max(40, startW + dx);
      if (corner.includes("s")) newH = Math.max(40, startH + dy);
      if (corner.includes("w")) newW = Math.max(40, startW - dx);
      if (corner.includes("n")) newH = Math.max(40, startH - dy);
      activeImg.style.width  = newW + "px";
      activeImg.style.height = newH + "px";
      activeImg.style.maxWidth = "none";
      // reposição overlay
      const r = activeImg.getBoundingClientRect();
      activeOverlay.style.top    = r.top + "px";
      activeOverlay.style.left   = r.left + "px";
      activeOverlay.style.width  = r.width + "px";
      activeOverlay.style.height = r.height + "px";
    }

    function endResize() {
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", endResize);
      // reattach para actualizar posição
      if (activeImg) attachOverlay(activeImg);
    }

    function onPageClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        attachOverlay(target as HTMLImageElement);
      } else if (!activeOverlay?.contains(target)) {
        removeOverlay();
      }
    }

    function onPageKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") removeOverlay();
    }

    // Attach to all page refs
    const pages = pageRefs.current.filter(Boolean) as HTMLDivElement[];
    pages.forEach(p => {
      p.addEventListener("click", onPageClick);
      p.addEventListener("keydown", onPageKeyDown);
    });
    document.addEventListener("keydown", onPageKeyDown);

    return () => {
      pages.forEach(p => {
        p.removeEventListener("click", onPageClick);
        p.removeEventListener("keydown", onPageKeyDown);
      });
      document.removeEventListener("keydown", onPageKeyDown);
      removeOverlay();
    };
  }, [pageRefs]);
}

/* ─────────────────────────────────────────────────────────────────────
   Export to PDF/HTML
───────────────────────────────────────────────────────────────── */
function exportToPDF(pagesContent: string[], documentTitle: string) {
  const pagesHTML = pagesContent.map(html => `
    <div style="width:794px;min-height:1123px;padding:96px;box-sizing:border-box;background:#fff;page-break-after:always;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
      ${html}
    </div>`).join("");
  const htmlContent = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/><title>${documentTitle}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#e8e8e8;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px}@media print{body{background:none;padding:0;gap:0}div{page-break-after:always}div:last-child{page-break-after:avoid}}h1{font-size:1.5rem;font-weight:700;margin-bottom:.75rem;font-family:sans-serif}h2{font-size:1.25rem;font-weight:600;margin-bottom:.5rem;font-family:sans-serif}h3{font-size:1.125rem;font-weight:600;margin-bottom:.5rem;font-family:sans-serif}p{margin-bottom:.75rem}ul,ol{margin-left:1.25rem;margin-bottom:.75rem}li{margin-bottom:.25rem}a{color:#2563eb;text-decoration:underline}blockquote{border-left:4px solid #9ca3af;padding-left:1rem;font-style:italic;color:#4b5563;margin:.75rem 0}code{background:#f3f4f6;padding:0 .25rem;border-radius:.25rem;font-family:monospace;font-size:.875rem}pre{background:#f3f4f6;padding:.75rem;border-radius:.375rem;font-family:monospace;font-size:.875rem;margin:.75rem 0;overflow-x:auto}table{border-collapse:collapse;width:100%;margin:.75rem 0}th,td{border:1px solid #d1d5db;padding:.5rem}th{background:#f9fafb;font-weight:600;text-align:left}img{max-width:100%;height:auto;margin:.5rem 0}hr{border:none;border-top:1px solid #e5e7eb;margin:1rem 0}</style></head><body>${pagesHTML}<script>window.onload=()=>window.print();<\/script></body></html>`;
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${documentTitle || "documento"}.html`; a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────────────
   detectOverflowedNodes
───────────────────────────────────────────────────────────────── */
function detectOverflowedNodes(el: HTMLDivElement, maxH: number): Node[] {
  const overflowed: Node[] = [];
  for (let i = el.childNodes.length - 1; i >= 0; i--) {
    if (el.scrollHeight <= maxH + 10) break;
    const child = el.childNodes[i];
    overflowed.unshift(child);
    el.removeChild(child);
  }
  return overflowed;
}

/* ─────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function DocumentEditor({
  content, onChange, placeholder = "Comece a escrever...",
  zoom, onZoomChange, isMobile = false,
  documentTitle = "Documento sem título", onTitleChange,
}: DocumentEditorProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const containerRef      = useRef<HTMLDivElement>(null);
  const pageRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const pagesContent      = useRef<string[]>([""]);
  const pinchRef          = useRef<{ dist: number; startZoom: number } | null>(null);
  const isInternalChange  = useRef(false);
  const lastPageCount     = useRef(1);

  const [pageCount,     setPageCount]     = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDrawer,    setShowDrawer]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showRename,    setShowRename]    = useState(false);
  const [popupOpen,     setPopupOpen]     = useState(false);
  const popupAnchorRef = useRef<HTMLButtonElement>(null);

  /* ── colours ── */
  const canvasBg  = isDark ? "#1c1c1c" : "#e8e8e8";
  const statusBg  = isDark ? "rgba(14,14,14,0.97)"   : "rgba(245,245,245,0.97)";
  const statusBdr = isDark ? "rgba(255,255,255,.07)"  : "rgba(0,0,0,.09)";
  const statusClr = isDark ? "rgba(255,255,255,.55)"  : "rgba(0,0,0,.55)";
  const statusSep = isDark ? "rgba(255,255,255,.18)"  : "rgba(0,0,0,.18)";
  const pageShadow = isDark
    ? "0 2px 12px rgba(0,0,0,.5),0 8px 40px rgba(0,0,0,.3)"
    : "0 2px 8px rgba(0,0,0,.12),0 8px 32px rgba(0,0,0,.08)";
  const pageNumClr = isDark ? "#666" : "#aaa";

  /* ── image resize ── */
  useImageResize(pageRefs);

  /* ── handlers ── */
  const handleShare = () => {
    if (navigator.share) { navigator.share({ title: documentTitle, text: "Partilhado via Doction" }).catch(() => {}); }
    else { navigator.clipboard.writeText(window.location.href).catch(() => {}); }
  };
  const handleExport      = () => exportToPDF(pagesContent.current, documentTitle);
  const handleRenameConfirm = (newTitle: string) => { setShowRename(false); onTitleChange?.(newTitle); };

  const popupItems = [
    { label: "Partilhar",    src: "/assets/icons/svg/share-social.svg", fallback: "share",    onClick: handleShare  },
    { label: "Exportar PDF", src: "/assets/icons/svg/download.svg",     fallback: "download", onClick: handleExport },
    { label: "Renomear",     src: "/assets/icons/svg/pencil.svg",       fallback: "edit",     onClick: () => setShowRename(true) },
    { label: "Definições",   src: "",                                   fallback: "settings", onClick: () => setShowSettings(true) },
    { label: "Apagar",       src: "",                                   fallback: "trash",    onClick: () => {}, danger: true },
  ];

  /* ── adaptive zoom ── */
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const adapted = isMobile ? computeAdaptiveZoom(containerRef.current.clientWidth) : 100;
      onZoomChange(adapted);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  /* ── sync external content ── */
  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    const el = pageRefs.current[0];
    if (el && el.innerHTML !== content) { el.innerHTML = content; pagesContent.current[0] = content; }
  }, [content]);

  /* ════════════════════════════════════════════════════════
     PAGE OVERFLOW — lógica correta de documento
     Regras:
     1. A página só transborda quando a escrita no FINAL da
        página atual empurra conteúdo para fora.
     2. NUNCA move conteúdo para a página seguinte por causa
        de edição a meio do documento — só quando scrollHeight
        da página atual excede CONTENT_H.
     3. Se blocos voltarem a caber (apagar texto), a página
        extra pode ser removida.
  ════════════════════════════════════════════════════════ */
  const handlePageInput = useCallback((pageIdx: number) => {
    const el = pageRefs.current[pageIdx];
    if (!el) return;
    pagesContent.current[pageIdx] = el.innerHTML;

    /* ── overflow: conteúdo ultrapassa a altura da página ── */
    if (el.scrollHeight > CONTENT_H + 10) {
      const overflow = detectOverflowedNodes(el, CONTENT_H);
      if (overflow.length > 0) {
        const nextIdx = pageIdx + 1;
        /* Cria a próxima página apenas se ainda não existir */
        if (nextIdx >= pagesContent.current.length) {
          pagesContent.current.push("");
        }
        if (nextIdx >= pageCount) {
          setPageCount(c => { lastPageCount.current = c + 1; return c + 1; });
        }
        const overflowHTML = overflow.map(n => {
          const tmp = document.createElement("div");
          tmp.appendChild(n.cloneNode(true));
          return tmp.innerHTML;
        }).join("");
        pagesContent.current[pageIdx] = el.innerHTML;

        /* Pré-pende o HTML transbordado ao início da página seguinte */
        const nextEl = pageRefs.current[nextIdx];
        if (nextEl) {
          nextEl.innerHTML = overflowHTML + (pagesContent.current[nextIdx] || "");
          pagesContent.current[nextIdx] = nextEl.innerHTML;
          /* Recursão: a página seguinte também pode transbordar */
          handlePageInput(nextIdx);
        } else {
          pagesContent.current[nextIdx] = overflowHTML + (pagesContent.current[nextIdx] || "");
        }
      }
    }

    /* ── underflow: a página ficou vazia e é a última — remove ── */
    if (pageIdx > 0 && el.innerHTML.replace(/<br\s*\/?>/gi, "").trim() === "") {
      const totalPages = pagesContent.current.length;
      if (pageIdx === totalPages - 1) {
        pagesContent.current.splice(pageIdx, 1);
        setPageCount(c => Math.max(1, c - 1));
        setTimeout(() => {
          const prev = pageRefs.current[pageIdx - 1];
          if (prev) { prev.focus(); placeCursorAtEnd(prev); }
        }, 30);
      }
    }

    isInternalChange.current = true;
    onChange(pagesContent.current[0] || "");
  }, [pageCount, onChange]);

  /* ── KeyDown ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageIdx: number) => {
    if (e.key === "Tab") { e.preventDefault(); document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;"); }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key) {
        case "b": e.preventDefault(); document.execCommand("bold");      break;
        case "i": e.preventDefault(); document.execCommand("italic");    break;
        case "u": e.preventDefault(); document.execCommand("underline"); break;
        case "=": e.preventDefault(); onZoomChange(Math.min(200, zoom + 10)); break;
        case "-": e.preventDefault(); onZoomChange(Math.max(25,  zoom - 10)); break;
        case "0": e.preventDefault(); onZoomChange(100); break;
      }
    }

    /* Enter perto do fim — muda de página, mas só se não houver espaço */
    if (e.key === "Enter") {
      const el = pageRefs.current[pageIdx];
      if (el && el.scrollHeight >= CONTENT_H - 2) {
        e.preventDefault();
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) {
          pagesContent.current.push("");
          setPageCount(c => c + 1);
        }
        setTimeout(() => {
          const nextEl = pageRefs.current[nextIdx];
          if (nextEl) { nextEl.focus(); placeCursorAtStart(nextEl); }
        }, 30);
      }
    }

    /* Backspace no início da página — mescla com a anterior se a anterior tiver espaço */
    if (e.key === "Backspace" && pageIdx > 0) {
      const el = pageRefs.current[pageIdx];
      if (!el) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.startOffset === 0 && range.collapsed && el.childNodes.length <= 1) {
          e.preventDefault();
          const prevEl = pageRefs.current[pageIdx - 1];
          if (prevEl) { prevEl.focus(); placeCursorAtEnd(prevEl); }
        }
      }
    }
  };

  function placeCursorAtStart(el: HTMLElement) {
    const range = document.createRange(), sel = window.getSelection();
    range.setStart(el, 0); range.collapse(true);
    sel?.removeAllRanges(); sel?.addRange(range);
  }

  function placeCursorAtEnd(el: HTMLElement) {
    const range = document.createRange(), sel = window.getSelection();
    range.selectNodeContents(el); range.collapse(false);
    sel?.removeAllRanges(); sel?.addRange(range);
  }

  /* ── init pages ── */
  const initPage = useCallback((el: HTMLDivElement | null, idx: number) => {
    if (!el) return;
    pageRefs.current[idx] = el;
    if (el.innerHTML !== (pagesContent.current[idx] || "")) el.innerHTML = pagesContent.current[idx] || "";
  }, []);

  /* ── pinch zoom ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), startZoom: zoom };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      onZoomChange(Math.max(25, Math.min(200, Math.round(pinchRef.current.startZoom * (Math.hypot(dx, dy) / pinchRef.current.dist)))));
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); onZoomChange(Math.max(25, Math.min(200, zoom + (e.deltaY < 0 ? 10 : -10)))); }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  /* ── page content inline styles ── */
  const pageContentStyle: React.CSSProperties = {
    position: "absolute",
    top: PAGE_MARGIN_PX, left: PAGE_MARGIN_PX,
    width: CONTENT_W, height: CONTENT_H,
    outline: "none", overflow: "hidden",
    fontFamily: "Georgia,'Times New Roman',serif",
    fontSize: 14, lineHeight: "1.6",
    color: "#1a1a1a", wordBreak: "break-word", whiteSpace: "pre-wrap",
  };

  /* ── page CSS classes ── */
  const pageContentClass = `
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-2 [&_h1]:font-sans [&_h1]:leading-tight
    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-2 [&_h2]:font-sans
    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:font-sans
    [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mb-1 [&_h4]:font-sans
    [&_p]:mb-3
    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3
    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3
    [&_li]:mb-1
    [&_a]:text-blue-600 [&_a]:underline
    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3
    [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm
    [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
    [&_table]:border-collapse [&_table]:w-full [&_table]:my-3
    [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left
    [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
    [&_img]:inline-block [&_img]:my-2 [&_img]:max-w-full
    [&_hr]:border-gray-200 [&_hr]:my-4
  `;

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", overflow: "hidden" }}>

      {!isMobile && (
        <Sidebar isDark={isDark} documentTitle={documentTitle} onOpenSettings={() => setShowSettings(true)} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        <AppBar
          isDark={isDark} isMobile={isMobile} documentTitle={documentTitle}
          onMenuClick={() => setShowDrawer(true)}
          onPopupToggle={() => setPopupOpen(v => !v)}
          popupOpen={popupOpen} popupAnchorRef={popupAnchorRef}
          popupItems={popupItems} onPopupClose={() => setPopupOpen(false)}
        />

        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ background: canvasBg, touchAction: "pan-y pinch-zoom" }}>

          {showZoomModal && isMobile && (
            <ZoomModal zoom={zoom} onZoomChange={onZoomChange} onClose={() => setShowZoomModal(false)} />
          )}

          {showDrawer && isMobile && (
            <DrawerMenu onClose={() => setShowDrawer(false)} isDark={isDark}
              documentTitle={documentTitle} onOpenSettings={() => setShowSettings(true)} />
          )}

          {showRename && (
            <RenameModal isDark={isDark} currentTitle={documentTitle}
              onConfirm={handleRenameConfirm} onCancel={() => setShowRename(false)} />
          )}

          {showSettings && (
            <SettingsModal isDark={isDark} onClose={() => setShowSettings(false)}
              onThemeChange={(t) => setTheme(t)} />
          )}

          {/* Canvas */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
              marginBottom: `${(zoom / 100 - 1) * pageCount * (PAGE_H + 24) * 0.5}px`,
            }}>
              {Array.from({ length: pageCount }).map((_, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {pageCount > 1 && (
                    <div style={{ position: "absolute", top: -20, left: 0, right: 0, textAlign: "center", fontSize: 11, color: pageNumClr, userSelect: "none" }}>
                      Página {idx + 1}
                    </div>
                  )}
                  <div style={{ width: PAGE_W, height: PAGE_H, background: "#ffffff", boxShadow: pageShadow, position: "relative", overflow: "hidden", flexShrink: 0 }}>
                    <div
                      ref={(el) => initPage(el, idx)}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={() => setActivePageIdx(idx)}
                      onInput={() => handlePageInput(idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      style={pageContentStyle}
                      className={pageContentClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div style={{ height: 28, background: statusBg, borderTop: `1.5px solid ${statusBdr}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: statusClr, fontWeight: 500 }}>Pronto</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <span style={{ fontSize: 11, color: statusClr }}>Pág. {activePageIdx + 1} / {pageCount}</span>
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
