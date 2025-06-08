import React from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DesignTokensDisplayProps {
  designTokens: {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    typography: Record<string, string>;
  };
  generatedTokensCode: string;
  onCopy: (text: string) => void;
}

export const DesignTokensDisplay: React.FC<DesignTokensDisplayProps> = ({
  designTokens,
  generatedTokensCode,
  onCopy
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">Design Tokens</h3>
        <div className="bg-muted rounded-lg p-4">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            <code>{generatedTokensCode}</code>
          </pre>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(generatedTokensCode)}
          >
            <Copy className="w-4 h-4 mr-2" />
            Másolás
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Színek</h4>
          <div className="space-y-1 bg-card p-3 rounded-lg border">
            {Object.entries(designTokens.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color as string }}
                />
                <span className="text-xs">{name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{color as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Távolságok</h4>
          <div className="space-y-1 bg-card p-3 rounded-lg border">
            {Object.entries(designTokens.spacing).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs">{name}</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{value as string}</code>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Tipográfia</h4>
          <div className="space-y-1 bg-card p-3 rounded-lg border">
            {Object.entries(designTokens.typography).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs">{name}</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{value as string}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};