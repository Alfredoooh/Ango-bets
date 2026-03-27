import { useRef, useEffect, useState, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  zoom: number;
  onZoomChange: (z: number) => void;
}

// A4 page at 96dpi: 794 × 1123 px
// With 96px (1in) margins on each side: content area = 602 × 931 px
const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_MARGIN_PX = 96; // 1 inch = 96px at 96dpi
const CONTENT_W = PAGE_W - PAGE_MARGIN_PX * 2; // 602px
const CONTENT_H = PAGE_H - PAGE_MARGIN_PX * 2; // 931px

// Compute zoom so the page fits nicely in the container
function computeAdaptiveZoom(containerW: number): number {
  // We want the page (794px) + some padding (32px each side) to fit
  const available = containerW - 32;
  const raw = (available / PAGE_W) * 100;
  return Math.max(25, Math.min(150, Math.round(raw)));
}

export default function DocumentEditor({
  content,
  onChange,
  placeholder = "Comece a escrever...",
  zoom,
  onZoomChange,
}: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);
  // Store each page's content separately
  const pagesContent = useRef<string[]>([""]);
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);
  const isInternalChange = useRef(false);

  // ── Adaptive zoom on mount/resize ─────────────────────────────────────────
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const adapted = computeAdaptiveZoom(containerRef.current.clientWidth);
      onZoomChange(adapted);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync content to first page on external change ─────────────────────────
  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    const el = pageRefs.current[0];
    if (el && el.innerHTML !== content) {
      el.innerHTML = content;
      pagesContent.current[0] = content;
    }
  }, [content]);

  // ── Handle typing: detect overflow and move excess to next page ───────────
  const handlePageInput = useCallback((pageIdx: number) => {
    const el = pageRefs.current[pageIdx];
    if (!el) return;

    // Save current content
    pagesContent.current[pageIdx] = el.innerHTML;

    // Check overflow
    if (el.scrollHeight > CONTENT_H + 20) {
      // Page overflowed — need a new page or push content to next
      const overflow = detectOverflowedNodes(el, CONTENT_H);
      if (overflow.length > 0) {
        // Move overflowed nodes to next page
        const nextIdx = pageIdx + 1;
        if (nextIdx >= pageCount) {
          setPageCount((c) => c + 1);
          pagesContent.current[nextIdx] = "";
        }
        // Build HTML for next page prefix
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
          // Will be set when page renders
          pagesContent.current[nextIdx] = overflowHTML + (pagesContent.current[nextIdx] || "");
        }
      }
    }

    // Report content of page 0 upward
    isInternalChange.current = true;
    onChange(pagesContent.current[0] || "");
  }, [pageCount, onChange]);

  // ── Detect nodes that overflow the container height ────────────────────────
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

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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
    // Enter at end of full page → move to next page
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

  // ── Pinch zoom ─────────────────────────────────────────────────────────────
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

  // ── Ctrl+wheel zoom ────────────────────────────────────────────────────────
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

  // ── Init new pages with saved content ─────────────────────────────────────
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
      className="flex-1 flex flex-col overflow-hidden bg-[#f0f0f0]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {/* Zoom bar — compact, above pages */}
      <div
        style={{
          height: 36,
          background: "#fff",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); onZoomChange(Math.max(25, zoom - 10)); }}
            style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}
            title="Diminuir (Ctrl+-)"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); onZoomChange(100); }}
            style={{ fontSize: 12, fontWeight: 600, color: "#444", padding: "0 6px", height: 28, border: "1px solid #e0e0e0", borderRadius: 6, background: "#f8f8f8", cursor: "pointer", minWidth: 52, textAlign: "center" }}
            title="Repor zoom"
          >
            {Math.round(zoom)}%
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); onZoomChange(Math.min(200, zoom + 10)); }}
            style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}
            title="Aumentar (Ctrl++)"
          >
            <ZoomIn size={15} />
          </button>
        </div>
        <span style={{ fontSize: 11, color: "#999" }}>
          {pageCount} página{pageCount !== 1 ? "s" : ""} · pitada ou Ctrl+scroll p/ zoom
        </span>
      </div>

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
        {/* Zoom wrapper — scales from top-center */}
        <div
          className="zoom-wrapper"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            // Compensate layout height so scroll works correctly
            marginBottom: `${(zoom / 100 - 1) * pageCount * (PAGE_H + 24) * 0.5}px`,
          }}
        >
          {Array.from({ length: pageCount }).map((_, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              {/* Page number badge */}
              {pageCount > 1 && (
                <div style={{
                  position: "absolute", top: -20, left: 0, right: 0,
                  textAlign: "center", fontSize: 11, color: "#999", userSelect: "none",
                }}>
                  Página {idx + 1}
                </div>
              )}

              {/* A4 Page */}
              <div
                className="doc-page"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 8px 32px rgba(0,0,0,.10)",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* Page ruler lines (subtle) */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #f0f0f0 31px, #f0f0f0 32px)",
                  backgroundPosition: `0 ${PAGE_MARGIN_PX}px`,
                  opacity: activePageIdx === idx ? 0.5 : 0,
                  transition: "opacity 0.2s",
                }} />

                {/* Editable content area */}
                <div
                  ref={(el) => initPage(el, idx)}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder={idx === 0 ? placeholder : ""}
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
                    overflow: "hidden", // CRITICAL: prevents page from growing
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
                    [&_blockquote]:border-l-4 [&_blockquote]:border-orange-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3
                    [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                    [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
                    [&_table]:border-collapse [&_table]:w-full [&_table]:my-3
                    [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left
                    [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2
                    [&_hr]:border-gray-200 [&_hr]:my-4
                  "
                />

                {/* Placeholder */}
                {idx === 0 && !content && (
                  <div style={{
                    position: "absolute",
                    top: PAGE_MARGIN_PX,
                    left: PAGE_MARGIN_PX,
                    color: "#b0b0b0",
                    fontSize: 14,
                    fontFamily: "Georgia, serif",
                    lineHeight: "1.6",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}>
                    {placeholder}
                  </div>
                )}

                {/* Page border guide (faint) */}
                <div style={{
                  position: "absolute",
                  top: PAGE_MARGIN_PX - 1,
                  left: PAGE_MARGIN_PX - 1,
                  width: CONTENT_W + 2,
                  height: CONTENT_H + 2,
                  border: "1px dashed #e8e8e8",
                  pointerEvents: "none",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 26,
        background: "#d4520a",
        borderTop: "none",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.9)" }}>Pronto</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>·</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.9)" }}>
          Pág. {activePageIdx + 1} / {pageCount}
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>·</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.9)" }}>{Math.round(zoom)}%</span>
      </div>
    </div>
  );
}
