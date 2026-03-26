import { useRef, useEffect, useState, useCallback } from "react";

interface DocumentEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

// ── Device-aware default zoom ──────────────────────────────────────────────
// A4 page is 794px wide. We compute the ideal zoom so the page fits nicely.
// Offset: some devices need extra breathing room (negative = smaller).
function getAdaptiveZoom(containerWidth: number): number {
  const PAGE_WIDTH = 794; // A4 width in px
  const PADDING = 40;     // horizontal padding around the page

  // Raw fit zoom
  const raw = ((containerWidth - PADDING) / PAGE_WIDTH) * 100;

  // Device-specific corrections (device width → correction offset)
  // itel A70: ~360–375px screen → needs ~-42 correction
  const corrections: Array<{ maxW: number; offset: number }> = [
    { maxW: 380, offset: -42 },  // itel A70, budget Android phones
    { maxW: 400, offset: -32 },  // small Android
    { maxW: 430, offset: -20 },  // iPhone SE / small phones
    { maxW: 480, offset: -10 },  // mid-range phones
    { maxW: 600, offset: 0 },    // large phones
    { maxW: 768, offset: 5 },    // small tablets
    { maxW: 1024, offset: 8 },   // tablets
    { maxW: 99999, offset: 0 },  // desktop
  ];

  const correction = corrections.find((c) => containerWidth <= c.maxW)?.offset ?? 0;
  return Math.max(20, Math.min(200, Math.round(raw + correction)));
}

const CHARS_PER_PAGE = 1800;

export default function DocumentEditor({
  content = "",
  onChange,
  placeholder = "Comece a escrever o seu documento...",
  zoom: externalZoom,
  onZoomChange,
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(externalZoom || 100);
  const [pages, setPages] = useState(1);

  // Pinch-to-zoom state
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  // ── Sync external zoom ──────────────────────────────────────────────────
  useEffect(() => {
    if (externalZoom !== undefined) setZoom(externalZoom);
  }, [externalZoom]);

  // ── Adaptive zoom on mount & resize ────────────────────────────────────
  useEffect(() => {
    if (externalZoom !== undefined) return; // controlled externally
    const recalc = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const adapted = getAdaptiveZoom(w);
      setZoom(adapted);
      onZoomChange?.(adapted);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [externalZoom, onZoomChange]);

  // ── Sync content ────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // ── Page count ──────────────────────────────────────────────────────────
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    setPages(Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE)));
  }, [content]);

  const applyZoom = useCallback(
    (newZoom: number) => {
      const clamped = Math.max(20, Math.min(200, Math.round(newZoom)));
      setZoom(clamped);
      onZoomChange?.(clamped);
    },
    [onZoomChange]
  );

  // ── Pinch-to-zoom (touch) ────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        startDist: Math.hypot(dx, dy),
        startZoom: zoom,
      };
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.startDist;
      applyZoom(pinchRef.current.startZoom * ratio);
    }
  }, [applyZoom]);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  // ── Ctrl+Scroll zoom (desktop) ───────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        applyZoom(zoom + (e.deltaY < 0 ? 10 : -10));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, applyZoom]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); document.execCommand("bold"); }
      if (e.key === "i") { e.preventDefault(); document.execCommand("italic"); }
      if (e.key === "u") { e.preventDefault(); document.execCommand("underline"); }
      if (e.key === "=" && e.shiftKey) { e.preventDefault(); applyZoom(zoom + 10); }
      if (e.key === "-") { e.preventDefault(); applyZoom(zoom - 10); }
      if (e.key === "0") { e.preventDefault(); applyZoom(100); }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden bg-muted/20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      {/* Zoom indicator — tap to reset */}
      <div className="h-9 px-4 bg-secondary/30 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyZoom(zoom - 10)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
            title="Diminuir zoom (Ctrl+-)"
          >
            <img src="/assets/icons/svg/zoom-out.svg" alt="−" style={{ width: 15, height: 15 }} />
          </button>
          <button
            onClick={() => applyZoom(100)}
            className="px-2 h-7 rounded hover:bg-secondary transition-colors font-semibold min-w-[46px] text-center"
            title="Repor zoom"
          >
            {Math.round(zoom)}%
          </button>
          <button
            onClick={() => applyZoom(zoom + 10)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
            title="Aumentar zoom (Ctrl++)"
          >
            <img src="/assets/icons/svg/zoom-in.svg" alt="+" style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <span className="text-xs opacity-60">
          {pages} página{pages > 1 ? "s" : ""} · Ctrl+scroll ou pitada para zoom
        </span>
      </div>

      {/* Page Container */}
      <div className="flex-1 overflow-auto p-5 flex justify-center">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
          }}
        >
          {Array.from({ length: pages }).map((_, pageIndex) => (
            <div key={pageIndex} className="mb-8">
              {/* A4 page */}
              <div
                className="doc-page bg-white rounded-sm"
                style={{
                  width: 794,
                  minHeight: 1123,
                  padding: "94px",
                  boxShadow: "0 1px 6px rgba(0,0,0,.2), 0 4px 20px rgba(0,0,0,.12)",
                }}
              >
                {pageIndex === 0 ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => editorRef.current && onChange?.(editorRef.current.innerHTML)}
                    onKeyDown={handleKeyDown}
                    className={`
                      w-full min-h-full focus:outline-none
                      text-foreground text-base leading-relaxed font-serif
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:font-sans [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
                      [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:font-sans
                      [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:font-sans
                      [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:font-sans
                      [&_p]:mb-4 [&_p]:text-base
                      [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                      [&_li]:mb-2
                      [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:mb-4 [&_blockquote]:text-muted-foreground
                      [&_code]:bg-secondary [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                      [&_pre]:bg-secondary [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:font-mono
                      [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4
                      [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-secondary [&_th]:text-left [&_th]:font-semibold
                      [&_td]:border [&_td]:border-border [&_td]:p-2
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-4
                      [&_hr]:border-border [&_hr]:my-6
                    `}
                    data-placeholder={placeholder}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm text-center pt-8 opacity-40">
                    — Página {pageIndex + 1} —
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-7 px-4 bg-secondary/30 border-t border-border flex items-center text-xs text-muted-foreground gap-3">
        <span>Pronto</span>
        <span>·</span>
        <span>Página 1 de {pages}</span>
        <span>·</span>
        <span>{Math.round(zoom)}% zoom</span>
      </div>
    </div>
  );
}
