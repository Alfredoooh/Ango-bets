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
      <Route path="/" component={DoctionLanding} />
      <Route path="/editor" component={EditorPage} />
      <Route path="/gallery" component={DocumentGallery} />
      <Route path="/design" component={DesignStudio} />
      <Route path="/ai" component={AIAssistant} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
