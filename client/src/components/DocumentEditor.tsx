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

/* ── Zoom Modal — mobile only ────────────────────────────────────── */
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

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 60) onClose();
  };
  const onTouchEnd = () => { startY.current = null; };

  const PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,.5)",
          animation: "zmFadeIn .16s ease both",
        }}
      />
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
          @keyframes zmFadeIn{from{opacity:0}to{opacity:1}}
          @keyframes zmSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        `}</style>

        {/* Handlebar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{
            width: 38, height: 4, borderRadius: 99,
            background: "rgba(255,255,255,.15)",
          }} />
        </div>

        {/* Title */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 9, padding: "6px 24px 18px",
        }}>
          <img
            src="/assets/icons/svg/zoom-in.svg"
            alt="" width={17} height={17}
            style={{ filter: "invert(1)", opacity: .7 }}
          />
          <span style={{
            fontSize: ".87rem", fontWeight: 700,
            color: "#e8e8e8", letterSpacing: ".01em",
          }}>
            Zoom · {Math.round(zoom)}%
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 4px" }}>
          <button
            onClick={() => onZoomChange(Math.max(25, zoom - 10))}
            style={{
              width: 46, height: 46, borderRadius: 13,
              border: "1.5px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.06)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/assets/icons/svg/zoom-out.svg" alt="–" width={20} height={20}
              style={{ filter: "invert(1)", opacity: .8 }} />
          </button>

          <div style={{
            flex: 1, display: "flex", gap: 6, overflowX: "auto",
            scrollbarWidth: "none", padding: "2px 0",
          }}>
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => onZoomChange(p)}
                style={{
                  flexShrink: 0,
                  height: 46, padding: "0 14px",
                  borderRadius: 12,
                  border: zoom === p
                    ? "1.5px solid rgba(255,255,255,.75)"
                    : "1.5px solid rgba(255,255,255,.09)",
                  background: zoom === p ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.04)",
                  color: zoom === p ? "#fff" : "rgba(255,255,255,.4)",
                  fontSize: ".8rem", fontWeight: zoom === p ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .12s",
                }}
              >
                {p}%
              </button>
            ))}
          </div>

          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            style={{
              width: 46, height: 46, borderRadius: 13,
              border: "1.5px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.06)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/assets/icons/svg/zoom-in.svg" alt="+" width={20} height={20}
              style={{ filter: "invert(1)", opacity: .8 }} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Popup Menu ───────────────────────────────────────────────────── */
function PopupMenu({
  items,
  onClose,
  anchorRef,
  isDark,
}: {
  items: { label: string; icon?: string; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isDark: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    // use capture so it fires before other handlers
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [onClose, anchorRef]);

  const bg = isDark ? "#242424" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const itemHover = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const dangerClr = "#e05555";

  return (
    <>
      {/* Invisible backdrop — tap outside to close */}
      <div
        onPointerDown={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 999 }}
      />
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          zIndex: 1000,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.4)"
            : "0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)",
          minWidth: 180,
          overflow: "hidden",
          animation: "popIn .14s cubic-bezier(.25,.46,.45,.94) both",
        }}
      >
        <style>{`
          @keyframes popIn {
            from { opacity: 0; transform: scale(.95) translateY(-4px); }
            to   { opacity: 1; transform: scale(1)  translateY(0); }
          }
          .popup-item:hover { background: var(--popup-hover) !important; }
        `}</style>
        {items.map((item, i) => (
          <button
            key={i}
            className="popup-item"
            onClick={() => { item.onClick(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 14px",
              background: "none", border: "none",
              cursor: "pointer", textAlign: "left",
              color: item.danger ? dangerClr : textClr,
              fontSize: ".875rem", fontWeight: 500,
              "--popup-hover": itemHover,
              borderTop: i > 0 ? `1px solid ${border}` : "none",
            } as React.CSSProperties}
          >
            {item.icon && (
              <img
                src={item.icon}
                alt=""
                width={15} height={15}
                style={{
                  filter: item.danger
                    ? "none"
                    : isDark ? "invert(1)" : "invert(0)",
                  opacity: item.danger ? 1 : 0.7,
                  flexShrink: 0,
                }}
              />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Drawer (mobile) ──────────────────────────────────────────────── */
function DrawerMenu({
  onClose,
  isDark,
  documentTitle,
}: {
  onClose: () => void;
  isDark: boolean;
  documentTitle: string;
}) {
  const bg = isDark ? "#161616" : "#fafafa";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const subClr = isDark ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.4)";
  const itemHoverBg = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
  const divider = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)";

  const navItems = [
    { label: "Documentos", icon: "/assets/icons/svg/file-text.svg" },
    { label: "Recentes", icon: "/assets/icons/svg/clock.svg" },
    { label: "Partilhados", icon: "/assets/icons/svg/users.svg" },
    { label: "Arquivo", icon: "/assets/icons/svg/archive.svg" },
    { label: "Definições", icon: "/assets/icons/svg/settings.svg" },
  ];

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 8000,
          background: "rgba(0,0,0,.4)",
          animation: "drawerFadeIn .2s ease both",
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 280,
          zIndex: 8001,
          background: bg,
          boxShadow: "4px 0 32px rgba(0,0,0,.3)",
          display: "flex", flexDirection: "column",
          animation: "drawerSlideIn .22s cubic-bezier(.25,.46,.45,.94) both",
        }}
      >
        <style>{`
          @keyframes drawerFadeIn { from{opacity:0} to{opacity:1} }
          @keyframes drawerSlideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
          .drawer-item:hover { background: var(--ditem-hover) !important; }
        `}</style>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "56px 20px 20px",
          borderBottom: `1px solid ${divider}`,
        }}>
          <img
            src="/assets/icons/app_icon.svg"
            alt="Doction"
            width={32} height={32}
            style={{ borderRadius: 8, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: ".95rem", fontWeight: 700, color: textClr }}>Doction</div>
            <div style={{ fontSize: ".75rem", color: subClr, marginTop: 1 }}>Editor de Documentos</div>
          </div>
        </div>

        {/* Current doc */}
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ fontSize: ".7rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
            Documento actual
          </div>
          <div style={{ fontSize: ".875rem", fontWeight: 500, color: textClr, wordBreak: "break-word" }}>
            {documentTitle || "Sem título"}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {navItems.map((item, i) => (
            <button
              key={i}
              className="drawer-item"
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 12px",
                borderRadius: 10,
                background: "none", border: "none",
                cursor: "pointer", textAlign: "left",
                color: textClr, fontSize: ".875rem", fontWeight: 500,
                "--ditem-hover": itemHoverBg,
              } as React.CSSProperties}
            >
              <img
                src={item.icon}
                alt=""
                width={18} height={18}
                style={{ filter: isDark ? "invert(1)" : "invert(0)", opacity: .65, flexShrink: 0 }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Sidebar (desktop) ────────────────────────────────────────────── */
function Sidebar({
  isDark,
  documentTitle,
}: {
  isDark: boolean;
  documentTitle: string;
}) {
  const bg = isDark ? "#161616" : "#f5f5f5";
  const border = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)";
  const textClr = isDark ? "#e8e8e8" : "#1a1a1a";
  const subClr = isDark ? "rgba(255,255,255,.38)" : "rgba(0,0,0,.38)";
  const itemHoverBg = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
  const activeItemBg = isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.07)";

  const navItems = [
    { label: "Documentos", icon: "/assets/icons/svg/file-text.svg", active: false },
    { label: "Recentes", icon: "/assets/icons/svg/clock.svg", active: false },
    { label: "Partilhados", icon: "/assets/icons/svg/users.svg", active: false },
    { label: "Arquivo", icon: "/assets/icons/svg/archive.svg", active: false },
    { label: "Definições", icon: "/assets/icons/svg/settings.svg", active: false },
  ];

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: bg,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "18px 16px 14px",
        borderBottom: `1px solid ${border}`,
      }}>
        <img
          src="/assets/icons/app_icon.svg"
          alt="Doction"
          width={28} height={28}
          style={{ borderRadius: 7, flexShrink: 0 }}
        />
        <span style={{ fontSize: ".95rem", fontWeight: 700, color: textClr }}>Doction</span>
      </div>

      {/* Current doc */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ fontSize: ".68rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
          Aberto
        </div>
        <div style={{
          fontSize: ".82rem", fontWeight: 500, color: textClr,
          wordBreak: "break-word", lineHeight: 1.4,
        }}>
          {documentTitle || "Sem título"}
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {navItems.map((item, i) => (
          <button
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 10px",
              borderRadius: 8,
              background: item.active ? activeItemBg : "none",
              border: "none",
              cursor: "pointer", textAlign: "left",
              color: item.active ? textClr : subClr,
              fontSize: ".85rem", fontWeight: item.active ? 600 : 500,
              transition: "background .12s, color .12s",
            }}
            onMouseEnter={e => {
              if (!item.active) (e.currentTarget as HTMLElement).style.background = itemHoverBg;
            }}
            onMouseLeave={e => {
              if (!item.active) (e.currentTarget as HTMLElement).style.background = "none";
            }}
          >
            <img
              src={item.icon}
              alt=""
              width={16} height={16}
              style={{
                filter: isDark ? "invert(1)" : "invert(0)",
                opacity: item.active ? 0.85 : 0.5,
                flexShrink: 0,
              }}
            />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── AppBar ───────────────────────────────────────────────────────── */
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
  popupItems: { label: string; icon?: string; onClick: () => void; danger?: boolean }[];
  onPopupClose: () => void;
}) {
  const bg = isDark
    ? "rgba(18,18,18,0.96)"
    : "rgba(250,250,250,0.96)";
  const border = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)";
  const titleClr = isDark ? "#f0f0f0" : "#1a1a1a";
  const btnBg = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)";
  const btnHover = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.1)";

  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 10px 0 12px",
        background: bg,
        backdropFilter: "blur(16px) saturate(1.6)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6)",
        borderBottom: `1.5px solid ${border}`,
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Left — App icon (opens drawer on mobile) */}
      <button
        onClick={isMobile ? onMenuClick : undefined}
        style={{
          width: 36, height: 36,
          borderRadius: 10,
          border: "none",
          background: "none",
          cursor: isMobile ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <img
          src="/assets/icons/app_icon.svg"
          alt="Doction"
          width={28} height={28}
          style={{ borderRadius: 7, display: "block" }}
        />
      </button>

      {/* Centre — Document title */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "calc(100% - 140px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: ".9rem",
          fontWeight: 600,
          color: titleClr,
          letterSpacing: "-.01em",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {documentTitle || "Sem título"}
      </div>

      {/* Right — more button with popup */}
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button
          ref={popupAnchorRef}
          onClick={onPopupToggle}
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            border: "none",
            background: popupOpen ? btnHover : "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .12s",
            padding: 0,
          }}
          onMouseEnter={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = btnBg; }}
          onMouseLeave={e => { if (!popupOpen) (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <img
            src="/assets/icons/svg/more-vertical.svg"
            alt="Mais opções"
            width={20} height={20}
            style={{ filter: isDark ? "invert(1)" : "invert(0)", opacity: .7 }}
          />
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

/* ── Main ─────────────────────────────────────────────────────────── */
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

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const pagesContent = useRef<string[]>([""]);
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);
  const isInternalChange = useRef(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupAnchorRef = useRef<HTMLButtonElement>(null);

  /* ── colour tokens ── */
  const canvasBg  = isDark ? "#1c1c1c" : "#e8e8e8";
  const statusBg  = isDark ? "rgba(14,14,14,0.97)"    : "rgba(245,245,245,0.97)";
  const statusBdr = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)";
  const statusClr = isDark ? "rgba(255,255,255,.45)"  : "rgba(0,0,0,.45)";
  const statusSep = isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.15)";
  const pageShadow = isDark
    ? "0 2px 12px rgba(0,0,0,.5), 0 8px 40px rgba(0,0,0,.3)"
    : "0 2px 8px rgba(0,0,0,.12), 0 8px 32px rgba(0,0,0,.08)";
  const pageNumClr = isDark ? "#666" : "#aaa";

  const popupItems = [
    { label: "Partilhar", icon: "/assets/icons/svg/share.svg", onClick: () => {} },
    { label: "Exportar PDF", icon: "/assets/icons/svg/download.svg", onClick: () => {} },
    { label: "Renomear", icon: "/assets/icons/svg/edit-2.svg", onClick: () => {} },
    { label: "Apagar", icon: "/assets/icons/svg/trash-2.svg", onClick: () => {}, danger: true },
  ];

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const adapted = isMobile
        ? computeAdaptiveZoom(containerRef.current.clientWidth)
        : 100;
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
    if (el && el.innerHTML !== content) {
      el.innerHTML = content;
      pagesContent.current[0] = content;
    }
  }, [content]);

  const handlePageInput = useCallback((pageIdx: number) => {
    const el = pageRefs.current[pageIdx];
    if (!el) return;
    pagesContent.current[pageIdx] = el.innerHTML;
    if (el.scrollHeight > CONTENT_H + 20) {
      const overflow = detectOverflowedNodes(el, CONTENT_H);
      if (overflow.length > 0) {
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) {
          setPageCount((c) => c + 1);
          pagesContent.current[nextIdx] = "";
        }
        const overflowHTML = overflow.map((n) => {
          const tmp = document.createElement("div");
          tmp.appendChild(n.cloneNode(true));
          n.parentNode?.removeChild(n);
          return tmp.innerHTML;
        }).join("");
        pagesContent.current[pageIdx] = el.innerHTML;
        const nextEl = pageRefs.current[nextIdx];
        if (nextEl) {
          nextEl.innerHTML = overflowHTML + (pagesContent.current[nextIdx] || "");
          pagesContent.current[nextIdx] = nextEl.innerHTML;
        } else {
          pagesContent.current[nextIdx] = overflowHTML + (pagesContent.current[nextIdx] || "");
        }
      }
    }
    isInternalChange.current = true;
    onChange(pagesContent.current[0] || "");
  }, [pageCount, onChange]);

  function detectOverflowedNodes(el: HTMLDivElement, maxH: number): Node[] {
    const overflowed: Node[] = [];
    const children = Array.from(el.childNodes);
    for (let i = children.length - 1; i >= 0; i--) {
      if (el.scrollHeight <= maxH + 10) break;
      const child = children[i];
      overflowed.unshift(child);
      el.removeChild(child);
    }
    return overflowed;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageIdx: number) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key) {
        case "b": e.preventDefault(); document.execCommand("bold"); break;
        case "i": e.preventDefault(); document.execCommand("italic"); break;
        case "u": e.preventDefault(); document.execCommand("underline"); break;
        case "=": e.preventDefault(); onZoomChange(Math.min(200, zoom + 10)); break;
        case "-": e.preventDefault(); onZoomChange(Math.max(25, zoom - 10)); break;
        case "0": e.preventDefault(); onZoomChange(100); break;
      }
    }
    if (e.key === "Enter") {
      const el = pageRefs.current[pageIdx];
      if (el && el.scrollHeight >= CONTENT_H - 20) {
        e.preventDefault();
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) setPageCount((c) => c + 1);
        setTimeout(() => {
          const nextEl = pageRefs.current[nextIdx];
          if (nextEl) { nextEl.focus(); placeCursorAtStart(nextEl); }
        }, 50);
      }
    }
  };

  function placeCursorAtStart(el: HTMLElement) {
    const range = document.createRange();
    const sel = window.getSelection();
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
      const dist = Math.hypot(dx, dy);
      const newZoom = Math.max(25, Math.min(200, Math.round(pinchRef.current.startZoom * (dist / pinchRef.current.dist))));
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
    if (el.innerHTML !== (pagesContent.current[idx] || "")) {
      el.innerHTML = pagesContent.current[idx] || "";
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar — desktop only, always visible */}
      {!isMobile && (
        <Sidebar isDark={isDark} documentTitle={documentTitle} />
      )}

      {/* Main column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* AppBar */}
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

        {/* Editor canvas */}
        <div
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ background: canvasBg, touchAction: "pan-y pinch-zoom" }}
        >
          {/* Zoom modal — mobile only */}
          {showZoomModal && isMobile && (
            <ZoomModal zoom={zoom} onZoomChange={onZoomChange} onClose={() => setShowZoomModal(false)} />
          )}

          {/* Drawer — mobile only */}
          {showDrawer && isMobile && (
            <DrawerMenu
              onClose={() => setShowDrawer(false)}
              isDark={isDark}
              documentTitle={documentTitle}
            />
          )}

          {/* Scrollable page area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "auto",
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
                marginBottom: `${(zoom / 100 - 1) * pageCount * (PAGE_H + 24) * 0.5}px`,
              }}
            >
              {Array.from({ length: pageCount }).map((_, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {pageCount > 1 && (
                    <div style={{
                      position: "absolute", top: -20, left: 0, right: 0,
                      textAlign: "center", fontSize: 11, color: pageNumClr, userSelect: "none",
                    }}>
                      Página {idx + 1}
                    </div>
                  )}

                  {/* A4 Page */}
                  <div
                    style={{
                      width: PAGE_W,
                      height: PAGE_H,
                      background: "#ffffff",
                      boxShadow: pageShadow,
                      position: "relative",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      ref={(el) => initPage(el, idx)}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={() => setActivePageIdx(idx)}
                      onInput={() => handlePageInput(idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      style={{
                        position: "absolute",
                        top: PAGE_MARGIN_PX,
                        left: PAGE_MARGIN_PX,
                        width: CONTENT_W,
                        height: CONTENT_H,
                        outline: "none",
                        overflow: "hidden",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 14,
                        lineHeight: "1.6",
                        color: "#1a1a1a",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
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

          {/* Status bar */}
          <div style={{
            height: 28,
            background: statusBg,
            borderTop: `1.5px solid ${statusBdr}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 10,
            flexShrink: 0,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: 11, color: statusClr, fontWeight: 500 }}>Pronto</span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <span style={{ fontSize: 11, color: statusClr }}>
              Pág. {activePageIdx + 1} / {pageCount}
            </span>
            <span style={{ fontSize: 11, color: statusSep }}>·</span>
            <button
              onClick={() => isMobile && setShowZoomModal(true)}
              style={{
                fontSize: 11, color: statusClr,
                background: "none", border: "none",
                cursor: isMobile ? "pointer" : "default",
                padding: 0,
                display: "flex", alignItems: "center", gap: 4,
                fontWeight: 500,
              }}
            >
              {isMobile && (
                <img src="/assets/icons/svg/zoom-in.svg" alt="" width={10} height={10}
                  style={{ filter: isDark ? "invert(1)" : "invert(0)", opacity: .35 }} />
              )}
              {Math.round(zoom)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
