import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  componentData: {
    reactCode: string;
    css: string;
    html: string;
    name: string;
  };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  componentData
}) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Másolva",
        description: `${type} kód másolva a vágólapra`,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Másolási hiba",
        description: "Nem sikerült a másolás",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Letöltés",
      description: `${filename} letöltve`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Komponens Exportálása: {componentData.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="react" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="react">React TypeScript</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="react" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">React komponens kód</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(componentData.reactCode, 'React')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Másolás
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadFile(
                    componentData.reactCode, 
                    `${componentData.name}.tsx`, 
                    'text/typescript'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Letöltés
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">
                <code>{componentData.reactCode}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="css" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">CSS stílusok</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(componentData.css, 'CSS')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Másolás
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadFile(
                    componentData.css, 
                    `${componentData.name}.css`, 
                    'text/css'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Letöltés
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">
                <code>{componentData.css}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">HTML dokumentum</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(componentData.html, 'HTML')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Másolás
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadFile(
                    componentData.html, 
                    `${componentData.name}.html`, 
                    'text/html'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Letöltés
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">
                <code>{componentData.html}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Bezárás
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};