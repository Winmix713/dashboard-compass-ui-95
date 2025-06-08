import React from "react";
import { Copy, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProcessedComponentViewProps {
  component: {
    name: string;
    reactCode: string;
    styledCss: string;
    htmlStructure: string;
    tailwindClasses: {
      main: string;
    };
    stats: {
      cssRules: number;
      responsiveBreakpoints: number;
      animations: number;
    };
  };
  onCopy: (text: string) => void;
  onDownload: (content: string, fileName: string, fileType: string) => void;
}

export const ProcessedComponentView: React.FC<ProcessedComponentViewProps> = ({
  component,
  onCopy,
  onDownload
}) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Generált komponens: {component.name}</h3>
        <div className="flex gap-2">
          <Badge variant="secondary">{component.stats.cssRules} CSS szabály</Badge>
          <Badge variant="secondary">{component.stats.responsiveBreakpoints} breakpoint</Badge>
          <Badge variant="secondary">{component.stats.animations} animáció</Badge>
        </div>
      </div>

      <Tabs defaultValue="react" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="react">React TSX</TabsTrigger>
          <TabsTrigger value="css">Optimalizált CSS</TabsTrigger>
          <TabsTrigger value="html">HTML + CSS</TabsTrigger>
          <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
        </TabsList>

        <TabsContent value="react" className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">React TypeScript komponens</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(component.reactCode)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másolás
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap">
              <code>{component.reactCode}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="css" className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Optimalizált CSS</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(component.styledCss)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másolás
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap">
              <code>{component.styledCss}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="html" className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Teljes HTML dokumentum</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(component.htmlStructure)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másolás
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap">
              <code>{component.htmlStructure}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="tailwind" className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Tailwind CSS osztályok</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(component.tailwindClasses.main)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másolás
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Főbb Tailwind osztályok:</p>
            <code className="text-sm bg-card p-2 rounded block">
              {component.tailwindClasses.main}
            </code>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onDownload(
            component.reactCode, 
            `${component.name}.tsx`, 
            'text/typescript'
          )}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          React komponens letöltése
        </Button>
        <Button
          onClick={() => onDownload(
            component.styledCss, 
            `${component.name}.css`, 
            'text/css'
          )}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          CSS fájl letöltése
        </Button>
        <Button
          onClick={() => onDownload(
            component.htmlStructure, 
            `${component.name}.html`, 
            'text/html'
          )}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          HTML letöltése
        </Button>
      </div>
    </div>
  );
};