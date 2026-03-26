import { useState, useEffect } from "react";
import EditorToolbar from "@/components/EditorToolbar";
import DocumentEditor from "@/components/DocumentEditor";
import SidePanel from "@/components/SidePanel";
import LinkDialog from "@/components/LinkDialog";
import TableDialog from "@/components/TableDialog";
import ImageDialog from "@/components/ImageDialog";
import { toast } from "sonner";

export default function Home() {
  const [documentName, setDocumentName] = useState("Documento sem título");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastModified, setLastModified] = useState("Agora");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // Calculate word and character count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const chars = text.length;

    setWordCount(words);
    setCharacterCount(chars);
    setLastModified("Agora");
  }, [content]);

  // Handle toolbar actions
  const handleBold = () => {
    document.execCommand("bold");
  };

  const handleItalic = () => {
    document.execCommand("italic");
  };

  const handleUnderline = () => {
    document.execCommand("underline");
  };

  const handleAlignLeft = () => {
    document.execCommand("justifyLeft");
  };

  const handleAlignCenter = () => {
    document.execCommand("justifyCenter");
  };

  const handleAlignRight = () => {
    document.execCommand("justifyRight");
  };

  const handleBulletList = () => {
    document.execCommand("insertUnorderedList");
  };

  const handleNumberedList = () => {
    document.execCommand("insertOrderedList");
  };

  const handleLink = () => {
    setLinkDialogOpen(true);
  };

  const handleLinkInsert = (url: string, text: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand("insertHTML", false, `<a href="${url}">${text}</a>`);
    }
  };

  const handleImage = () => {
    setImageDialogOpen(true);
  };

  const handleImageInsert = (url: string) => {
    document.execCommand("insertImage", false, url);
  };

  const handleTable = () => {
    setTableDialogOpen(true);
  };

  const handleTableInsert = (rows: number, cols: number) => {
    let table = "<table style='border-collapse: collapse; width: 100%;'><tbody>";
    for (let i = 0; i < rows; i++) {
      table += "<tr>";
      for (let j = 0; j < cols; j++) {
        table += "<td style='border: 1px solid #ddd; padding: 8px;'>Célula</td>";
      }
      table += "</tr>";
    }
    table += "</tbody></table>";
    document.execCommand("insertHTML", false, table);
  };

  const handleSave = () => {
    // Save to localStorage
    const documents = JSON.parse(
      localStorage.getItem("documents") || "[]"
    );
    const existingIndex = documents.findIndex(
      (doc: any) => doc.name === documentName
    );

    if (existingIndex >= 0) {
      documents[existingIndex] = {
        name: documentName,
        content: content,
        lastModified: new Date().toLocaleString("pt-PT"),
      };
    } else {
      documents.push({
        name: documentName,
        content: content,
        lastModified: new Date().toLocaleString("pt-PT"),
      });
    }

    localStorage.setItem("documents", JSON.stringify(documents));
    toast.success("Documento guardado com sucesso!");
  };

  const handleUndo = () => {
    document.execCommand("undo");
  };

  const handleRedo = () => {
    document.execCommand("redo");
  };

  const handleNewDocument = () => {
    if (content && !confirm("Descartar documento atual?")) {
      return;
    }
    setDocumentName("Documento sem título");
    setContent("");
  };

  const handleOpenDocument = () => {
    const documents = JSON.parse(
      localStorage.getItem("documents") || "[]"
    );
    if (documents.length === 0) {
      toast.error("Nenhum documento guardado");
      return;
    }

    const docName = prompt(
      "Documentos guardados:\n" +
        documents.map((d: any) => d.name).join("\n") +
        "\n\nIntroduza o nome do documento:"
    );

    if (docName) {
      const doc = documents.find((d: any) => d.name === docName);
      if (doc) {
        setDocumentName(doc.name);
        setContent(doc.content);
        toast.success("Documento aberto!");
      } else {
        toast.error("Documento não encontrado");
      }
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content.replace(/<[^>]*>/g, "")], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${documentName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Documento transferido!");
  };

  const handleShare = () => {
    toast.info("Funcionalidade de partilha em desenvolvimento");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Dialogs */}
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onInsert={handleLinkInsert}
      />
      <TableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        onInsert={handleTableInsert}
      />
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={handleImageInsert}
      />

      {/* Toolbar */}
      <EditorToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onUnderline={handleUnderline}
        onAlignLeft={handleAlignLeft}
        onAlignCenter={handleAlignCenter}
        onAlignRight={handleAlignRight}
        onBulletList={handleBulletList}
        onNumberedList={handleNumberedList}
        onLink={handleLink}
        onImage={handleImage}
        onTable={handleTable}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <DocumentEditor
          content={content}
          onChange={setContent}
          placeholder="Comece a escrever o seu documento..."
        />

        {/* Side Panel */}
        <SidePanel
          documentName={documentName}
          lastModified={lastModified}
          wordCount={wordCount}
          characterCount={characterCount}
          onDocumentNameChange={setDocumentName}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}
