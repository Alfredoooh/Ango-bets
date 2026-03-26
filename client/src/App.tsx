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

// Load Fraunces & DM Sans fonts (matching landing page)
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,900;1,9..144,900&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(link);
}

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={DoctionLanding} />
      {/* Main app — editor (home page) */}
      <Route path="/home" component={EditorPage} />
      {/* Legacy */}
      <Route path="/editor" component={EditorPage} />
      <Route path="/gallery" component={DocumentGallery} />
      <Route path="/design" component={DesignStudio} />
      <Route path="/ai" component={AIAssistant} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--cream)",
                border: "1px solid var(--lp-border, #e4ddd2)",
                color: "var(--ink, #0e0c09)",
                borderRadius: 12,
                fontSize: ".87rem",
                fontFamily: "'DM Sans', sans-serif",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
