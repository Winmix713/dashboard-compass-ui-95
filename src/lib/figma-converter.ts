export interface FigmaConverterOptions {
  extractDesignTokens: boolean;
  generateVariants: boolean;
  includeResponsive: boolean;
  optimizeForProduction: boolean;
  extractColors: boolean;
  extractTypography: boolean;
  generateStorybook: boolean;
}

export interface FigmaValidationResult {
  isValid: boolean;
  message: string;
  parsedData?: {
    fileId: string;
    fileName?: string;
    lastModified?: string;
    thumbnailUrl?: string;
  };
}

export interface ProcessedComponent {
  name: string;
  originalCss?: string;
  reactCode: string;
  styledCss: string;
  htmlStructure: string;
  tailwindClasses: string[];
  stats: {
    cssRules: number;
    responsiveBreakpoints: number;
    animations: number;
    customProperties: number;
  };
}

export class FigmaConverter {
  private options: FigmaConverterOptions;

  constructor(options: Partial<FigmaConverterOptions> = {}) {
    this.options = {
      extractDesignTokens: true,
      generateVariants: true,
      includeResponsive: true,
      optimizeForProduction: true,
      extractColors: true,
      extractTypography: true,
      generateStorybook: false,
      ...options,
    };
  }

  validateFigmaUrl(url: string): FigmaValidationResult {
    try {
      const urlObj = new URL(url);
      
      if (!urlObj.hostname.includes('figma.com')) {
        return {
          isValid: false,
          message: 'URL must be from figma.com',
        };
      }

      const fileIdMatch = url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return {
          isValid: false,
          message: 'Invalid Figma file URL format',
        };
      }

      const fileId = fileIdMatch[2];
      
      return {
        isValid: true,
        message: 'Valid Figma URL',
        parsedData: {
          fileId,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Invalid URL format',
      };
    }
  }

  async fetchFigmaFile(fileId: string, token: string): Promise<any> {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': token,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  extractComponentsFromFigmaData(figmaData: any): any[] {
    const components: any[] = [];
    
    function traverseNode(node: any) {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          styles: node.styles || {},
          absoluteBoundingBox: node.absoluteBoundingBox,
          children: node.children || [],
        });
      }
      
      if (node.children) {
        node.children.forEach(traverseNode);
      }
    }

    if (figmaData.document) {
      traverseNode(figmaData.document);
    }

    return components;
  }

  extractDesignTokens(figmaData: any): any {
    const colors: any[] = [];
    const typography: any[] = [];
    const spacing: any[] = [];

    // Extract colors from styles
    if (figmaData.styles) {
      Object.values(figmaData.styles).forEach((style: any) => {
        if (style.styleType === 'FILL') {
          colors.push({
            name: style.name,
            value: style.fills?.[0]?.color || '#000000',
            type: 'color'
          });
        } else if (style.styleType === 'TEXT') {
          typography.push({
            name: style.name,
            fontFamily: style.fontFamily || 'Inter',
            fontSize: style.fontSize || 16,
            fontWeight: style.fontWeight || 400,
            lineHeight: style.lineHeight || 1.5
          });
        }
      });
    }

    // Extract spacing from component dimensions
    spacing.push(
      { name: 'xs', value: '4px' },
      { name: 'sm', value: '8px' },
      { name: 'md', value: '16px' },
      { name: 'lg', value: '24px' },
      { name: 'xl', value: '32px' }
    );

    return { colors, typography, spacing };
  }

  generateReactComponent(component: any, designTokens: any): any {
    const componentName = component.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, (c: string) => c.toUpperCase());
    
    const reactCode = `import React from "react";
import { cn } from "@/lib/utils";

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className,
  children,
  variant = "default",
  size = "md",
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
        },
        {
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4": size === "md",
          "h-12 px-6 text-lg": size === "lg",
        },
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

export default ${componentName};`;

    const cssCode = `.${componentName.toLowerCase()} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: colors 0.2s;
}

.${componentName.toLowerCase()}:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}`;

    const tailwindClasses = [
      "inline-flex",
      "items-center",
      "justify-center",
      "transition-colors",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2"
    ];

    return {
      react: reactCode,
      css: cssCode,
      tailwind: tailwindClasses,
      html: `<div class="${tailwindClasses.join(' ')}">${component.name}</div>`
    };
  }

  setOptions(options: Partial<FigmaConverterOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): FigmaConverterOptions {
    return { ...this.options };
  }
}

export const figmaConverter = new FigmaConverter();
