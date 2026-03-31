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
  onNavigateToSettings?: () => void;
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
  "arrow-left": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  "download": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
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
  const [localZoom, setLocalZoom] = useState(zoom);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99998,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
        animation: "fadeIn 0.15s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.14)",
          animation: "slideUp 0.24s cubic-bezier(0.25,0.46,0.45,0.94) both",
          padding: "0 0 env(safe-area-inset-bottom)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e0e0e0" }} />
        </div>

        <div style={{ padding: "8px 20px 24px" }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>
            Ajustar Zoom
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => {
                const newZoom = Math.max(25, localZoom - 10);
                setLocalZoom(newZoom);
                onZoomChange(newZoom);
              }}
              style={{
                width: 44, height: 44, borderRadius: 12,
                border: "1.5px solid #e0e0e0", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#1a1a1a",
              }}
            >
              <Icon src="/assets/icons/svg/zoom-out.svg" fallback="zoom-out" size={20} />
            </button>

            <input
              type="range"
              min="25"
              max="200"
              step="5"
              value={localZoom}
              onChange={(e) => {
                const newZoom = Number(e.target.value);
                setLocalZoom(newZoom);
                onZoomChange(newZoom);
              }}
              style={{
                flex: 1, height: 6, borderRadius: 99,
                appearance: "none", background: "#e0e0e0",
                outline: "none",
              }}
            />

            <button
              onClick={() => {
                const newZoom = Math.min(200, localZoom + 10);
                setLocalZoom(newZoom);
                onZoomChange(newZoom);
              }}
              style={{
                width: 44, height: 44, borderRadius: 12,
                border: "1.5px solid #e0e0e0", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#1a1a1a",
              }}
            >
              <Icon src="/assets/icons/svg/zoom-in.svg" fallback="zoom-in" size={20} />
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: 24, fontWeight: 600, color: "#1a1a1a" }}>
            {Math.round(localZoom)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DrawerMenu — mobile only
   ───────────────────────────────────────────────────────────────── */
function DrawerMenu({
  onClose,
  isDark,
  documentTitle,
  onNavigateToSettings,
}: {
  onClose: () => void;
  isDark: boolean;
  documentTitle?: string;
  onNavigateToSettings?: () => void;
}) {
  const menuBg = isDark ? "#111" : "#fff";
  const menuClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const menuItemHover = isDark ? "#222" : "#f4f4f4";
  const menuBdr = isDark ? "#222" : "#f0f0f0";

  interface MenuItem {
    icon: string;
    lucideIcon: string;
    label: string;
    onClick: () => void;
    isDanger?: boolean;
  }

  const menuItems: MenuItem[] = [
    {
      icon: "/assets/icons/svg/file-text.svg",
      lucideIcon: "file-text",
      label: "Novo documento",
      onClick: () => { onClose(); },
    },
    {
      icon: "/assets/icons/svg/file-plus.svg",
      lucideIcon: "file-plus",
      label: "Abrir documento",
      onClick: () => { onClose(); },
    },
    {
      icon: "/assets/icons/svg/clock.svg",
      lucideIcon: "clock",
      label: "Documentos recentes",
      onClick: () => { onClose(); },
    },
    {
      icon: "/assets/icons/svg/users.svg",
      lucideIcon: "users",
      label: "Partilhados comigo",
      onClick: () => { onClose(); },
    },
    {
      icon: "/assets/icons/svg/archive.svg",
      lucideIcon: "archive",
      label: "Arquivo",
      onClick: () => { onClose(); },
    },
    {
      icon: "/assets/icons/svg/settings.svg",
      lucideIcon: "settings",
      label: "Configurações",
      onClick: () => { 
        onClose(); 
        onNavigateToSettings?.();
      },
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        animation: "fadeIn 0.15s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "85%", maxWidth: 340,
          background: menuBg,
          boxShadow: "2px 0 40px rgba(0,0,0,0.2)",
          animation: "slideInLeft 0.24s cubic-bezier(0.25,0.46,0.45,0.94) both",
          display: "flex", flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${menuBdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: menuClr,
            margin: 0,
          }}>
            Doction
          </h2>

          {/* Botão X sem container */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: menuClr,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
            }}
          >
            <Icon src="/assets/icons/svg/x.svg" fallback="x" size={20} />
          </button>
        </div>

        {/* Documento atual */}
        {documentTitle && (
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${menuBdr}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Documento atual
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: menuClr }}>
              {documentTitle}
            </div>
          </div>
        )}

        {/* Menu items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: item.isDanger ? "#dc2626" : menuClr,
                fontSize: 15,
                fontWeight: 500,
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = menuItemHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <Icon src={item.icon} fallback={item.lucideIcon} size={20} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 20px",
          borderTop: `1px solid ${menuBdr}`,
          fontSize: 12,
          color: "#888",
        }}>
          Doction v1.0.0
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sidebar — desktop only
   ───────────────────────────────────────────────────────────────── */
function Sidebar({
  isDark,
  documentTitle,
  onNavigateToSettings,
}: {
  isDark: boolean;
  documentTitle?: string;
  onNavigateToSettings?: () => void;
}) {
  const sidebarBg = isDark ? "#0a0a0a" : "#fafafa";
  const sidebarClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const sidebarBdr = isDark ? "#1a1a1a" : "#e0e0e0";
  const itemHover = isDark ? "#1a1a1a" : "#f0f0f0";

  interface SidebarItem {
    icon: string;
    lucideIcon: string;
    label: string;
    onClick: () => void;
  }

  const items: SidebarItem[] = [
    {
      icon: "/assets/icons/svg/file-text.svg",
      lucideIcon: "file-text",
      label: "Documentos",
      onClick: () => {},
    },
    {
      icon: "/assets/icons/svg/clock.svg",
      lucideIcon: "clock",
      label: "Recentes",
      onClick: () => {},
    },
    {
      icon: "/assets/icons/svg/users.svg",
      lucideIcon: "users",
      label: "Partilhados",
      onClick: () => {},
    },
    {
      icon: "/assets/icons/svg/archive.svg",
      lucideIcon: "archive",
      label: "Arquivo",
      onClick: () => {},
    },
  ];

  return (
    <div style={{
      width: 240,
      background: sidebarBg,
      borderRight: `1px solid ${sidebarBdr}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px",
        borderBottom: `1px solid ${sidebarBdr}`,
      }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: sidebarClr,
          margin: 0,
        }}>
          Doction
        </h1>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: sidebarClr,
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = itemHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <Icon src={item.icon} fallback={item.lucideIcon} size={18} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Settings button */}
      <div style={{
        padding: "12px 0",
        borderTop: `1px solid ${sidebarBdr}`,
      }}>
        <button
          onClick={onNavigateToSettings}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: sidebarClr,
            fontSize: 14,
            fontWeight: 500,
            textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = itemHover}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          <Icon src="/assets/icons/svg/settings.svg" fallback="settings" size={18} />
          Configurações
        </button>
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
  onRenameDocument,
}: {
  isDark: boolean;
  isMobile?: boolean;
  documentTitle?: string;
  onMenuClick?: () => void;
  onPopupToggle?: () => void;
  popupOpen?: boolean;
  popupAnchorRef?: React.RefObject<HTMLButtonElement>;
  popupItems?: Array<{
    icon?: string;
    lucideIcon?: string;
    label: string;
    onClick: () => void;
    isDanger?: boolean;
  }>;
  onPopupClose?: () => void;
  onRenameDocument?: () => void;
}) {
  const appbarBg = isDark ? "#0a0a0a" : "#fff";
  const appbarClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const appbarBdr = isDark ? "#1a1a1a" : "#e0e0e0";

  return (
    <div style={{
      height: 56,
      background: appbarBg,
      borderBottom: `1px solid ${appbarBdr}`,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 12,
      flexShrink: 0,
    }}>
      {/* Menu button (mobile only) */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: appbarClr,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {/* Document title (editable) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          type="text"
          value={documentTitle || "Sem título"}
          onChange={(e) => onRenameDocument?.()}
          onClick={onRenameDocument}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            outline: "none",
            fontSize: isMobile ? 16 : 15,
            fontWeight: 600,
            color: appbarClr,
            padding: "6px 8px",
            borderRadius: 6,
            cursor: "pointer",
          }}
          onFocus={(e) => {
            e.target.style.background = isDark ? "#1a1a1a" : "#f4f4f4";
          }}
          onBlur={(e) => {
            e.target.style.background = "none";
          }}
        />
      </div>

      {/* More options button */}
      <button
        ref={popupAnchorRef}
        onClick={onPopupToggle}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "none",
          background: popupOpen ? (isDark ? "#1a1a1a" : "#f0f0f0") : "none",
          cursor: "pointer",
          color: appbarClr,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon src="/assets/icons/svg/more-vertical.svg" fallback="more-vertical" size={20} />
      </button>

      {/* Popup menu */}
      {popupOpen && popupAnchorRef?.current && popupItems && (
        <Popup
          anchorEl={popupAnchorRef.current}
          onClose={onPopupClose || (() => {})}
          items={popupItems}
          isDark={isDark}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Popup
   ───────────────────────────────────────────────────────────────── */
function Popup({
  anchorEl,
  onClose,
  items,
  isDark,
}: {
  anchorEl: HTMLElement;
  onClose: () => void;
  items: Array<{
    icon?: string;
    lucideIcon?: string;
    label: string;
    onClick: () => void;
    isDanger?: boolean;
  }>;
  isDark: boolean;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left - 200 + rect.width,
    });
  }, [anchorEl]);

  const popupBg = isDark ? "#1a1a1a" : "#fff";
  const popupClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const popupBdr = isDark ? "#2a2a2a" : "#e4e4e4";
  const itemHover = isDark ? "#2a2a2a" : "#f4f4f4";

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99997,
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          zIndex: 99998,
          background: popupBg,
          border: `1px solid ${popupBdr}`,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          minWidth: 220,
          overflow: "hidden",
          animation: "popIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: item.isDanger ? "#dc2626" : popupClr,
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = itemHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {item.icon && (
              <Icon src={item.icon} fallback={item.lucideIcon || "file-text"} size={18} />
            )}
            {item.label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────── */
export default function DocumentEditor({
  content,
  onChange,
  placeholder = "Começa a escrever...",
  zoom,
  onZoomChange,
  isMobile = false,
  documentTitle = "Sem título",
  onTitleChange,
  onNavigateToSettings,
}: DocumentEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pagesContent = useRef<string[]>([""]);
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);

  const [pageCount, setPageCount] = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupAnchorRef = useRef<HTMLButtonElement>(null);

  // Theme colors
  const canvasBg = isDark ? "#000" : "#f4f4f4";
  const pageShadow = isDark
    ? "0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)"
    : "0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)";
  const pageNumClr = isDark ? "#666" : "#999";
  const statusBg = isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)";
  const statusBdr = isDark ? "#1a1a1a" : "#e0e0e0";
  const statusClr = isDark ? "#888" : "#666";
  const statusSep = isDark ? "#333" : "#d0d0d0";

  // Popup items
  const popupItems = [
    {
      icon: "/assets/icons/svg/edit.svg",
      lucideIcon: "edit",
      label: "Renomear documento",
      onClick: () => {
        const newTitle = prompt("Novo nome do documento:", documentTitle);
        if (newTitle && newTitle.trim()) {
          onTitleChange?.(newTitle.trim());
        }
      },
    },
    {
      icon: "/assets/icons/svg/download.svg",
      lucideIcon: "download",
      label: "Transferir como PDF",
      onClick: () => {
        // Implementar download PDF
        alert("Funcionalidade de download em desenvolvimento");
      },
    },
    {
      icon: "/assets/icons/svg/share.svg",
      lucideIcon: "share",
      label: "Partilhar documento",
      onClick: () => {
        alert("Funcionalidade de partilha em desenvolvimento");
      },
    },
    {
      icon: "/assets/icons/svg/trash.svg",
      lucideIcon: "trash",
      label: "Eliminar documento",
      onClick: () => {
        if (confirm("Tens a certeza que queres eliminar este documento?")) {
          alert("Documento eliminado");
        }
      },
      isDanger: true,
    },
  ];

  useEffect(() => {
    if (!containerRef.current || !isMobile) return;
    const w = containerRef.current.offsetWidth;
    const adaptiveZoom = computeAdaptiveZoom(w);
    if (Math.abs(zoom - adaptiveZoom) > 5) onZoomChange(adaptiveZoom);
  }, [isMobile, zoom, onZoomChange]);

  const handlePageInput = useCallback((idx: number) => {
    const el = pageRefs.current[idx];
    if (!el) return;
    pagesContent.current[idx] = el.innerHTML;

    const allHTML = pagesContent.current.join("");
    onChange(allHTML);

    if (el.scrollHeight > CONTENT_H + 20) {
      const overflowHTML = extractOverflow(el);
      if (overflowHTML.trim()) {
        if (idx === pageCount - 1) {
          pagesContent.current.push(overflowHTML);
          setPageCount((c) => c + 1);
        } else {
          const nextEl = pageRefs.current[idx + 1];
          if (nextEl) {
            nextEl.innerHTML = overflowHTML + nextEl.innerHTML;
            pagesContent.current[idx + 1] = nextEl.innerHTML;
          }
        }
      }
    }
  }, [pageCount, onChange]);

  function extractOverflow(el: HTMLDivElement): string {
    const children = Array.from(el.childNodes);
    let overflow = "";
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (el.scrollHeight <= CONTENT_H + 20) break;
      if (child.nodeType === Node.ELEMENT_NODE) {
        overflow = (child as HTMLElement).outerHTML + overflow;
      } else if (child.nodeType === Node.TEXT_NODE) {
        overflow = (child.textContent || "") + overflow;
      }
      el.removeChild(child);
    }
    return overflow;
  }

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace") {
      const el = pageRefs.current[idx];
      if (el && el.innerHTML === "" && idx > 0) {
        e.preventDefault();
        pagesContent.current.splice(idx, 1);
        setPageCount((c) => c - 1);
        const prevEl = pageRefs.current[idx - 1];
        if (prevEl) { prevEl.focus(); placeCursorAtEnd(prevEl); }
      }
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const nextIdx = idx + 1;
      if (nextIdx >= pageCount) {
        pagesContent.current.push("");
        setPageCount((c) => c + 1);
        setTimeout(() => {
          const nextEl = pageRefs.current[nextIdx];
          if (nextEl) { nextEl.focus(); placeCursorAtStart(nextEl); }
        }, 50);
      }
    }
  };

  function placeCursorAtEnd(el: HTMLElement) {
    const range = document.createRange();
    const sel   = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

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

      {!isMobile && <Sidebar isDark={isDark} documentTitle={documentTitle} onNavigateToSettings={onNavigateToSettings} />}

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
          onRenameDocument={() => {
            const newTitle = prompt("Novo nome do documento:", documentTitle);
            if (newTitle && newTitle.trim()) {
              onTitleChange?.(newTitle.trim());
            }
          }}
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
            <DrawerMenu 
              onClose={() => setShowDrawer(false)} 
              isDark={isDark} 
              documentTitle={documentTitle}
              onNavigateToSettings={onNavigateToSettings}
            />
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

          {/* Status bar - SEM BLUR */}
          <div style={{
            height: 28, background: statusBg,
            borderTop: `1.5px solid ${statusBdr}`,
            display: "flex", alignItems: "center",
            padding: "0 14px", gap: 10, flexShrink: 0,
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
                <Icon src="/assets/icons/svg/zoom-in.svg" fallback="zoom-in" size={10} color={statusClr} />
              )}
              {Math.round(zoom)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
