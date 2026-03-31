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

const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_MARGIN_PX = 96;
const CONTENT_W = PAGE_W - PAGE_MARGIN_PX * 2;
const CONTENT_H = PAGE_H - PAGE_MARGIN_PX * 2;

function computeAdaptiveZoom(containerW: number): number {
  const available = containerW - 32;
  const raw = (available / PAGE_W) * 100;
  return Math.max(25, Math.min(150, Math.round(raw)));
}

/* ─────────────────────────────────────────────────────────────────────
   Lucide SVG fallbacks — usados quando o ficheiro .svg não existe
   ───────────────────────────────────────────────────────────────── */
const LUCIDE: Record<string, (sz: number) => JSX.Element> = {
  "file-text": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  "file-plus": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  "clock": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  "users": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  "archive": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  "settings": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  "search": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  "more-vertical": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="19" r="1" fill="currentColor"/>
    </svg>
  ),
  "share": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  "edit": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
  "trash": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  "x": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  "zoom-in": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  "zoom-out": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────────
   Icon — tenta .svg, cai para Lucide se falhar ou src vazio
   ───────────────────────────────────────────────────────────────── */
function Icon({
  src,
  fallback,
  size = 18,
  color = "currentColor",
  opacity = 1,
  style,
}: {
  src?: string;
  fallback: string;
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  const [useFallback, setUseFallback] = useState(!src);
  useEffect(() => { setUseFallback(!src); }, [src]);

  const wrapStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color,
    opacity,
    width: size,
    height: size,
    ...style,
  };

  if (useFallback) {
    const fn = LUCIDE[fallback];
    return <span style={wrapStyle}>{fn ? fn(size) : null}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setUseFallback(true)}
      style={{ flexShrink: 0, opacity, display: "block", ...style }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ZoomModal — mobile only
   ───────────────────────────────────────────────────────────────── */
function ZoomModal({
  zoom,
  onZoomChange,
  onClose,
}: {
  zoom: number;
  onZoomChange: (z: number) => void;
  onClose: () => void;
}) {
  const startY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (startY.current !== null && e.touches[0].clientY - startY.current > 60) onClose();
  };
  const onTouchEnd = () => { startY.current = null; };
  const PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,.5)",
        animation: "zmFadeIn .16s ease both",
      }} />
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: "#191919",
          borderRadius: "20px 20px 0 0",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
          animation: "zmSlideUp .22s cubic-bezier(.25,.46,.45,.94) both",
          boxShadow: "0 -4px 48px rgba(0,0,0,.5)",
        }}
      >
        <style>{`
          @keyframes zmFadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes zmSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        `}</style>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(255,255,255,.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "6px 24px 18px" }}>
          <Icon src="/assets/icons/svg/zoom-in.svg" fallback="zoom-in" size={17} color="rgba(255,255,255,.7)" />
          <span style={{ fontSize: ".87rem", fontWeight: 700, color: "#e8e8e8", letterSpacing: ".01em" }}>
            Zoom · {Math.round(zoom)}%
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 4px" }}>
          <button onClick={() => onZoomChange(Math.max(25, zoom - 10))} style={{
            width: 46, height: 46, borderRadius: 13,
            border: "1.5px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.06)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon src="/assets/icons/svg/zoom-out.svg" fallback="zoom-out" size={20} color="rgba(255,255,255,.8)" />
          </button>
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
            {PRESETS.map(p => (
              <button key={p} onClick={() => onZoomChange(p)} style={{
                flexShrink: 0, height: 46, padding: "0 14px", borderRadius: 12,
                border: zoom === p ? "1.5px solid rgba(255,255,255,.75)" : "1.5px solid rgba(255,255,255,.09)",
                background: zoom === p ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.04)",
                color: zoom === p ? "#fff" : "rgba(255,255,255,.4)",
                fontSize: ".8rem", fontWeight: zoom === p ? 700 : 500,
                cursor: "pointer", transition: "all .12s",
              }}>{p}%</button>
            ))}
          </div>
          <button onClick={() => onZoomChange(Math.min(200, zoom + 10))} style={{
            width: 46, height: 46, borderRadius: 13,
            border: "1.5px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.06)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon src="/assets/icons/svg/zoom-in.svg" fallback="zoom-in" size={20} color="rgba(255,255,255,.8)" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PopupMenu — blur + animação spring + saída animada
   ───────────────────────────────────────────────────────────────── */
function PopupMenu({
  items,
  onClose,
  anchorRef,
  isDark,
}: {
  items: {
    label: string;
    src?: string;
    fallback?: string;
    onClick: () => void;
    danger?: boolean;
  }[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isDark: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) dismiss();
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [dismiss, anchorRef]);

  const bg      = isDark ? "rgba(26,26,26,0.88)" : "rgba(255,255,255,0.82)";
  const border  = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const dangerClr = "#e05555";
  const hoverBg = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)";

  return (
    <>
      <style>{`
        @keyframes popIn {
          from { opacity:0; transform:scale(.88) translateY(-10px); filter:blur(6px); }
          to   { opacity:1; transform:scale(1)   translateY(0);     filter:blur(0);   }
        }
        @keyframes popOut {
          from { opacity:1; transform:scale(1)   translateY(0);     filter:blur(0);   }
          to   { opacity:0; transform:scale(.90) translateY(-8px);  filter:blur(4px); }
        }
        .pm-item { transition: background .1s; }
        .pm-item:hover  { background: var(--pm-hover) !important; }
        .pm-item:active { transform: scale(.98); }
      `}</style>

      <div onPointerDown={dismiss} style={{ position: "fixed", inset: 0, zIndex: 999 }} />

      <div
        ref={menuRef}
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          zIndex: 1000,
          background: bg,
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          border: `1px solid ${border}`,
          borderRadius: 14,
          boxShadow: isDark
            ? "0 16px 56px rgba(0,0,0,.65), 0 2px 14px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.07)"
            : "0 16px 56px rgba(0,0,0,.13), 0 2px 14px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.95)",
          minWidth: 195,
          overflow: "hidden",
          transformOrigin: "top right",
          animation: closing
            ? "popOut .15s cubic-bezier(.4,0,.6,1) both"
            : "popIn .2s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            className="pm-item"
            onClick={() => { item.onClick(); dismiss(); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 15px",
              background: "none", border: "none",
              borderTop: i > 0 ? `1px solid ${border}` : "none",
              cursor: "pointer", textAlign: "left",
              color: item.danger ? dangerClr : textClr,
              fontSize: ".875rem", fontWeight: 500,
              "--pm-hover": hoverBg,
            } as React.CSSProperties}
          >
            {(item.src !== undefined || item.fallback) && (
              <Icon
                src={item.src}
                fallback={item.fallback || "file-text"}
                size={15}
                color={item.danger ? dangerClr : textClr}
                opacity={item.danger ? 0.9 : 0.65}
              />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DrawerMenu (mobile) — estilo Manus
   ───────────────────────────────────────────────────────────────── */
function DrawerMenu({
  onClose,
  isDark,
  documentTitle,
}: {
  onClose: () => void;
  isDark: boolean;
  documentTitle: string;
}) {
  const [closing, setClosing] = useState(false);
  const [activeIdx, setActiveIdx] = useState(2); // "Documentos" por defeito
  const panelRef = useRef<HTMLDivElement>(null);
  const startX   = useRef<number | null>(null);

  const bg      = isDark ? "rgba(16,16,16,0.97)" : "rgba(252,252,252,0.97)";
  const textClr = isDark ? "#e8e8e8" : "#111111";
  const subClr  = isDark ? "rgba(255,255,255,.38)" : "rgba(0,0,0,.38)";
  const activeItemBg = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.065)";
  const hoverBg = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.033)";
  const divider = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

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

  /* Nav com ícones reais da pasta onde existem */
  const sections: {
    title: string | null;
    items: { label: string; src: string; fallback: string; badge?: string }[];
  }[] = [
    {
      title: null,
      items: [
        { label: "Novo documento", src: "/assets/icons/svg/document-add.svg", fallback: "file-plus" },
        { label: "Procurar",       src: "",                                   fallback: "search"    },
      ],
    },
    {
      title: "Biblioteca",
      items: [
        { label: "Documentos",  src: "/assets/icons/svg/document-text.svg", fallback: "file-text"             },
        { label: "Recentes",    src: "",                                     fallback: "clock"                 },
        { label: "Favoritos",   src: "/assets/icons/svg/star.svg",           fallback: "search"                },
        { label: "Partilhados", src: "/assets/icons/svg/people.svg",         fallback: "users",  badge: "Novo" },
        { label: "Arquivo",     src: "",                                     fallback: "archive"               },
      ],
    },
    {
      title: null,
      items: [
        { label: "Definições", src: "", fallback: "settings" },
      ],
    },
  ];

  let globalIdx = 0;

  return (
    <>
      <style>{`
        @keyframes drawerScrimIn  { from{opacity:0} to{opacity:1} }
        @keyframes drawerScrimOut { from{opacity:1} to{opacity:0} }
        @keyframes drawerPanelIn  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes drawerPanelOut { from{transform:translateX(0)} to{transform:translateX(-100%)} }
        .dr-item { transition: background .1s; }
        .dr-item:hover  { background: var(--dr-hover) !important; }
        .dr-item:active { transform: scale(.98); transition: transform .06s; }
      `}</style>

      {/* Scrim com blur suave */}
      <div onClick={dismiss} style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(0,0,0,.44)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        animation: closing ? "drawerScrimOut .26s ease both" : "drawerScrimIn .2s ease both",
      }} />

      {/* Painel */}
      <div
        ref={panelRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 292,
          zIndex: 8001,
          background: bg,
          backdropFilter: "blur(28px) saturate(1.9)",
          WebkitBackdropFilter: "blur(28px) saturate(1.9)",
          borderRight: `1px solid ${divider}`,
          boxShadow: "6px 0 48px rgba(0,0,0,.26)",
          display: "flex", flexDirection: "column",
          willChange: "transform",
          animation: closing
            ? "drawerPanelOut .26s cubic-bezier(.4,0,.6,1) both"
            : "drawerPanelIn .28s cubic-bezier(.25,.46,.45,.94) both",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "56px 18px 18px",
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/assets/icons/app_icon.svg" alt="Doction" width={34} height={34}
              style={{ borderRadius: 9, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: textClr, letterSpacing: "-.01em" }}>Doction</div>
              <div style={{ fontSize: ".72rem", color: subClr, marginTop: 1 }}>Editor de documentos</div>
            </div>
          </div>
          <button onClick={dismiss} style={{
            width: 30, height: 30, borderRadius: 8, border: "none",
            background: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <Icon fallback="x" size={15} color={subClr} />
          </button>
        </div>

        {/* Documento actual */}
        <div style={{
          margin: "10px 10px 0",
          padding: "10px 13px",
          borderRadius: 11,
          background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
          border: `1px solid ${divider}`,
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <Icon src="/assets/icons/svg/document.svg" fallback="file-text" size={15} color={textClr} opacity={0.5} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: ".67rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>
              Documento actual
            </div>
            <div style={{ fontSize: ".84rem", fontWeight: 600, color: textClr, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {documentTitle || "Sem título"}
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 12px", marginTop: 8 }}>
          {sections.map((section, si) => {
            return (
              <div key={si}>
                {section.title && (
                  <div style={{
                    fontSize: ".67rem", fontWeight: 600, color: subClr,
                    textTransform: "uppercase", letterSpacing: ".07em",
                    padding: "10px 12px 5px",
                  }}>
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const idx = globalIdx++;
                  const isActive = activeIdx === idx;
                  return (
                    <button
                      key={idx}
                      className="dr-item"
                      onClick={() => setActiveIdx(idx)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        width: "100%", padding: "11px 12px",
                        borderRadius: 10,
                        background: isActive ? activeItemBg : "none",
                        border: "none",
                        cursor: "pointer", textAlign: "left",
                        color: isActive ? textClr : subClr,
                        fontSize: ".875rem",
                        fontWeight: isActive ? 600 : 500,
                        "--dr-hover": hoverBg,
                      } as React.CSSProperties}
                    >
                      <Icon
                        src={item.src}
                        fallback={item.fallback}
                        size={18}
                        color={isActive ? textClr : subClr}
                        opacity={isActive ? 0.9 : 0.55}
                      />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: ".65rem", fontWeight: 700,
                          background: "#3B82F6", color: "#fff",
                          borderRadius: 99, padding: "2px 7px",
                          letterSpacing: ".02em",
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                {si < sections.length - 1 && (
                  <div style={{ height: 1, background: divider, margin: "6px 4px" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 12px",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
          borderTop: `1px solid ${divider}`,
        }}>
          <button style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%",
            background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
            border: `1px solid ${divider}`,
            borderRadius: 10, padding: "9px 12px",
            cursor: "pointer",
          }}>
            <span style={{ fontSize: ".76rem", color: subClr, fontWeight: 500 }}>Partilhe o Doction</span>
            <Icon src="/assets/icons/svg/share-social.svg" fallback="share" size={15} color={subClr} opacity={0.6} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sidebar — desktop
   ───────────────────────────────────────────────────────────────── */
function Sidebar({ isDark, documentTitle }: { isDark: boolean; documentTitle: string }) {
  const bg      = isDark ? "#161616" : "#f5f5f5";
  const border  = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const subClr  = isDark ? "rgba(255,255,255,.38)" : "rgba(0,0,0,.38)";
  const hoverBg  = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
  const activeBg = isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.07)";

  const navItems = [
    { label: "Documentos",  src: "/assets/icons/svg/document-text.svg", fallback: "file-text", active: true  },
    { label: "Recentes",    src: "",                                     fallback: "clock",     active: false },
    { label: "Partilhados", src: "/assets/icons/svg/people.svg",         fallback: "users",     active: false },
    { label: "Arquivo",     src: "",                                     fallback: "archive",   active: false },
    { label: "Definições",  src: "",                                     fallback: "settings",  active: false },
  ];

  return (
    <div style={{ width: 240, flexShrink: 0, background: bg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 14px", borderBottom: `1px solid ${border}` }}>
        <img src="/assets/icons/app_icon.svg" alt="Doction" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
        <span style={{ fontSize: ".95rem", fontWeight: 700, color: textClr }}>Doction</span>
      </div>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontSize: ".68rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Aberto</div>
        <div style={{ fontSize: ".82rem", fontWeight: 500, color: textClr, wordBreak: "break-word", lineHeight: 1.4 }}>
          {documentTitle || "Sem título"}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {navItems.map((item, i) => (
          <button key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "9px 10px", borderRadius: 8,
            background: item.active ? activeBg : "none", border: "none",
            cursor: "pointer", textAlign: "left",
            color: item.active ? textClr : subClr,
            fontSize: ".85rem", fontWeight: item.active ? 600 : 500,
            transition: "background .12s, color .12s",
          }}
            onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
            onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <Icon src={item.src} fallback={item.fallback} size={16} color={item.active ? textClr : subClr} opacity={item.active ? 0.85 : 0.5} />
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
function AppBar({
  isDark,
  isMobile,
  documentTitle,
  onMenuClick,
  onPopupToggle,
  popupOpen,
  popupAnchorRef,
  popupItems,
  onPopupClose,
}: {
  isDark: boolean;
  isMobile: boolean;
  documentTitle: string;
  onMenuClick: () => void;
  onPopupToggle: () => void;
  popupOpen: boolean;
  popupAnchorRef: React.RefObject<HTMLButtonElement | null>;
  popupItems: { label: string; src?: string; fallback?: string; onClick: () => void; danger?: boolean }[];
  onPopupClose: () => void;
}) {
  /* Light → branco puro; Dark → quase preto sólido */
  const bg       = isDark ? "rgba(14,14,14,0.97)" : "#ffffff";
  const titleClr = isDark ? "#f0f0f0" : "#111111";
  const subLabelClr = isDark ? "rgba(255,255,255,.28)" : "rgba(0,0,0,.28)";
  const btnHover = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.07)";
  const iconClr  = isDark ? "rgba(255,255,255,.68)" : "rgba(0,0,0,.60)";

  /* Sombra subtil em vez de border sólida */
  const shadow = isDark
    ? "0 1px 0 rgba(255,255,255,.06)"
    : "0 1px 0 rgba(0,0,0,.07), 0 2px 10px rgba(0,0,0,.03)";

  return (
    <div style={{
      height: 52, flexShrink: 0,
      display: "flex", alignItems: "center",
      padding: "0 10px 0 12px",
      background: bg,
      boxShadow: shadow,
      position: "relative", zIndex: 100,
    }}>
      {/* Esquerda — ícone app (abre drawer no mobile) */}
      <button onClick={isMobile ? onMenuClick : undefined} style={{
        width: 36, height: 36, borderRadius: 10,
        border: "none", background: "none",
        cursor: isMobile ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, padding: 0,
      }}>
        <img src="/assets/icons/app_icon.svg" alt="Doction" width={28} height={28} style={{ borderRadius: 7, display: "block" }} />
      </button>

      {/* Centro — título */}
      {isMobile ? (
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          maxWidth: "calc(100% - 120px)",
          display: "flex", flexDirection: "column", alignItems: "center",
          pointerEvents: "none", userSelect: "none",
        }}>
          <span style={{
            fontSize: ".875rem", fontWeight: 700,
            color: titleClr, letterSpacing: "-.01em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
          }}>
            {documentTitle || "Sem título"}
          </span>
          <span style={{ fontSize: ".65rem", color: subLabelClr, marginTop: 1, fontWeight: 500 }}>
            Documento
          </span>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Direita — ··· */}
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button
          ref={popupAnchorRef}
          onClick={onPopupToggle}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: popupOpen ? btnHover : "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .12s", padding: 0,
          }}
          onMouseEnter={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = btnHover; }}
          onMouseLeave={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <Icon src="/assets/icons/svg/options.svg" fallback="more-vertical" size={20} color={iconClr} />
        </button>

        {popupOpen && (
          <PopupMenu
            items={popupItems}
            onClose={onPopupClose}
            anchorRef={popupAnchorRef as React.RefObject<HTMLElement | null>}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Main export
   ───────────────────────────────────────────────────────────────── */
export default function DocumentEditor({
  content,
  onChange,
  placeholder = "Comece a escrever...",
  zoom,
  onZoomChange,
  isMobile = false,
  documentTitle = "Documento sem título",
  onTitleChange,
}: DocumentEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerRef     = useRef<HTMLDivElement>(null);
  const pageRefs         = useRef<(HTMLDivElement | null)[]>([]);
  const [pageCount, setPageCount]         = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const pagesContent     = useRef<string[]>([""]);
  const pinchRef         = useRef<{ dist: number; startZoom: number } | null>(null);
  const isInternalChange = useRef(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDrawer,    setShowDrawer]    = useState(false);
  const [popupOpen,     setPopupOpen]     = useState(false);
  const popupAnchorRef   = useRef<HTMLButtonElement>(null);

  const canvasBg   = isDark ? "#1c1c1c" : "#e8e8e8";
  const statusBg   = isDark ? "rgba(14,14,14,0.97)"  : "rgba(245,245,245,0.97)";
  const statusBdr  = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)";
  const statusClr  = isDark ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)";
  const statusSep  = isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.15)";
  const pageShadow = isDark
    ? "0 2px 12px rgba(0,0,0,.5), 0 8px 40px rgba(0,0,0,.3)"
    : "0 2px 8px rgba(0,0,0,.12), 0 8px 32px rgba(0,0,0,.08)";
  const pageNumClr = isDark ? "#666" : "#aaa";

  /* Popup items usando ícones reais da pasta */
  const popupItems = [
    { label: "Partilhar",    src: "/assets/icons/svg/share-social.svg", fallback: "share",  onClick: () => {} },
    { label: "Exportar PDF", src: "/assets/icons/svg/download.svg",     fallback: "archive", onClick: () => {} },
    { label: "Renomear",     src: "/assets/icons/svg/pencil.svg",       fallback: "edit",   onClick: () => {} },
    { label: "Apagar",       src: "",                                   fallback: "trash",  onClick: () => {}, danger: true },
  ];

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

  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    const el = pageRefs.current[0];
    if (el && el.innerHTML !== content) { el.innerHTML = content; pagesContent.current[0] = content; }
  }, [content]);

  const handlePageInput = useCallback((pageIdx: number) => {
    const el = pageRefs.current[pageIdx];
    if (!el) return;
    pagesContent.current[pageIdx] = el.innerHTML;
    if (el.scrollHeight > CONTENT_H + 20) {
      const overflow = detectOverflowedNodes(el, CONTENT_H);
      if (overflow.length > 0) {
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) { setPageCount(c => c + 1); pagesContent.current[nextIdx] = ""; }
        const overflowHTML = overflow.map(n => {
          const tmp = document.createElement("div");
          tmp.appendChild(n.cloneNode(true));
          n.parentNode?.removeChild(n);
          return tmp.innerHTML;
        }).join("");
        pagesContent.current[pageIdx] = el.innerHTML;
        const nextEl = pageRefs.current[nextIdx];
        if (nextEl) { nextEl.innerHTML = overflowHTML + (pagesContent.current[nextIdx] || ""); pagesContent.current[nextIdx] = nextEl.innerHTML; }
        else { pagesContent.current[nextIdx] = overflowHTML + (pagesContent.current[nextIdx] || ""); }
      }
    }
    isInternalChange.current = true;
    onChange(pagesContent.current[0] || "");
  }, [pageCount, onChange]);

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
    if (e.key === "Enter") {
      const el = pageRefs.current[pageIdx];
      if (el && el.scrollHeight >= CONTENT_H - 20) {
        e.preventDefault();
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) setPageCount(c => c + 1);
        setTimeout(() => {
          const nextEl = pageRefs.current[nextIdx];
          if (nextEl) { nextEl.focus(); placeCursorAtStart(nextEl); }
        }, 50);
      }
    }
  };

  function placeCursorAtStart(el: HTMLElement) {
    const range = document.createRange();
    const sel   = window.getSelection();
    range.setStart(el, 0);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

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
      const newZoom = Math.max(25, Math.min(200, Math.round(pinchRef.current.startZoom * (Math.hypot(dx, dy) / pinchRef.current.dist))));
      onZoomChange(newZoom);
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onZoomChange(Math.max(25, Math.min(200, zoom + (e.deltaY < 0 ? 10 : -10))));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  const initPage = useCallback((el: HTMLDivElement | null, idx: number) => {
    if (!el) return;
    pageRefs.current[idx] = el;
    if (el.innerHTML !== (pagesContent.current[idx] || "")) el.innerHTML = pagesContent.current[idx] || "";
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", overflow: "hidden" }}>

      {!isMobile && <Sidebar isDark={isDark} documentTitle={documentTitle} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        <AppBar
          isDark={isDark}
          isMobile={isMobile}
          documentTitle={documentTitle}
          onMenuClick={() => setShowDrawer(true)}
          onPopupToggle={() => setPopupOpen(v => !v)}
          popupOpen={popupOpen}
          popupAnchorRef={popupAnchorRef}
          popupItems={popupItems}
          onPopupClose={() => setPopupOpen(false)}
        />

        <div
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ background: canvasBg, touchAction: "pan-y pinch-zoom" }}
        >
          {showZoomModal && isMobile && (
            <ZoomModal zoom={zoom} onZoomChange={onZoomChange} onClose={() => setShowZoomModal(false)} />
          )}

          {showDrawer && isMobile && (
            <DrawerMenu onClose={() => setShowDrawer(false)} isDark={isDark} documentTitle={documentTitle} />
          )}

          <div style={{
            flex: 1, overflowY: "auto", overflowX: "auto",
            padding: "24px 16px",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 24,
          }}>
            <div style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 24,
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
                      style={{
                        position: "absolute",
                        top: PAGE_MARGIN_PX, left: PAGE_MARGIN_PX,
                        width: CONTENT_W, height: CONTENT_H,
                        outline: "none", overflow: "hidden",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 14, lineHeight: "1.6",
                        color: "#1a1a1a", wordBreak: "break-word", whiteSpace: "pre-wrap",
                      }}
                      className="
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
                        [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                        [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
                        [&_table]:border-collapse [&_table]:w-full [&_table]:my-3
                        [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left
                        [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2
                        [&_hr]:border-gray-200 [&_hr]:my-4
                      "
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            height: 28, background: statusBg,
            borderTop: `1.5px solid ${statusBdr}`,
            display: "flex", alignItems: "center",
            padding: "0 14px", gap: 10, flexShrink: 0,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: 11, color: statusClr, fontWeight: 500 }}>Pronto</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <span style={{ fontSize: 11, color: statusClr }}>Pág. {activePageIdx + 1} / {pageCount}</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <button
              onClick={() => isMobile && setShowZoomModal(true)}
              style={{
                fontSize: 11, color: statusClr,
                background: "none", border: "none",
                cursor: isMobile ? "pointer" : "default",
                padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500,
              }}
            >
              {isMobile && (
                <Icon src="/assets/icons/svg/zoom-in.svg" fallback="zoom-in" size={10} color={statusClr} opacity={0.35} />
              )}
              {Math.round(zoom)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Eu não te pedi nenhum efeito blur e já agora não sei a razão dos ícones estarem fuscos e também não sei porquê na versão mobile o ícone no drawer fica muito em baixo e já agora só para te mostrar como a opção de download funciona eu vou te passar uma referência e também quero que todas as funcionalidades funcionem 100% e o app nem se quer está renomeando o documento etc etc e já agora também quero que cries a tela de settings separadamente quero que ao clicar nessa opção que ele leva numa tela de configurações e nessa mesma tela tem que ter muitas opções como alteração de tema de idioma e muito muito mais sobre os documentos e quero que ele tenha um botão somente com ícone para voltar e sem container nele e quero que o botão de x no drawer menu também não tenha container...