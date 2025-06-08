
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Play, Pause } from "lucide-react";

export default function BatchProcessingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Batch Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Process multiple Figma files or components simultaneously
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Start Batch
            </Button>
            <Button variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
