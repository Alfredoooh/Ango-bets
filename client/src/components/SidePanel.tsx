import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Clock,
  Share2,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface SidePanelProps {
  documentName?: string;
  lastModified?: string;
  wordCount?: number;
  characterCount?: number;
  onDocumentNameChange?: (name: string) => void;
  onShare?: () => void;
  onSettings?: () => void;
}

export default function SidePanel({
  documentName = "Documento sem título",
  lastModified = "Agora",
  wordCount = 0,
  characterCount = 0,
  onDocumentNameChange,
  onShare,
  onSettings,
}: SidePanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    formatting: false,
    sharing: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="hidden lg:flex lg:w-72 border-l border-border bg-background flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm sm:text-base">Propriedades</h2>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Document Info Section */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("info")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Informações
              </span>
            </div>
            {expandedSections.info ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.info && (
            <div className="px-4 py-3 space-y-3 bg-secondary/20">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Nome do Documento
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => onDocumentNameChange?.(e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nome do documento"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Palavras
                  </label>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {wordCount}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Caracteres
                  </label>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {characterCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Modificado: {lastModified}</span>
              </div>
            </div>
          )}
        </div>

        {/* Formatting Options Section */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("formatting")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">
              Formatação
            </span>
            {expandedSections.formatting ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.formatting && (
            <div className="px-4 py-3 space-y-2 bg-secondary/20">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Tamanho da Fonte
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>10pt</option>
                  <option>11pt</option>
                  <option selected>12pt</option>
                  <option>14pt</option>
                  <option>16pt</option>
                  <option>18pt</option>
                  <option>20pt</option>
                  <option>24pt</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Família de Fontes
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option selected>Calibri</option>
                  <option>Arial</option>
                  <option>Times New Roman</option>
                  <option>Courier New</option>
                  <option>Georgia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Espaçamento
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Simples</option>
                  <option selected>1.5 linhas</option>
                  <option>Duplo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sharing Section */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("sharing")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Partilha
              </span>
            </div>
            {expandedSections.sharing ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.sharing && (
            <div className="px-4 py-3 space-y-2 bg-secondary/20">
              <Button
                onClick={onShare}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Share2 className="w-4 h-4" />
                Partilhar Documento
              </Button>
              <p className="text-xs text-muted-foreground">
                Partilhe este documento com outras pessoas para colaboração em
                tempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
