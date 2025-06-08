
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";

export default function OutputPanel() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Generated Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Your generated components will appear here
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
