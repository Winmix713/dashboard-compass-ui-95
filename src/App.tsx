
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import FigmaConverter from "./pages/figma-converter";
import Documentation from "./pages/documentation";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/" component={FigmaConverter} />
            <Route path="/documentation" component={Documentation} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
