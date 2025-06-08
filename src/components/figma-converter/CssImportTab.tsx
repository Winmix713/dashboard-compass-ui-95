
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Upload } from "lucide-react";

export default function CssImportTab() {
  const [cssCode, setCssCode] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            CSS Code Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="css-code" className="block text-sm font-medium mb-2">
              Paste your CSS code
            </label>
            <textarea
              id="css-code"
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              placeholder="/* Paste your CSS code here */"
              className="w-full h-64 px-3 py-2 border border-input rounded-md font-mono text-sm"
            />
          </div>

          <Button className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Process CSS Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
