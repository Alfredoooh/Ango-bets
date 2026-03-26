import { useRef, useEffect, useState, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface DocumentEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  isMobile?: boolean;
}

// ── A4 dimensions ──────────────────────────────────────────────────────────────
const A4_W = 794;   // px
const A4_H = 1123;  // px
const PAGE_PAD_H = 80; // px top+bottom padding each side
const PAGE_PAD_V = 94; // px left+right padding each side
const CONTENT_H = A4_H - PAGE_PAD_H * 2;  // usable content height per page
const LINE_H = 28; // px per line (approx at 16px font, 1.6 line-height)
const LINES_PER_PAGE = Math.floor(CONTENT_H / LINE_H); // ~34 lines

// ── Device zoom calibration ────────────────────────────────────────────────────
// Maps container width → optimal zoom so the page fits with breathing room
function getAdaptiveZoom(containerWidth: number): number {
  // A4 page + padding we want around it
  const target = A4_W + 48;
  let raw = (containerWidth / target) * 100;
  // Device-specific corrections
  if (containerWidth <= 375) raw -= 44;       // itel A70, budget phones (360–375px)
  else if (containerWidth <= 390) raw -= 36;  // iPhone SE
  else if (containerWidth <= 430) raw -= 24;  // iPhone Pro
  else if (containerWidth <= 480) raw -= 14;  // large phones
  else if (containerWidth <= 600) raw -= 6;   // phablets
  else if (containerWidth <= 768) raw += 0;   // small tablets
  else raw += 2;                              // desktop
  return Math.max(18, Math.min(200, Math.round(raw)));
}

