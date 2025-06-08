import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
            <CardTitle>Hiba történt</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Váratlan hiba lépett fel az alkalmazásban. Próbáld újra!
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
            >
              Újrapróbálás
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}