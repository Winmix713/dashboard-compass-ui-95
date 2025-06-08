import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import FigmaConverter from "@/pages/figma-converter";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={FigmaConverter} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
