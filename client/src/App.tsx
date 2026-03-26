import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DoctionLanding from "./pages/DoctionLanding";
import EditorPage from "./pages/EditorPage";
import DocumentGallery from "./pages/DocumentGallery";
import DesignStudio from "./pages/DesignStudio";
import AIAssistant from "./pages/AIAssistant";

function Router() {
  return (
    <Switch>
      {/* Landing page — apresentação do produto */}
      <Route path="/" component={DoctionLanding} />
      {/* Home page principal — editor (destino do "Começar" e do botão Voltar) */}
      <Route path="/home" component={EditorPage} />
      {/* Rota legada /editor redireciona para /home */}
      <Route path="/editor" component={EditorPage} />
      <Route path="/gallery" component={DocumentGallery} />
      <Route path="/design" component={DesignStudio} />
      <Route path="/ai" component={AIAssistant} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
