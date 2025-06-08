import React from "react";
import { Code } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FigmaComponentCardProps {
  component: {
    id: string;
    name: string;
    type: string;
    svg: string;
    variants?: string[];
  };
  onSelect: (component: any) => void;
}

export const FigmaComponentCard: React.FC<FigmaComponentCardProps> = ({ 
  component, 
  onSelect 
}) => {
  return (
    <Card key={component.id} className="p-4">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <div 
            className="w-16 h-16 border rounded bg-muted flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: component.svg }}
          />
          <div className="flex-1">
            <h4 className="font-medium">{component.name}</h4>
            <p className="text-sm text-muted-foreground">{component.type}</p>
            {component.variants && (
              <div className="flex flex-wrap gap-1 mt-2">
                {component.variants.map((variant: string) => (
                  <Badge key={variant} variant="secondary">
                    {variant}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onSelect(component)}
          >
            <Code className="w-4 h-4 mr-2" />
            JSX-be konvertálás
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};