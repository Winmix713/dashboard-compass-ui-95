
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, AlertCircle } from "lucide-react";
import { FigmaService } from "@/services/figmaService";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useJobPolling } from "@/hooks/useJobPolling";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";

export default function FigmaUrlTab() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const { state, dispatch } = useAppContext();
  const { handleError } = useErrorHandler();

  const { job, isPolling } = useJobPolling(currentJobId, (completedJob) => {
    toast.success("Figma file imported successfully!");
    dispatch({ type: 'SET_PROCESSING', payload: false });
    setCurrentJobId(null);
  });

  const handleImport = async () => {
    if (!figmaUrl) {
      toast.error("Please enter a Figma URL");
      return;
    }

    if (!state.figmaToken) {
      toast.error("Please configure your Figma token in Settings");
      return;
    }

    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      // First validate the URL
      const validation = await FigmaService.validateUrl(figmaUrl, state.figmaToken);
      
      if (!validation.valid) {
        throw new Error(validation.message || 'Invalid Figma URL or token');
      }

      // Start extraction
      const response = await FigmaService.extractComponents(figmaUrl, state.figmaToken);
      setCurrentJobId(response.jobId);
      
      toast.success("Starting Figma file import...");
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: false });
      handleError(error as Error, 'Figma Import');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Figma File Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="figma-url" className="block text-sm font-medium mb-2">
              Figma File URL
            </label>
            <input
              id="figma-url"
              type="url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/file/..."
              className="w-full px-3 py-2 border border-input rounded-md"
              disabled={state.isProcessing}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              Make sure your Figma token is configured in Settings
            </span>
          </div>

          {job && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing Status</span>
                <span className="text-sm">{job.progressPercentage}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={state.isProcessing || isPolling} 
            className="w-full"
          >
            {state.isProcessing || isPolling ? "Processing..." : "Import Figma File"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Design System Components</p>
                <p className="text-sm text-muted-foreground">Imported 2 hours ago</p>
              </div>
              <Badge>Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
