import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, FileText, Palette, Sparkles, ArrowRight } from "lucide-react";

export default function DoctionLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f4] via-[#fff5f0] to-[#faf8f4]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#faf8f4]/95 backdrop-blur border-b border-[#e4ddd2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4520a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-2xl font-black text-[#0e0c09]" style={{ fontFamily: "Fraunces, serif" }}>
              Doction
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation("/editor")}
              className="gap-2 bg-[#d4520a] hover:bg-[#e8732e] text-white rounded-full"
            >
              Começar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#fdf1ea] border border-[#f0c0a0] rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-[#d4520a] rounded-full animate-pulse" />
                <span className="text-sm font-bold text-[#d4520a] uppercase tracking-wider">
                  Novo
                </span>
              </div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0e0c09] leading-tight"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Cria. Converte.{" "}
                <span className="text-[#d4520a]">Transforma.</span>
              </h1>
            </div>
            <p className="text-lg text-[#8a847b] leading-relaxed max-w-md">
              Doction é o editor de documentos profissional que você sempre
              procurou. Crie, edite, exporte e compartilhe documentos com
              facilidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setLocation("/editor")}
                className="gap-2 bg-[#d4520a] hover:bg-[#e8732e] text-white rounded-full px-8 py-6 text-lg"
              >
                <Zap className="w-5 h-5" />
                Começar Agora
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-[#e4ddd2] text-[#0e0c09] hover:bg-[#f3ede3] rounded-full px-8 py-6 text-lg"
              >
                Saber Mais
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 lg:h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4520a]/10 to-[#e8732e]/10 rounded-3xl blur-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-[#e4ddd2] max-w-sm">
              <div className="space-y-3">
                <div className="h-3 bg-[#e4ddd2] rounded w-3/4" />
                <div className="h-3 bg-[#e4ddd2] rounded w-full" />
                <div className="h-3 bg-[#e4ddd2] rounded w-5/6" />
              </div>
              <div className="mt-6 pt-6 border-t border-[#e4ddd2]">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-[#d4520a]/20 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-[#e4ddd2] rounded w-2/3" />
                    <div className="h-2 bg-[#e4ddd2] rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black text-[#0e0c09] mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Funcionalidades Poderosas
          </h2>
          <p className="text-lg text-[#8a847b] max-w-2xl mx-auto">
            Tudo o que você precisa para criar documentos profissionais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: FileText,
              title: "Papel A4 Profissional",
              desc: "Dimensões exatas com margens ajustáveis",
            },
            {
              icon: Zap,
              title: "Exportação PDF",
              desc: "Exporte seus documentos em PDF com um clique",
            },
            {
              icon: Palette,
              title: "Design Studio",
              desc: "Crie designs personalizados com canvas",
            },
            {
              icon: Sparkles,
              title: "Assistente IA",
              desc: "Gere documentos automaticamente com IA",
            },
            {
              icon: FileText,
              title: "Zoom Flexível",
              desc: "Zoom de 25% até 200% com travamento",
            },
            {
              icon: Zap,
              title: "Formatação Completa",
              desc: "Cores, estilos, tabelas, imagens e mais",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#e4ddd2] rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-[#fdf1ea] rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#d4520a]" />
                </div>
                <h3 className="text-lg font-bold text-[#0e0c09] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#8a847b]">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-[#d4520a] to-[#e8732e] rounded-3xl p-12 sm:p-16 text-center text-white">
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Pronto para Começar?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Crie seu primeiro documento profissional agora. Sem cadastro, sem
            custos, sem limitações.
          </p>
          <Button
            onClick={() => setLocation("/editor")}
            className="gap-2 bg-white text-[#d4520a] hover:bg-[#faf8f4] rounded-full px-10 py-6 text-lg font-bold"
          >
            <Zap className="w-5 h-5" />
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e4ddd2] bg-[#f3ede3] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-[#8a847b]">
          <p>© 2026 Doction. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
