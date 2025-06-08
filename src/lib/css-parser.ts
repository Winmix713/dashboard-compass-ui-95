export interface CSSRule {
  selector: string;
  declarations: CSSDeclaration[];
  originalRule: string;
  figmaComponent?: string;
}

export interface CSSDeclaration {
  property: string;
  value: string;
}

export interface ParsedCSS {
  componentName: string;
  cssRules: CSSRule[];
  responsiveRules: string[];
  animations: Animation[];
  customProperties: CustomProperty[];
  originalStructure: HTMLStructure;
}

export interface Animation {
  name: string;
  definition: string;
}

export interface CustomProperty {
  name: string;
  value: string;
}

export interface HTMLStructure {
  elements: string[];
  hierarchy: ElementHierarchy[];
}

export interface ElementHierarchy {
  selector: string;
  depth: number;
  elements: string[];
}

export interface GeneratedComponent {
  jsx: string;
  css: string;
  html: string;
  tailwindClasses: string;
}

export class CSSParser {
  /**
   * Parse Figma CSS code and extract component structure
   */
  parseFigmaCssToComponent(cssCode: string): ParsedCSS {
    const componentName = this.extractComponentNameFromCss(cssCode) || "FigmaComponent";
    const cssRules = this.parseCssRules(cssCode);
    const responsiveRules = this.extractResponsiveRules(cssCode);
    const animations = this.extractAnimations(cssCode);
    const customProperties = this.extractCustomProperties(cssCode);
    const originalStructure = this.extractHtmlStructure(cssCode);
    
    return {
      componentName,
      cssRules,
      responsiveRules,
      animations,
      customProperties,
      originalStructure
    };
  }

  /**
   * Extract component name from CSS comments or class names
   */
  extractComponentNameFromCss(css: string): string {
    // Look for Figma component comments first
    const commentMatches = css.match(/\/\*\s*([^*\n]+)\s*\*\//);
    if (commentMatches && commentMatches[1]) {
      const componentName = commentMatches[1].trim();
      
      // Skip generic comments and prefer actual component names
      if (!componentName.includes('Auto layout') && 
          !componentName.includes('Inside auto layout') &&
          !componentName.includes('input-light') &&
          !componentName.includes('depth-light') &&
          componentName !== 'button') {
        return componentName
          .replace(/[^a-zA-Z0-9]/g, '')
          .replace(/^[^a-zA-Z]/, '')
          .replace(/^\w/, c => c.toUpperCase()) || "FigmaComponent";
      }
    }
    
    // Look for the first meaningful component comment
    const allComments = css.match(/\/\*\s*([^*\n]+)\s*\*\//g);
    if (allComments) {
      for (const comment of allComments) {
        const name = comment.replace(/\/\*\s*|\s*\*\//g, '').trim();
        if (name && 
            !name.includes('Auto layout') && 
            !name.includes('Inside') &&
            !name.includes('identical') &&
            name.length < 50) {
          return name
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[^a-zA-Z]/, '')
            .replace(/^\w/, c => c.toUpperCase()) || "FigmaComponent";
        }
      }
    }
    
    // Look for class names as fallback
    const classMatches = css.match(/\.([a-zA-Z][a-zA-Z0-9-_]*)/g);
    if (classMatches && classMatches.length > 0) {
      const firstClass = classMatches[0].replace('.', '');
      return firstClass.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
    }
    
    return "FigmaButton";
  }

  /**
   * Parse CSS rules from both traditional CSS and Figma CSS blocks
   */
  parseCssRules(css: string): CSSRule[] {
    const rules: CSSRule[] = [];
    
    // First, handle Figma CSS blocks that don't have explicit selectors
    const figmaBlocks = this.parseFigmaCssBlocks(css);
    
    // Then handle regular CSS rules with selectors
    const ruleRegex = /([^{]+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      // Skip if this is already parsed as a Figma block
      if (!selector.startsWith('/*') && (selector.includes('.') || selector.includes('#') || selector.includes('::'))) {
        rules.push({
          selector,
          declarations: this.parseDeclarations(declarations),
          originalRule: match[0]
        });
      }
    }
    
    // Add parsed Figma blocks as rules
    rules.push(...figmaBlocks);
    
    return rules;
  }

  /**
   * Parse Figma CSS blocks that use comments for component names
   */
  parseFigmaCssBlocks(css: string): CSSRule[] {
    const blocks: CSSRule[] = [];
    
    // Split CSS by comments that indicate component names
    const commentRegex = /\/\*\s*([^*]+)\s*\*\//g;
    const parts = css.split(commentRegex);
    
    for (let i = 1; i < parts.length; i += 2) {
      const componentName = parts[i].trim();
      const cssContent = parts[i + 1] ? parts[i + 1].trim() : '';
      
      if (cssContent && componentName && !componentName.includes('Auto layout') && !componentName.includes('Inside auto layout')) {
        // Extract CSS declarations from the block
        const declarations = this.extractDeclarationsFromBlock(cssContent);
        
        if (declarations.length > 0) {
          const className = componentName
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
          
          blocks.push({
            selector: `.${className}`,
            declarations,
            originalRule: `/* ${componentName} */ { ${cssContent} }`,
            figmaComponent: componentName
          });
        }
      }
    }
    
    return blocks;
  }

  /**
   * Extract CSS declarations from a Figma CSS block
   */
  extractDeclarationsFromBlock(cssBlock: string): CSSDeclaration[] {
    const declarations: CSSDeclaration[] = [];
    
    // Split by lines and extract property: value pairs
    const lines = cssBlock.split('\n');
    let currentProperty = '';
    let currentValue = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('/*') || trimmedLine.endsWith('*/') || !trimmedLine) {
        continue;
      }
      
      // Check if line contains a CSS property
      if (trimmedLine.includes(':') && !trimmedLine.startsWith('/*')) {
        // If we have a previous property, save it
        if (currentProperty && currentValue) {
          declarations.push({
            property: currentProperty.trim(),
            value: currentValue.replace(/;$/, '').trim()
          });
        }
        
        const colonIndex = trimmedLine.indexOf(':');
        currentProperty = trimmedLine.substring(0, colonIndex).trim();
        currentValue = trimmedLine.substring(colonIndex + 1).trim();
      } else if (currentValue && trimmedLine) {
        // Continue multi-line value
        currentValue += ' ' + trimmedLine;
      }
    }
    
    // Add the last property if exists
    if (currentProperty && currentValue) {
      declarations.push({
        property: currentProperty.trim(),
        value: currentValue.replace(/;$/, '').trim()
      });
    }
    
    return declarations;
  }

  /**
   * Parse CSS declarations from a declarations string
   */
  parseDeclarations(declarations: string): CSSDeclaration[] {
    return declarations.split(';')
      .filter(decl => decl.trim())
      .map(decl => {
        const [property, value] = decl.split(':').map(s => s.trim());
        return { property, value };
      });
  }

  /**
   * Extract responsive media query rules
   */
  extractResponsiveRules(css: string): string[] {
    const mediaRules: string[] = [];
    const mediaRegex = /@media\s*\([^)]+\)\s*\{[^{}]*(?:\{[^}]*\}[^{}]*)*\}/g;
    let match;
    
