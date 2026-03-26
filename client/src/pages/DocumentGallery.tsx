import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Document {
  name: string;
  content: string;
  lastModified: string;
}

export default function DocumentGallery() {
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const docs = JSON.parse(localStorage.getItem("documents") || "[]");
    setDocuments(docs);
  };

  const handleDelete = (name: string) => {
    if (confirm(`Tem a certeza que deseja eliminar "${name}"?`)) {
      const docs = documents.filter((d) => d.name !== name);
      localStorage.setItem("documents", JSON.stringify(docs));
      setDocuments(docs);
      toast.success("Documento eliminado");
    }
  };

  const handleEdit = (name: string) => {
    // This would navigate to the editor with the document loaded
    // For now, we'll just show a toast
    toast.info("Funcionalidade de edição em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-foreground">
                Os Meus Documentos
              </h1>
            </div>
            <Button
              onClick={() => setLocation("/")}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              Novo Documento
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {documents.length === 0 ? (
          <Card className="border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Nenhum documento guardado
              </h2>
              <p className="text-muted-foreground mb-6">
                Comece por criar um novo documento
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Criar Documento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.name}
                className="border-border hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    {doc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Modificado:{" "}
                      <span className="font-semibold">{doc.lastModified}</span>
                    </p>
                    <p>
                      Tamanho:{" "}
                      <span className="font-semibold">
                        {(doc.content.length / 1024).toFixed(2)} KB
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(doc.name)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(doc.name)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
