import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/* ─────────────────────────────────────────────────────────────────────
   Tipos
   ───────────────────────────────────────────────────────────────── */
interface SettingsPageProps {
  isDark: boolean;
  onBack: () => void;
}

/* ─────────────────────────────────────────────────────────────────────
   Ícones SVG inline
   ───────────────────────────────────────────────────────────────── */
const ICONS: Record<string, (sz: number) => JSX.Element> = {
  "arrow-left": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  "sun": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  "moon": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  "monitor": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  "globe": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  "type": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  "align-left": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"/>
      <line x1="21" y1="6" x2="3" y2="6"/>
      <line x1="21" y1="14" x2="3" y2="14"/>
      <line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  ),
  "file-text": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  "save": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  "printer": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  "download": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
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
  "bell": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  "lock": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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
  "chevron-right": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  "check": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  "info": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  "layout": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  "sliders": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
};

function Ic({ name, size = 18, color = "currentColor", opacity = 1 }: { name: string; size?: number; color?: string; opacity?: number }) {
  const fn = ICONS[name];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color, opacity, width: size, height: size, flexShrink: 0 }}>
      {fn ? fn(size) : null}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Toggle Switch
   ───────────────────────────────────────────────────────────────── */
function Toggle({ value, onChange, isDark }: { value: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 999,
        border: "none", cursor: "pointer",
        background: value ? "#2563EB" : (isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.12)"),
        position: "relative",
        flexShrink: 0,
        transition: "background .2s",
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 3, left: value ? 23 : 3,
        width: 20, height: 20,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.25)",
        transition: "left .2s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Segmented control
   ───────────────────────────────────────────────────────────────── */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  isDark,
}: {
  options: { label: string; value: T; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
  isDark: boolean;
}) {
  const bg     = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)";
  const active = isDark ? "rgba(255,255,255,.14)" : "#ffffff";
  const text   = isDark ? "#e8e8e8" : "#111";
  const sub    = isDark ? "rgba(255,255,255,.38)" : "rgba(0,0,0,.38)";

  return (
    <div style={{ display: "flex", background: bg, borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: "6px 10px", borderRadius: 8, border: "none",
            background: value === opt.value ? active : "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            color: value === opt.value ? text : sub,
            fontSize: ".78rem", fontWeight: value === opt.value ? 600 : 500,
            transition: "all .15s",
            boxShadow: value === opt.value ? (isDark ? "none" : "0 1px 4px rgba(0,0,0,.1)") : "none",
          }}
        >
          {opt.icon && <Ic name={opt.icon} size={13} color={value === opt.value ? text : sub} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Row helpers
   ───────────────────────────────────────────────────────────────── */
function Section({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) {
  const subClr = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.38)";
  const groupBg = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)";
  const groupBorder = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: ".7rem", fontWeight: 600, color: subClr, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, paddingLeft: 4 }}>
        {title}
      </div>
      <div style={{
        background: groupBg,
        border: `1px solid ${groupBorder}`,
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  right,
  danger,
  onClick,
  isDark,
  noBorder,
}: {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  isDark: boolean;
  noBorder?: boolean;
}) {
  const border  = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)";
  const textClr = danger ? "#e05555" : (isDark ? "#e8e8e8" : "#111");
  const subClr  = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.38)";
  const iconClr = danger ? "#e05555" : (isDark ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.6)");
  const hoverBg = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)";

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 13,
        padding: "13px 16px",
        borderTop: noBorder ? "none" : `1px solid ${border}`,
        background: "none",
        border: "none",
        borderTop: noBorder ? "none" : `1px solid ${border}`,
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        textAlign: "left",
        transition: "background .1s",
      } as React.CSSProperties}
      onMouseEnter={onClick ? (e => (e.currentTarget as HTMLElement).style.background = hoverBg) : undefined}
      onMouseLeave={onClick ? (e => (e.currentTarget as HTMLElement).style.background = "none") : undefined}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: danger
          ? "rgba(224,85,85,.12)"
          : (isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"),
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Ic name={icon} size={15} color={iconClr} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: ".875rem", fontWeight: 500, color: textClr }}>{label}</div>
        {sub && <div style={{ fontSize: ".75rem", color: subClr, marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      {onClick && !right && <Ic name="chevron-right" size={15} color={subClr} />}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SettingsPage
   ───────────────────────────────────────────────────────────────── */
export default function SettingsPage({ isDark, onBack }: SettingsPageProps) {
  const { setTheme } = useTheme();

  /* Estado local das preferências */
  const [themeMode,        setThemeMode]        = useState<"light" | "dark" | "system">("system");
  const [language,         setLanguage]         = useState<"pt" | "en" | "es">("pt");
  const [fontSize,         setFontSize]         = useState<"small" | "medium" | "large">("medium");
  const [lineSpacing,      setLineSpacing]       = useState<"compact" | "normal" | "relaxed">("normal");
  const [pageFormat,       setPageFormat]        = useState<"a4" | "letter" | "a5">("a4");
  const [defaultFont,      setDefaultFont]       = useState<"georgia" | "sans" | "mono">("georgia");
  const [autoSave,         setAutoSave]          = useState(true);
  const [spellCheck,       setSpellCheck]        = useState(true);
  const [pageNumbers,      setPageNumbers]       = useState(true);
  const [wordCount,        setWordCount]         = useState(true);
  const [notifications,    setNotifications]     = useState(false);
  const [exportWithStyles, setExportWithStyles]  = useState(true);
  const [compactMode,      setCompactMode]       = useState(false);
  const [rulers,           setRulers]            = useState(false);

  /* Aplicar tema ao seleccionar */
  const applyTheme = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(mode);
    }
  };

  const bg       = isDark ? "#0f0f0f" : "#f4f4f4";
  const appBarBg = isDark ? "rgba(14,14,14,0.97)" : "#ffffff";
  const titleClr = isDark ? "#f0f0f0" : "#111";
  const subClr   = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.38)";
  const shadow   = isDark
    ? "0 1px 0 rgba(255,255,255,.06)"
    : "0 1px 0 rgba(0,0,0,.07), 0 2px 10px rgba(0,0,0,.03)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bg, overflow: "hidden" }}>

      {/* AppBar */}
      <div style={{
        height: 52, flexShrink: 0,
        display: "flex", alignItems: "center",
        padding: "0 16px",
        background: appBarBg,
        boxShadow: shadow,
        gap: 8,
      }}>
        {/* Botão voltar — apenas ícone, sem container */}
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none",
            cursor: "pointer", padding: 4,
            color: isDark ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.65)",
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <Ic name="arrow-left" size={22} color={isDark ? "rgba(255,255,255,.82)" : "rgba(0,0,0,.72)"} />
        </button>

        <div>
          <div style={{ fontSize: ".9rem", fontWeight: 700, color: titleClr, lineHeight: 1.2 }}>Definições</div>
          <div style={{ fontSize: ".68rem", color: subClr, fontWeight: 500 }}>Doction</div>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 40px" }}>

        {/* ── Aparência ── */}
        <Section title="Aparência" isDark={isDark}>
          <Row
            icon="sun"
            label="Tema"
            sub={themeMode === "light" ? "Claro" : themeMode === "dark" ? "Escuro" : "Sistema"}
            isDark={isDark}
            noBorder
            right={
              <Segmented
                options={[
                  { label: "Claro", value: "light", icon: "sun" },
                  { label: "Escuro", value: "dark", icon: "moon" },
                  { label: "Auto", value: "system", icon: "monitor" },
                ]}
                value={themeMode}
                onChange={applyTheme}
                isDark={isDark}
              />
            }
          />
          <Row
            icon="layout"
            label="Modo compacto"
            sub="Interface mais densa e com menos espaçamento"
            isDark={isDark}
            right={<Toggle value={compactMode} onChange={setCompactMode} isDark={isDark} />}
          />
          <Row
            icon="sliders"
            label="Réguas"
            sub="Mostrar réguas no editor"
            isDark={isDark}
            right={<Toggle value={rulers} onChange={setRulers} isDark={isDark} />}
          />
        </Section>

        {/* ── Idioma ── */}
        <Section title="Idioma e região" isDark={isDark}>
          <Row
            icon="globe"
            label="Idioma da interface"
            sub={language === "pt" ? "Português (Portugal)" : language === "en" ? "English" : "Español"}
            isDark={isDark}
            noBorder
            right={
              <Segmented
                options={[
                  { label: "PT", value: "pt" },
                  { label: "EN", value: "en" },
                  { label: "ES", value: "es" },
                ]}
                value={language}
                onChange={setLanguage}
                isDark={isDark}
              />
            }
          />
        </Section>

        {/* ── Documento ── */}
        <Section title="Documento" isDark={isDark}>
          <Row
            icon="type"
            label="Tamanho de letra padrão"
            sub={fontSize === "small" ? "Pequeno (12pt)" : fontSize === "medium" ? "Médio (14pt)" : "Grande (16pt)"}
            isDark={isDark}
            noBorder
            right={
              <Segmented
                options={[
                  { label: "P", value: "small" },
                  { label: "M", value: "medium" },
                  { label: "G", value: "large" },
                ]}
                value={fontSize}
                onChange={setFontSize}
                isDark={isDark}
              />
            }
          />
          <Row
            icon="align-left"
            label="Espaçamento de linhas"
            sub={lineSpacing === "compact" ? "Compacto (1.3)" : lineSpacing === "normal" ? "Normal (1.6)" : "Espaçado (2.0)"}
            isDark={isDark}
            right={
              <Segmented
                options={[
                  { label: "Compacto", value: "compact" },
                  { label: "Normal", value: "normal" },
                  { label: "Espaçado", value: "relaxed" },
                ]}
                value={lineSpacing}
                onChange={setLineSpacing}
                isDark={isDark}
              />
            }
          />
          <Row
            icon="file-text"
            label="Formato de página"
            sub={pageFormat === "a4" ? "A4 (210×297 mm)" : pageFormat === "letter" ? "Letter (216×279 mm)" : "A5 (148×210 mm)"}
            isDark={isDark}
            right={
              <Segmented
                options={[
                  { label: "A4", value: "a4" },
                  { label: "Letter", value: "letter" },
                  { label: "A5", value: "a5" },
                ]}
                value={pageFormat}
                onChange={setPageFormat}
                isDark={isDark}
              />
            }
          />
          <Row
            icon="type"
            label="Família tipográfica"
            sub={defaultFont === "georgia" ? "Georgia (Serif)" : defaultFont === "sans" ? "Sans-Serif" : "Monospace"}
            isDark={isDark}
            right={
              <Segmented
                options={[
                  { label: "Serif", value: "georgia" },
                  { label: "Sans", value: "sans" },
                  { label: "Mono", value: "mono" },
                ]}
                value={defaultFont}
                onChange={setDefaultFont}
                isDark={isDark}
              />
            }
          />
        </Section>

        {/* ── Edição ── */}
        <Section title="Edição" isDark={isDark}>
          <Row
            icon="save"
            label="Guardar automaticamente"
            sub="Guarda o documento enquanto escreve"
            isDark={isDark}
            noBorder
            right={<Toggle value={autoSave} onChange={setAutoSave} isDark={isDark} />}
          />
          <Row
            icon="check"
            label="Verificação ortográfica"
            sub="Sublinha palavras com erros"
            isDark={isDark}
            right={<Toggle value={spellCheck} onChange={setSpellCheck} isDark={isDark} />}
          />
          <Row
            icon="file-text"
            label="Números de página"
            sub="Mostra o número de página no rodapé"
            isDark={isDark}
            right={<Toggle value={pageNumbers} onChange={setPageNumbers} isDark={isDark} />}
          />
          <Row
            icon="info"
            label="Contagem de palavras"
            sub="Mostra o contador na barra de estado"
            isDark={isDark}
            right={<Toggle value={wordCount} onChange={setWordCount} isDark={isDark} />}
          />
        </Section>

        {/* ── Exportação ── */}
        <Section title="Exportação" isDark={isDark}>
          <Row
            icon="download"
            label="Exportar com estilos"
            sub="Inclui CSS e formatação no ficheiro exportado"
            isDark={isDark}
            noBorder
            right={<Toggle value={exportWithStyles} onChange={setExportWithStyles} isDark={isDark} />}
          />
          <Row
            icon="printer"
            label="Imprimir"
            sub="Abre o diálogo de impressão"
            isDark={isDark}
            onClick={() => window.print()}
          />
        </Section>

        {/* ── Notificações ── */}
        <Section title="Notificações" isDark={isDark}>
          <Row
            icon="bell"
            label="Notificações"
            sub="Alertas de actualização e novidades"
            isDark={isDark}
            noBorder
            right={<Toggle value={notifications} onChange={setNotifications} isDark={isDark} />}
          />
        </Section>

        {/* ── Partilha ── */}
        <Section title="Partilha e privacidade" isDark={isDark}>
          <Row
            icon="share"
            label="Partilhar Doction"
            sub="Recomendar a um amigo"
            isDark={isDark}
            noBorder
            onClick={() => {
              if (navigator.share) navigator.share({ title: "Doction", url: window.location.origin }).catch(() => {});
              else alert("Partilha não disponível neste dispositivo.");
            }}
          />
          <Row
            icon="lock"
            label="Política de privacidade"
            isDark={isDark}
            onClick={() => {}}
          />
        </Section>

        {/* ── Zona de perigo ── */}
        <Section title="Zona de perigo" isDark={isDark}>
          <Row
            icon="trash"
            label="Limpar todos os documentos"
            sub="Remove permanentemente todos os documentos guardados"
            isDark={isDark}
            noBorder
            danger
            onClick={() => {
              if (window.confirm("Tem a certeza? Esta acção é irreversível.")) {
                localStorage.clear();
              }
            }}
          />
        </Section>

        {/* Versão */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: ".72rem", color: isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)", fontWeight: 500 }}>
            Doction v1.0.0 · Feito em Portugal 🇵🇹
          </span>
        </div>
      </div>
    </div>
  );
}
