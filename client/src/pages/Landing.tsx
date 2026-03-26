import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  FileText,
  Zap,
  Shield,
  Share2,
  Download,
  Smartphone,
  Cloud,
  CheckCircle,
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Document Creator
            </span>
          </div>
          <Button
            onClick={() => setLocation("/editor")}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Começar Agora
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-tight">
            Editor de Documentos
            <span className="text-primary"> Profissional</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie, edite e formate documentos com a qualidade de um editor
            profissional. Totalmente online, responsivo e com todas as
            funcionalidades que precisa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={() => setLocation("/editor")}
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Zap className="w-5 h-5" />
              Começar a Editar
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() =>
                document.getElementById("features")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Funcionalidades Principais
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo o que precisa para criar documentos profissionais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <FileText className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Papel A4 Profissional
            </h3>
            <p className="text-muted-foreground">
              Dimensões exatas do papel A4 com margens ajustáveis para um
              resultado profissional.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <Smartphone className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Totalmente Responsivo
            </h3>
            <p className="text-muted-foreground">
              Funciona perfeitamente em desktop, tablet e dispositivos móveis.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <Zap className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Formatação Completa
            </h3>
            <p className="text-muted-foreground">
              Negrito, itálico, cores, tabelas, listas, imagens e muito mais.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <Download className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Exportação Múltipla
            </h3>
            <p className="text-muted-foreground">
              Exporte seus documentos como PDF, TXT ou imagem PNG.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <Cloud className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Armazenamento Local
            </h3>
            <p className="text-muted-foreground">
              Seus documentos são guardados localmente no seu navegador com
              segurança.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <Shield className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Privado e Seguro
            </h3>
            <p className="text-muted-foreground">
              Nenhum dado é enviado para servidores. Tudo fica no seu
              dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Por Que Escolher Document Creator?
          </h2>
        </div>

        <div className="space-y-4">
          {[
            "✓ Sem instalação - Funciona diretamente no navegador",
            "✓ Sem custos - Completamente gratuito",
            "✓ Sem limite de documentos - Crie quantos quiser",
            "✓ Sem perda de dados - Armazenamento local seguro",
            "✓ Sem publicidade - Interface limpa e profissional",
            "✓ Sem dependências - Funciona offline",
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3 text-lg">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <span className="text-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-12 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Pronto para Começar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie seu primeiro documento profissional agora. Não precisa de
            cadastro ou login.
          </p>
          <Button
            onClick={() => setLocation("/editor")}
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Zap className="w-5 h-5" />
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <button
                    onClick={() => setLocation("/editor")}
                    className="hover:text-foreground transition-colors"
                  >
                    Editor
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById("features")?.scrollIntoView()
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    Funcionalidades
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Sobre</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacidade
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Termos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>
              © 2026 Document Creator. Todos os direitos reservados. Criado com
              ❤️ para criar documentos profissionais.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
