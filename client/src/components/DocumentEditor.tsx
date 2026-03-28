import { useRef, useEffect, useState, useCallback } from "react";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  isMobile?: boolean;
}

// A4 page at 96dpi
const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_MARGIN_PX = 96;
const CONTENT_W = PAGE_W - PAGE_MARGIN_PX * 2;
const CONTENT_H = PAGE_H - PAGE_MARGIN_PX * 2;

function computeAdaptiveZoom(containerW: number): number {
  const available = containerW - 48;
  const raw = (available / PAGE_W) * 100;
  return Math.max(25, Math.min(150, Math.round(raw)));
}

export default function DocumentEditor({
  content,
  onChange,
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
  const hasInitialized = useRef(false);

  // Adaptive zoom: on mobile always adapt, on desktop default to 100%
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (isMobile) {
      const calc = () => {
        if (!containerRef.current) return;
        onZoomChange(computeAdaptiveZoom(containerRef.current.clientWidth));
      };
      calc();
      const ro = new ResizeObserver(calc);
      if (containerRef.current) ro.observe(containerRef.current);
      return () => ro.disconnect();
    } else {
      // Desktop: always 100% default
      onZoomChange(100);
    }
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

  // Pinch zoom (mobile)
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

  // Ctrl+wheel zoom (desktop)
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
      style={{ background: "#1a1a1a" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Scrollable page area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          padding: "28px 16px",
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
                  textAlign: "center", fontSize: 11, color: "#555", userSelect: "none",
                }}>
                  Página {idx + 1}
                </div>
              )}

              {/* A4 Page — clean white, no lines, no placeholder text */}
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  background: "#ffffff",
                  boxShadow: "0 2px 12px rgba(0,0,0,.5), 0 12px 48px rgba(0,0,0,.35)",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* Editable content area — clean, no placeholder, no lines */}
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

      {/* Status bar — dark */}
      <div style={{
        height: 26,
        background: "#111111",
        borderTop: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Pronto</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>·</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>
          Pág. {activePageIdx + 1} / {pageCount}
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>·</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>{Math.round(zoom)}%</span>
      </div>
    </div>
  );
}
