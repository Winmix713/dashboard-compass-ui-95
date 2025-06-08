
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FigmaUrlTab() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!figmaUrl) {
      toast.error("Please enter a Figma URL");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Figma file imported successfully!");
    } catch (error) {
      toast.error("Failed to import Figma file");
    } finally {
      setIsProcessing(false);
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
            />
          </div>
          
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              Make sure your Figma token is configured in Settings
            </span>
          </div>

          <Button onClick={handleImport} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Import Figma File"}
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
