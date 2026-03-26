import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerateDocument = async () => {
    if (!prompt.trim()) {
      toast.error("Introduza uma descrição do documento");
      return;
    }

    setLoading(true);
    try {
      // Simular chamada à API de IA
      // Em produção, isto chamaria um backend que se conecta a uma API de IA
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar documento");
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      toast.success("Documento gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar documento. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDocument = () => {
    if (!generatedContent) {
      toast.error("Nenhum documento gerado");
      return;
    }

    // Guardar no localStorage e redirecionar para o editor
    localStorage.setItem(
      "aiGeneratedContent",
      JSON.stringify({
        content: generatedContent,
        timestamp: new Date().toISOString(),
      })
    );

    setLocation("/editor");
    toast.success("Documento carregado no editor!");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="h-12 px-4 bg-secondary/30 border-b border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar
        </Button>
        <span className="text-sm text-muted-foreground">Assistente IA</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Assistente de IA
              </h1>
              <p className="text-muted-foreground">
                Descreva o documento que deseja criar e a IA irá gerar o
                conteúdo automaticamente.
              </p>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">
                Descreva o seu documento
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Crie um relatório sobre os benefícios do trabalho remoto..."
                className="w-full h-32 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <Button
                onClick={handleGenerateDocument}
                disabled={loading}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gerar Documento
                  </>
                )}
              </Button>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    Documento Gerado
                  </h2>
                  <div className="bg-secondary/30 border border-border rounded-lg p-6 max-h-96 overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: generatedContent }}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleUseDocument}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Usar no Editor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedContent("");
                      setPrompt("");
                    }}
                  >
                    Gerar Novo
                  </Button>
                </div>
              </div>
            )}

            {/* Examples */}
            <div className="bg-secondary/20 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">
                Exemplos de Prompts
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Crie um contrato de aluguel residencial em Portugal
                </li>
                <li>• Escreva um currículo profissional em português</li>
                <li>• Gere um plano de negócios para uma startup de tech</li>
                <li>• Crie uma proposta comercial para um cliente</li>
                <li>• Escreva um artigo sobre sustentabilidade</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