export default function DocumentEditor({
  content = "",
  onChange,
  placeholder = "Comece a escrever aqui...",
  zoom: externalZoom,
  onZoomChange,
  isMobile = false,
}: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [zoom, setZoom] = useState(externalZoom ?? 100);
  const [pageCount, setPageCount] = useState(1);
  const [pages, setPages] = useState<string[]>([""]);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const isComposing = useRef(false);

  // ── Sync external zoom ────────────────────────────────────────────────────
  useEffect(() => {
    if (externalZoom !== undefined) setZoom(externalZoom);
  }, [externalZoom]);

  // ── Adaptive zoom on mount & resize ──────────────────────────────────────
  useEffect(() => {
    if (externalZoom !== undefined) return;
    const recalc = () => {
      if (!containerRef.current) return;
      const z = getAdaptiveZoom(containerRef.current.clientWidth);
      setZoom(z);
      onZoomChange?.(z);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [externalZoom, onZoomChange]);

  const applyZoom = useCallback((v: number) => {
    const z = Math.max(18, Math.min(200, Math.round(v)));
    setZoom(z);
    onZoomChange?.(z);
  }, [onZoomChange]);

  // ── Pinch-to-zoom ─────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchRef.current = { startDist: d, startZoom: zoom };
    }
  }, [zoom]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      applyZoom(pinchRef.current.startZoom * (d / pinchRef.current.startDist));
    }
  }, [applyZoom]);

  // ── Ctrl+wheel zoom ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        applyZoom(zoom + (e.deltaY < 0 ? 10 : -10));
      }
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [zoom, applyZoom]);

  // ── Page overflow logic ───────────────────────────────────────────────────
  // Called after each input to detect overflow and split into pages
  const reflowPages = useCallback(() => {
    const els = pageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    let overflowed = false;
    const newPages = [...pages];

    els.forEach((el, idx) => {
      if (!el) return;
      const maxH = CONTENT_H;
      if (el.scrollHeight > maxH + 10) {
        // Find the last child that fits
        overflowed = true;
        const children = Array.from(el.childNodes);
        let accumulated = 0;
        let splitIdx = children.length;

        // Binary search: find where content overflows
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          const h = child.nodeType === Node.ELEMENT_NODE
            ? (child as HTMLElement).offsetHeight
            : LINE_H;
          if (accumulated + h > maxH) {
            splitIdx = i;
            break;
          }
          accumulated += h;
        }

        // Split: keep first part, move rest to next page
        const keepNodes = children.slice(0, splitIdx);
        const spillNodes = children.slice(splitIdx);

        const keepHTML = keepNodes.map(n =>
          n.nodeType === Node.TEXT_NODE
            ? n.textContent || ""
            : (n as HTMLElement).outerHTML
        ).join("");

        const spillHTML = spillNodes.map(n =>
          n.nodeType === Node.TEXT_NODE
            ? n.textContent || ""
            : (n as HTMLElement).outerHTML
        ).join("");

        newPages[idx] = keepHTML;
        if (idx + 1 < newPages.length) {
          newPages[idx + 1] = spillHTML + newPages[idx + 1];
        } else {
          newPages.push(spillHTML);
        }

        el.innerHTML = keepHTML;
      }
    });

    if (overflowed) {
      setPages(newPages);
      setPageCount(newPages.length);
      // Emit combined content
      onChange?.(newPages.join('<div class="page-break"></div>'));
    }
  }, [pages, onChange]);

  // ── Handle input on a specific page ──────────────────────────────────────
  const handleInput = useCallback((idx: number) => {
    const el = pageRefs.current[idx];
    if (!el || isComposing.current) return;
    const newPages = [...pages];
    newPages[idx] = el.innerHTML;
    setPages(newPages);
    onChange?.(newPages.join('<div class="page-break"></div>'));

    // Check overflow with slight delay
    requestAnimationFrame(() => reflowPages());
  }, [pages, onChange, reflowPages]);

  // ── Init content from prop ────────────────────────────────────────────────
  useEffect(() => {
    if (!content) return;
    const parts = content.split('<div class="page-break"></div>');
    setPages(parts.length ? parts : [""]);
    setPageCount(parts.length || 1);
  }, []); // only on mount

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "\u00a0\u00a0\u00a0\u00a0");
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "=") { e.preventDefault(); applyZoom(zoom + 10); }
      if (e.key === "-") { e.preventDefault(); applyZoom(zoom - 10); }
      if (e.key === "0") { e.preventDefault(); applyZoom(100); }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "var(--warm, #f3ede3)" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { pinchRef.current = null; }}
    >
      {/* Zoom bar */}
      <div style={{
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--cream, #faf8f4)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); applyZoom(zoom - 10); }}
            className="native-btn"
            style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            data-tooltip="Diminuir zoom"
          >
            <ZoomOut size={14} style={{ color: "var(--muted-foreground)" }} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); applyZoom(100); }}
            className="native-btn"
            style={{
              minWidth: 52, height: 24, borderRadius: 6, border: "1px solid var(--border)",
              background: "var(--cream)", cursor: "pointer",
              fontSize: ".72rem", fontWeight: 600, color: "var(--foreground)",
            }}
          >
            {Math.round(zoom)}%
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); applyZoom(zoom + 10); }}
            className="native-btn"
            style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            data-tooltip="Aumentar zoom"
          >
            <ZoomIn size={14} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
        <span style={{ fontSize: ".67rem", color: "var(--muted-foreground)", opacity: .7 }}>
          {pageCount} pág · pitada p/ zoom
        </span>
      </div>

      {/* Pages scroll area */}
      <div
        className="flex-1 overflow-auto toolbar-scroll"
        style={{ padding: isMobile ? "16px 8px 80px" : "24px 16px 32px" }}
      >
        <div style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          transition: "transform .15s cubic-bezier(.25,.46,.45,.94)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}>
          {pages.map((pageContent, idx) => (
            <div
              key={idx}
              className="doc-paper"
              style={{
                width: A4_W,
                minHeight: A4_H,
                background: "#fff",
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
                animation: idx > 0 ? "pageFlip .3s ease" : undefined,
              }}
            >
              {/* Page number */}
              {idx > 0 && (
                <div style={{
                  position: "absolute", top: 24, right: PAGE_PAD_V,
                  fontSize: ".68rem", color: "#ccc", fontFamily: "Georgia, serif",
                }}>
                  {idx + 1}
                </div>
              )}

              {/* Content area */}
              <div
                ref={(el) => { pageRefs.current[idx] = el; }}
                contentEditable
                suppressContentEditableWarning
                onInput={() => handleInput(idx)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; handleInput(idx); }}
                data-placeholder={idx === 0 ? placeholder : ""}
                style={{
                  padding: `${PAGE_PAD_H}px ${PAGE_PAD_V}px`,
                  minHeight: A4_H,
                  maxHeight: A4_H,
                  overflow: "hidden",
                  outline: "none",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 16,
                  lineHeight: "1.75",
                  color: "#0e0c09",
                  wordBreak: "break-word",
                  // Text formatting classes applied via execCommand
                }}
                dangerouslySetInnerHTML={{ __html: pageContent }}
              />

              {/* Page overflow indicator */}
              {idx < pages.length - 1 && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 3, background: "linear-gradient(90deg, var(--brand), var(--brand-hover))",
                  opacity: .4,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 28, display: "flex", alignItems: "center", gap: 12,
        padding: "0 14px", borderTop: "1px solid var(--border)",
        background: "var(--cream)", flexShrink: 0,
        fontSize: ".67rem", color: "var(--muted-foreground)",
      }}>
        <span>Pág 1 de {pageCount}</span>
        <span>·</span>
        <span>{Math.round(zoom)}% zoom</span>
        <span>·</span>
        <span>{LINES_PER_PAGE} linhas/pág</span>
      </div>
    </div>
  );
}
