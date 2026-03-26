import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  Undo2,
  Redo2,
  Save,
  FileText,
  Download,
  Share2,
  Trash2,
  Plus,
  Palette,
  Type,
  Code,
  Quote,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
} from "lucide-react";

interface EditorToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrikethrough?: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignJustify?: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onLink: () => void;
  onImage: () => void;
  onTable: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onDownload: () => void;
  onShare: () => void;
  onHeading1?: () => void;
  onHeading2?: () => void;
  onHeading3?: () => void;
  onCode?: () => void;
  onQuote?: () => void;
  onHighlight?: () => void;
  onSuperscript?: () => void;
  onSubscript?: () => void;
  onClearFormatting?: () => void;
  onExportPDF?: () => void;
  onAddNote?: () => void;
  onColorPicker?: () => void;
}

export default function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignJustify,
  onBulletList,
  onNumberedList,
  onLink,
  onImage,
  onTable,
  onSave,
  onUndo,
  onRedo,
  onNewDocument,
  onOpenDocument,
  onDownload,
  onShare,
  onHeading1,
  onHeading2,
  onHeading3,
  onCode,
  onQuote,
  onHighlight,
  onSuperscript,
  onSubscript,
  onClearFormatting,
  onExportPDF,
  onAddNote,
  onColorPicker,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col bg-background border-b border-border">
      {/* Top Bar - File Operations */}
      <div className="flex items-center h-12 px-2 sm:px-4 gap-1 overflow-x-auto bg-secondary/20 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Ficheiro</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onNewDocument} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenDocument} className="gap-2">
              <FileText className="w-4 h-4" />
              Abrir Documento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Transferir TXT
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Partilhar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          title="Desfazer (Ctrl+Z)"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          title="Refazer (Ctrl+Y)"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Save Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Guardar</span>
        </Button>
      </div>

      {/* Format Bar - Text Formatting */}
      <div className="flex items-center h-12 px-2 sm:px-4 gap-1 overflow-x-auto bg-background">
        {/* Text Styles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              title="Estilos de texto"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Estilo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onHeading1} className="gap-2">
              <Heading1 className="w-4 h-4" />
              Título 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHeading2} className="gap-2">
              <Heading2 className="w-4 h-4" />
              Título 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHeading3} className="gap-2">
              <Heading3 className="w-4 h-4" />
              Título 3
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => document.execCommand("formatBlock", false, "<p>")}
              className="gap-2"
            >
              Parágrafo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBold}
          title="Negrito (Ctrl+B)"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onItalic}
          title="Itálico (Ctrl+I)"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnderline}
          title="Sublinhado (Ctrl+U)"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onStrikethrough || (() => document.execCommand("strikethrough"))}
          title="Riscado"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Colors */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              title="Cor do texto"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <div className="grid grid-cols-6 gap-2 p-2">
              {[
                "#000000",
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#FFA500",
                "#800080",
                "#FFC0CB",
                "#A52A2A",
                "#808080",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => document.execCommand("foreColor", false, color)}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onHighlight || (() => document.execCommand("hiliteColor", false, "yellow"))}
          title="Destaque"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Highlighter className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAlignLeft}
          title="Alinhar à esquerda"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAlignCenter}
          title="Alinhar ao centro"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAlignRight}
          title="Alinhar à direita"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAlignJustify || (() => document.execCommand("justifyFull"))}
          title="Justificar"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBulletList}
          title="Lista com marcadores"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNumberedList}
          title="Lista numerada"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        {/* Indent */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.execCommand("indent")}
          title="Aumentar indentação"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.execCommand("outdent")}
          title="Diminuir indentação"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Insert Elements */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLink}
          title="Inserir ligação"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onImage}
          title="Inserir imagem"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Image className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTable}
          title="Inserir tabela"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Table className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCode || (() => document.execCommand("formatBlock", false, "<pre>"))}
          title="Bloco de código"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onQuote || (() => document.execCommand("formatBlock", false, "<blockquote>"))}
          title="Citação"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Advanced */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs"
            >
              Mais
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onSuperscript || (() => document.execCommand("superscript"))}
              className="gap-2"
            >
              Sobrescrito
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSubscript || (() => document.execCommand("subscript"))}
              className="gap-2"
            >
              Subscrito
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearFormatting || (() => document.execCommand("removeFormat"))}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Formatação
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => document.execCommand("insertHorizontalRule")}
              className="gap-2"
            >
              Linha Horizontal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const text = prompt("Introduza o texto especial:");
                if (text) document.execCommand("insertHTML", false, text);
              }}
              className="gap-2"
            >
              Símbolo Especial
            </DropdownMenuItem>
            {onColorPicker && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onColorPicker} className="gap-2">
                  🎨 Seletor de Cores
                </DropdownMenuItem>
              </>
            )}
            {onAddNote && (
              <DropdownMenuItem onClick={onAddNote} className="gap-2">
                📝 Adicionar Nota
              </DropdownMenuItem>
            )}
            {onExportPDF && (
              <DropdownMenuItem onClick={onExportPDF} className="gap-2">
                📄 Exportar PDF
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
