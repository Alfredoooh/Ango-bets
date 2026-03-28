import { useRef, useEffect, useState, useCallback } from "react";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  isMobile?: boolean;
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

/* ── Main ─────────────────────────────────────────────────────────── */
export default function DocumentEditor({
  content,
  onChange,
  placeholder = "Comece a escrever...",
  zoom,
  onZoomChange,
  isMobile = false,
}: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const pagesContent = useRef<string[]>([""]);
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);
  const isInternalChange = useRef(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      // Desktop: always 100%. Mobile: adaptive to container width.
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
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ background: "#1c1c1c", touchAction: "pan-y pinch-zoom" }}
    >
      {/* Zoom modal — mobile only */}
      {showZoomModal && isMobile && (
        <ZoomModal zoom={zoom} onZoomChange={onZoomChange} onClose={() => setShowZoomModal(false)} />
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
                  textAlign: "center", fontSize: 11, color: "#666", userSelect: "none",
                }}>
                  Página {idx + 1}
                </div>
              )}

              {/* A4 Page — clean, no lines, no placeholder text, no border guide */}
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  background: "#ffffff",
                  boxShadow: "0 2px 12px rgba(0,0,0,.5), 0 8px 40px rgba(0,0,0,.3)",
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
        height: 26,
        background: "#111",
        borderTop: "1px solid rgba(255,255,255,.05)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Pronto</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.15)" }}>·</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
          Pág. {activePageIdx + 1} / {pageCount}
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.15)" }}>·</span>
        {/* Zoom label — clickable on mobile opens modal */}
        <button
          onClick={() => isMobile && setShowZoomModal(true)}
          style={{
            fontSize: 11, color: "rgba(255,255,255,.4)",
            background: "none", border: "none",
            cursor: isMobile ? "pointer" : "default",
            padding: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {isMobile && (
            <img src="/assets/icons/svg/zoom-in.svg" alt="" width={10} height={10}
              style={{ filter: "invert(1)", opacity: .35 }} />
          )}
          {Math.round(zoom)}%
        </button>
      </div>
    </div>
  );
}
