
// Figma API integration utilities
export async function fetchFigmaFile(fileId: string, token: string) {
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Invalid Figma token or insufficient permissions. Please check your API token.');
      }
      if (response.status === 404) {
        throw new Error('Figma file not found. Please check the file ID and ensure you have access.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Figma API. Please check your internet connection.');
  }
}

export async function extractComponentsFromFigmaData(figmaData: any) {
  const components: any[] = [];
  
  function traverseNode(node: any) {
    if (node.type === 'COMPONENT') {
      components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        styles: extractNodeStyles(node),
        absoluteBoundingBox: node.absoluteBoundingBox,
        children: node.children || [],
        variants: [],
        designTokens: extractDesignTokensFromNode(node)
      });
    }
    
    if (node.type === 'COMPONENT_SET') {
      const variants = node.children?.filter((child: any) => child.type === 'COMPONENT') || [];
      components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        styles: extractNodeStyles(node),
        absoluteBoundingBox: node.absoluteBoundingBox,
        children: node.children || [],
        variants: variants.map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          properties: variant.componentPropertyDefinitions || {},
          styles: extractNodeStyles(variant)
        })),
        designTokens: extractDesignTokensFromNode(node)
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

function extractNodeStyles(node: any) {
  const styles: any = {};
  
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID') {
      styles.backgroundColor = rgbaToHex(fill.color, fill.opacity);
    }
  }
  
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === 'SOLID') {
      styles.borderColor = rgbaToHex(stroke.color, stroke.opacity);
      styles.borderWidth = node.strokeWeight || 1;
    }
  }
  
  if (node.cornerRadius !== undefined) {
    styles.borderRadius = node.cornerRadius;
  }
  
  if (node.layoutMode) {
    styles.display = 'flex';
    styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    if (node.itemSpacing) {
      styles.gap = node.itemSpacing;
    }
  }
  
  return styles;
}

function extractDesignTokensFromNode(node: any): any {
  const tokens: any = {
    colors: {},
    spacing: {},
    typography: {},
    borderRadius: {},
    shadows: {}
  };
  
  if (node.fills && node.fills.length > 0) {
    node.fills.forEach((fill: any, index: number) => {
      if (fill.type === 'SOLID') {
        const colorName = `${node.name.toLowerCase().replace(/\s+/g, '-')}-fill-${index}`;
        tokens.colors[colorName] = rgbaToHex(fill.color, fill.opacity);
      }
    });
  }
  
  return tokens;
}

function rgbaToHex(color: any, opacity: number = 1): string {
  if (!color) return '#000000';
  
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  
  if (opacity < 1) {
    const a = Math.round(opacity * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
  }
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function generateReactComponentCode(component: any, designTokens: any) {
  const componentName = component.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, (c: string) => c.toUpperCase());
  
  const reactCode = `import React from "react";

const ${componentName}: React.FC = () => {
  return (
    <div className="p-4 border rounded">
      {/* ${component.name} component */}
    </div>
  );
};

export default ${componentName};`;

  const cssCode = `.${componentName.toLowerCase()} {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}`;

  return {
    react: reactCode,
    css: cssCode,
    tailwind: "p-4 border rounded",
    html: `<div class="p-4 border rounded">${component.name}</div>`
  };
}

export function extractDesignTokens(figmaData: any) {
  const colors: any[] = [];
  const typography: any[] = [];
  const spacing: any[] = [];

  spacing.push(
    { name: 'xs', value: '4px' },
    { name: 'sm', value: '8px' },
    { name: 'md', value: '16px' },
    { name: 'lg', value: '24px' },
    { name: 'xl', value: '32px' }
  );

  return { colors, typography, spacing };
}

export function extractColorPaletteFromFigmaData(figmaData: any): any[] {
  const colors = new Map();

  function traverseNode(node: any) {
    if (node.fills) {
      node.fills.forEach((fill: any) => {
        if (fill.type === 'SOLID' && fill.color) {
          const hex = rgbaToHex(fill.color, fill.opacity || 1);
          const rgb = {
            r: Math.round((fill.color.r || 0) * 255),
            g: Math.round((fill.color.g || 0) * 255),
            b: Math.round((fill.color.b || 0) * 255)
          };
          
          if (!colors.has(hex)) {
            colors.set(hex, {
              hex,
              rgb,
              opacity: fill.opacity || 1,
              usage: node.name || 'Unnamed'
            });
          }
        }
      });
    }

    if (node.children) {
      node.children.forEach(traverseNode);
    }
  }

  if (figmaData.document) {
    traverseNode(figmaData.document);
  }

  return Array.from(colors.values());
}