    while ((match = mediaRegex.exec(css)) !== null) {
      mediaRules.push(match[0]);
    }
    
    return mediaRules;
  }

  /**
   * Extract CSS animation keyframes
   */
  extractAnimations(css: string): Animation[] {
    const animations: Animation[] = [];
    const keyframeRegex = /@keyframes\s+([^{]+)\s*\{[^{}]*(?:\{[^}]*\}[^{}]*)*\}/g;
    let match;
    
    while ((match = keyframeRegex.exec(css)) !== null) {
      animations.push({
        name: match[1].trim(),
        definition: match[0]
      });
    }
    
    return animations;
  }

  /**
   * Extract CSS custom properties (variables)
   */
  extractCustomProperties(css: string): CustomProperty[] {
    const properties: CustomProperty[] = [];
    const propRegex = /--([\w-]+):\s*([^;]+);/g;
    let match;
    
    while ((match = propRegex.exec(css)) !== null) {
      properties.push({
        name: match[1],
        value: match[2].trim()
      });
    }
    
    return properties;
  }

  /**
   * Extract HTML structure from CSS selectors
   */
  extractHtmlStructure(css: string): HTMLStructure {
    // Analyze CSS selectors to infer HTML structure
    const selectors = css.match(/[^{]+(?=\s*\{)/g) || [];
    const structure = {
      elements: [],
      hierarchy: this.buildElementHierarchy(selectors)
    };
    
    return structure;
  }

  /**
   * Build element hierarchy from CSS selectors
   */
  buildElementHierarchy(selectors: string[]): ElementHierarchy[] {
    const hierarchy: ElementHierarchy[] = [];
    
    selectors.forEach(selector => {
      const parts = selector.split(/\s+/);
      hierarchy.push({
        selector: selector.trim(),
        depth: parts.length,
        elements: parts.map(part => part.trim())
      });
    });
    
    return hierarchy.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Convert CSS to Tailwind classes
   */
  convertCssToTailwind(cssRules: CSSRule[]): string {
    const tailwindClasses: string[] = [];
    
    for (const rule of cssRules) {
      for (const declaration of rule.declarations) {
        const tailwindClass = this.cssPropertyToTailwind(declaration.property, declaration.value);
        if (tailwindClass) {
          tailwindClasses.push(tailwindClass);
        }
      }
    }
    
    return [...new Set(tailwindClasses)].join(' ');
  }

  /**
   * Convert individual CSS property to Tailwind class
   */
  cssPropertyToTailwind(property: string, value: string): string | null {
    const propertyMap: Record<string, (value: string) => string | null> = {
      'display': (val) => {
        const displayMap: Record<string, string> = {
          'flex': 'flex',
          'inline-flex': 'inline-flex',
          'block': 'block',
          'inline-block': 'inline-block',
          'grid': 'grid',
          'hidden': 'hidden'
        };
        return displayMap[val] || null;
      },
      'flex-direction': (val) => {
        const directionMap: Record<string, string> = {
          'row': 'flex-row',
          'column': 'flex-col',
          'row-reverse': 'flex-row-reverse',
          'column-reverse': 'flex-col-reverse'
        };
        return directionMap[val] || null;
      },
      'justify-content': (val) => {
        const justifyMap: Record<string, string> = {
          'center': 'justify-center',
          'flex-start': 'justify-start',
          'flex-end': 'justify-end',
          'space-between': 'justify-between',
          'space-around': 'justify-around',
          'space-evenly': 'justify-evenly'
        };
        return justifyMap[val] || null;
      },
      'align-items': (val) => {
        const alignMap: Record<string, string> = {
          'center': 'items-center',
          'flex-start': 'items-start',
          'flex-end': 'items-end',
          'stretch': 'items-stretch',
          'baseline': 'items-baseline'
        };
        return alignMap[val] || null;
      },
      'padding': (val) => {
        const paddingValue = this.parseSizeValue(val);
        return paddingValue ? `p-${paddingValue}` : null;
      },
      'margin': (val) => {
        const marginValue = this.parseSizeValue(val);
        return marginValue ? `m-${marginValue}` : null;
      },
      'background': (val) => {
        if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) {
          return 'bg-primary'; // Simplified mapping
        }
        return null;
      },
      'border-radius': (val) => {
        const radiusValue = this.parseSizeValue(val);
        return radiusValue ? `rounded-${radiusValue}` : 'rounded';
      },
      'width': (val) => {
        const widthValue = this.parseSizeValue(val);
        return widthValue ? `w-${widthValue}` : null;
      },
      'height': (val) => {
        const heightValue = this.parseSizeValue(val);
        return heightValue ? `h-${heightValue}` : null;
      }
    };

    const converter = propertyMap[property];
    return converter ? converter(value) : null;
  }

  /**
   * Parse size values and convert to Tailwind spacing scale
   */
  parseSizeValue(value: string): string | null {
    // Remove units and convert to Tailwind scale
    const numericValue = parseFloat(value);
    
    if (value.includes('px')) {
      if (numericValue <= 4) return '1';
      if (numericValue <= 8) return '2';
      if (numericValue <= 12) return '3';
      if (numericValue <= 16) return '4';
      if (numericValue <= 20) return '5';
      if (numericValue <= 24) return '6';
      if (numericValue <= 32) return '8';
      if (numericValue <= 40) return '10';
      if (numericValue <= 48) return '12';
      return '16';
    }
    
    return null;
  }

  /**
   * Generate complete React component from parsed CSS
   */
  generateReactComponentFromCss(parsedCss: ParsedCSS): GeneratedComponent {
    const componentName = parsedCss.componentName;
    const tailwindClasses = this.convertCssToTailwind(parsedCss.cssRules);
    const jsxStructure = this.generateJsxFromFigmaStructure(parsedCss.cssRules);
    
    // Generate component code with proper structure
    const jsx = `import React from "react";
import { cn } from "@/lib/utils";

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className,
  children,
  text = "Generated Component",
  variant = "default",
  size = "md",
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "${tailwindClasses}",
        {
          "bg-primary text-primary-foreground": variant === "primary",
          "bg-secondary text-secondary-foreground": variant === "secondary",
        },
        {
          "text-sm p-2": size === "sm",
          "text-base p-3": size === "md",
          "text-lg p-4": size === "lg",
        },
        className
      )} 
      {...props}
    >
      ${jsxStructure}
      {text}
      {children}
    </div>
  );
};

export default ${componentName};`;

    // Generate standalone CSS
    const css = this.generateOptimizedCss(parsedCss);
    
    // Generate HTML version
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName}</title>
    <style>
${css}
    </style>
</head>
<body>
    <div class="${componentName.toLowerCase()}">
        Generated Component
    </div>
</body>
</html>`;

    return {
      jsx,
      css,
      html,
      tailwindClasses
    };
  }

  /**
   * Generate JSX structure from Figma CSS rules
   */
  generateJsxFromFigmaStructure(cssRules: CSSRule[]): string {
    // Simple JSX generation based on component structure
    const hasFlexLayout = cssRules.some(rule => 
      rule.declarations.some(decl => decl.property === 'display' && decl.value === 'flex')
    );
    
    if (hasFlexLayout) {
      return `
      <div className="flex items-center space-x-2">
        <span>Icon</span>
        <span>Label</span>
      </div>`;
    }
    
    return '';
  }

  /**
   * Generate optimized CSS from parsed structure
   */
  generateOptimizedCss(parsedCss: ParsedCSS): string {
    let css = '';
    
    for (const rule of parsedCss.cssRules) {
      css += `${rule.selector} {\n`;
      for (const declaration of rule.declarations) {
        css += `  ${declaration.property}: ${declaration.value};\n`;
      }
      css += '}\n\n';
    }
    
    // Add animations if any
    for (const animation of parsedCss.animations) {
      css += `${animation.definition}\n\n`;
    }
    
    // Add responsive rules
    for (const responsiveRule of parsedCss.responsiveRules) {
      css += `${responsiveRule}\n\n`;
    }
    
    return css.trim();
  }
}

export const cssParser = new CSSParser();
