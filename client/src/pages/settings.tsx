import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsProps {
  onBack: () => void;
  isMobile?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────
   Lucide SVG fallbacks
   ───────────────────────────────────────────────────────────────── */
const LUCIDE: Record<string, (sz: number) => JSX.Element> = {
  "arrow-left": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  "moon": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
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
  "file-text": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  "cloud": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  "bell": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  "shield": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  "info": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  "check": (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

function Icon({
  src,
  fallback,
  size = 20,
  color = "currentColor",
}: {
  src?: string;
  fallback: string;
  size?: number;
  color?: string;
}) {
  const [useFallback, setUseFallback] = useState(!src);

  const fn = LUCIDE[fallback];
  if (useFallback || !src) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color, width: size, height: size }}>
        {fn ? fn(size) : null}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setUseFallback(true)}
      style={{ display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Toggle Switch
   ───────────────────────────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  isDark,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  isDark: boolean;
}) {
  const bgOff = isDark ? "#333" : "#d0d0d0";
  const bgOn = "#1a1a1a";

  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        background: checked ? bgOn : bgOff,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Select Dropdown
   ───────────────────────────────────────────────────────────────── */
function Select({
  value,
  options,
  onChange,
  isDark,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  isDark: boolean;
}) {
  const selectBg = isDark ? "#1a1a1a" : "#f4f4f4";
  const selectClr = isDark ? "#e0e0e0" : "#1a1a1a";
  const selectBdr = isDark ? "#2a2a2a" : "#e0e0e0";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${selectBdr}`,
        background: selectBg,
        color: selectClr,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Settings Component
   ───────────────────────────────────────────────────────────────── */
export default function Settings({ onBack, isMobile = false }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  // Estados das configurações
  const [language, setLanguage] = useState("pt");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("georgia");
  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageSize, setPageSize] = useState("a4");
  const [margins, setMargins] = useState("normal");

  // Theme colors
  const bg = isDark ? "#000" : "#fafafa";
  const cardBg = isDark ? "#0a0a0a" : "#fff";
  const textPrimary = isDark ? "#e0e0e0" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#666";
  const border = isDark ? "#1a1a1a" : "#e0e0e0";
  const headerBg = isDark ? "#0a0a0a" : "#fff";

  interface SettingRow {
    icon?: string;
    lucideIcon?: string;
    label: string;
    description?: string;
    control: JSX.Element;
  }

  interface SettingSection {
    title: string;
    icon?: string;
    lucideIcon?: string;
    rows: SettingRow[];
  }

  const sections: SettingSection[] = [
    {
      title: "Aparência",
      icon: "/assets/icons/svg/sun.svg",
      lucideIcon: "sun",
      rows: [
        {
          icon: "/assets/icons/svg/moon.svg",
          lucideIcon: "moon",
          label: "Tema escuro",
          description: "Ativar modo escuro para reduzir o cansaço visual",
          control: (
            <Toggle
              checked={isDark}
              onChange={(val) => setTheme(val ? "dark" : "light")}
              isDark={isDark}
            />
          ),
        },
        {
          icon: "/assets/icons/svg/type.svg",
          lucideIcon: "type",
          label: "Tamanho da letra",
          description: "Ajustar tamanho padrão do texto",
          control: (
            <Select
              value={fontSize}
              options={[
                { value: "12", label: "Pequeno (12px)" },
                { value: "14", label: "Normal (14px)" },
                { value: "16", label: "Grande (16px)" },
                { value: "18", label: "Muito grande (18px)" },
              ]}
              onChange={setFontSize}
              isDark={isDark}
            />
          ),
        },
        {
          icon: "/assets/icons/svg/type.svg",
          lucideIcon: "type",
          label: "Fonte padrão",
          description: "Escolher tipo de letra para documentos",
          control: (
            <Select
              value={fontFamily}
              options={[
                { value: "georgia", label: "Georgia (Serif)" },
                { value: "arial", label: "Arial (Sans-serif)" },
                { value: "times", label: "Times New Roman" },
                { value: "helvetica", label: "Helvetica" },
                { value: "courier", label: "Courier (Mono)" },
              ]}
              onChange={setFontFamily}
              isDark={isDark}
            />
          ),
        },
      ],
    },
    {
      title: "Idioma e Região",
      icon: "/assets/icons/svg/globe.svg",
      lucideIcon: "globe",
      rows: [
        {
          icon: "/assets/icons/svg/globe.svg",
          lucideIcon: "globe",
          label: "Idioma da interface",
          description: "Alterar idioma do aplicativo",
          control: (
            <Select
              value={language}
              options={[
                { value: "pt", label: "Português (PT)" },
                { value: "pt-br", label: "Português (BR)" },
                { value: "en", label: "English" },
                { value: "es", label: "Español" },
                { value: "fr", label: "Français" },
              ]}
              onChange={setLanguage}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "check",
          label: "Verificação ortográfica",
          description: "Detetar erros ortográficos durante a escrita",
          control: (
            <Toggle
              checked={spellCheck}
              onChange={setSpellCheck}
              isDark={isDark}
            />
          ),
        },
      ],
    },
    {
      title: "Documentos",
      icon: "/assets/icons/svg/file-text.svg",
      lucideIcon: "file-text",
      rows: [
        {
          lucideIcon: "check",
          label: "Gravação automática",
          description: "Guardar alterações automaticamente",
          control: (
            <Toggle
              checked={autoSave}
              onChange={setAutoSave}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "check",
          label: "Mostrar números de linha",
          description: "Exibir numeração nas linhas do documento",
          control: (
            <Toggle
              checked={showLineNumbers}
              onChange={setShowLineNumbers}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "check",
          label: "Quebra de linha automática",
          description: "Ajustar texto automaticamente à largura",
          control: (
            <Toggle
              checked={wordWrap}
              onChange={setWordWrap}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "file-text",
          label: "Orientação da página",
          description: "Vertical ou horizontal",
          control: (
            <Select
              value={pageOrientation}
              options={[
                { value: "portrait", label: "Vertical" },
                { value: "landscape", label: "Horizontal" },
              ]}
              onChange={setPageOrientation}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "file-text",
          label: "Tamanho da página",
          description: "Formato padrão do papel",
          control: (
            <Select
              value={pageSize}
              options={[
                { value: "a4", label: "A4 (210 × 297 mm)" },
                { value: "letter", label: "Letter (216 × 279 mm)" },
                { value: "legal", label: "Legal (216 × 356 mm)" },
                { value: "a5", label: "A5 (148 × 210 mm)" },
              ]}
              onChange={setPageSize}
              isDark={isDark}
            />
          ),
        },
        {
          lucideIcon: "file-text",
          label: "Margens",
          description: "Espaçamento nas bordas da página",
          control: (
            <Select
              value={margins}
              options={[
                { value: "narrow", label: "Estreitas (1.27 cm)" },
                { value: "normal", label: "Normais (2.54 cm)" },
                { value: "wide", label: "Largas (3.81 cm)" },
              ]}
              onChange={setMargins}
              isDark={isDark}
            />
          ),
        },
      ],
    },
    {
      title: "Sincronização e Nuvem",
      icon: "/assets/icons/svg/cloud.svg",
      lucideIcon: "cloud",
      rows: [
        {
          icon: "/assets/icons/svg/cloud.svg",
          lucideIcon: "cloud",
          label: "Sincronização na nuvem",
          description: "Guardar documentos automaticamente na nuvem",
          control: (
            <Toggle
              checked={cloudSync}
              onChange={setCloudSync}
              isDark={isDark}
            />
          ),
        },
      ],
    },
    {
      title: "Notificações",
      icon: "/assets/icons/svg/bell.svg",
      lucideIcon: "bell",
      rows: [
        {
          icon: "/assets/icons/svg/bell.svg",
          lucideIcon: "bell",
          label: "Notificações push",
          description: "Receber alertas sobre alterações e partilhas",
          control: (
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              isDark={isDark}
            />
          ),
        },
      ],
    },
    {
      title: "Privacidade e Segurança",
      icon: "/assets/icons/svg/shield.svg",
      lucideIcon: "shield",
      rows: [
        {
          lucideIcon: "shield",
          label: "Encriptação de ponta a ponta",
          description: "Proteger documentos com encriptação",
          control: (
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: isDark ? "#1a1a1a" : "#1a1a1a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ativar
            </button>
          ),
        },
      ],
    },
    {
      title: "Sobre",
      icon: "/assets/icons/svg/info.svg",
      lucideIcon: "info",
      rows: [
        {
          lucideIcon: "info",
          label: "Versão",
          description: "Doction 1.0.0",
          control: <div />,
        },
        {
          lucideIcon: "info",
          label: "Termos de Serviço",
          description: "Ler os termos de utilização",
          control: (
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: "none",
                color: textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ver
            </button>
          ),
        },
        {
          lucideIcon: "info",
          label: "Política de Privacidade",
          description: "Como tratamos os teus dados",
          control: (
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: "none",
                color: textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ver
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: bg,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header fixo */}
      <div style={{
        height: 56,
        background: headerBg,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Botão voltar SEM container */}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: textPrimary,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
          }}
        >
          <Icon src="/assets/icons/svg/arrow-left.svg" fallback="arrow-left" size={20} />
        </button>

        <h1 style={{
          fontSize: isMobile ? 18 : 20,
          fontWeight: 700,
          color: textPrimary,
          margin: 0,
        }}>
          Configurações
        </h1>
      </div>

      {/* Content scrollável */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: isMobile ? "20px 16px" : "32px",
      }}>
        <div style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
          {sections.map((section, sectionIdx) => (
            <div
              key={sectionIdx}
              style={{
                background: cardBg,
                borderRadius: 16,
                border: `1px solid ${border}`,
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                {section.icon && (
                  <Icon
                    src={section.icon}
                    fallback={section.lucideIcon || "info"}
                    size={20}
                    color={textPrimary}
                  />
                )}
                <h2 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: textPrimary,
                  margin: 0,
                }}>
                  {section.title}
                </h2>
              </div>

              {/* Section rows */}
              <div>
                {section.rows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "16px 20px",
                      borderBottom: rowIdx < section.rows.length - 1 ? `1px solid ${border}` : "none",
                    }}
                  >
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}>
                      {row.icon && (
                        <Icon
                          src={row.icon}
                          fallback={row.lucideIcon || "info"}
                          size={18}
                          color={textSecondary}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: textPrimary,
                          marginBottom: row.description ? 2 : 0,
                        }}>
                          {row.label}
                        </div>
                        {row.description && (
                          <div style={{
                            fontSize: 12,
                            color: textSecondary,
                            lineHeight: 1.4,
                          }}>
                            {row.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {row.control}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
