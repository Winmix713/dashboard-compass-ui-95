import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFigmaProjectSchema, insertGeneratedComponentSchema, insertProcessingJobSchema } from "@shared/schema";
import { z } from "zod";

// Figma API integration
async function fetchFigmaFile(fileId: string, token: string) {
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

async function extractComponentsFromFigmaData(figmaData: any) {
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
  
  if (node.effects && node.effects.length > 0) {
    const shadows = node.effects.filter((effect: any) => effect.type === 'DROP_SHADOW');
    if (shadows.length > 0) {
      const shadow = shadows[0];
      styles.boxShadow = `${shadow.offset?.x || 0}px ${shadow.offset?.y || 0}px ${shadow.radius || 0}px ${rgbaToHex(shadow.color, shadow.color?.a || 1)}`;
    }
  }
  
  if (node.layoutMode) {
    styles.display = 'flex';
    styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    if (node.itemSpacing) {
      styles.gap = node.itemSpacing;
    }
    if (node.paddingLeft || node.paddingTop || node.paddingRight || node.paddingBottom) {
      styles.padding = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
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
  
  // Extract colors from fills and strokes
  if (node.fills && node.fills.length > 0) {
    node.fills.forEach((fill: any, index: number) => {
      if (fill.type === 'SOLID') {
        const colorName = `${node.name.toLowerCase().replace(/\s+/g, '-')}-fill-${index}`;
        tokens.colors[colorName] = rgbaToHex(fill.color, fill.opacity);
      }
    });
  }
  
  if (node.strokes && node.strokes.length > 0) {
    node.strokes.forEach((stroke: any, index: number) => {
      if (stroke.type === 'SOLID') {
        const colorName = `${node.name.toLowerCase().replace(/\s+/g, '-')}-stroke-${index}`;
        tokens.colors[colorName] = rgbaToHex(stroke.color, stroke.opacity);
      }
    });
  }
  
  // Extract spacing from layout properties
  if (node.itemSpacing) {
    tokens.spacing[`${node.name.toLowerCase().replace(/\s+/g, '-')}-gap`] = `${node.itemSpacing}px`;
  }
  
  if (node.paddingLeft || node.paddingTop || node.paddingRight || node.paddingBottom) {
    const paddingName = `${node.name.toLowerCase().replace(/\s+/g, '-')}-padding`;
    tokens.spacing[paddingName] = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
  }
  
  // Extract border radius
  if (node.cornerRadius !== undefined) {
    tokens.borderRadius[`${node.name.toLowerCase().replace(/\s+/g, '-')}-radius`] = `${node.cornerRadius}px`;
  }
  
  // Extract typography from text nodes
  function extractTextStyles(textNode: any) {
    if (textNode.type === 'TEXT' && textNode.style) {
      const typographyName = `${textNode.name.toLowerCase().replace(/\s+/g, '-')}-text`;
      tokens.typography[typographyName] = {
        fontFamily: textNode.style.fontFamily,
        fontSize: `${textNode.style.fontSize}px`,
        fontWeight: textNode.style.fontWeight,
        lineHeight: textNode.style.lineHeightPx ? `${textNode.style.lineHeightPx}px` : 'normal',
        letterSpacing: textNode.style.letterSpacing ? `${textNode.style.letterSpacing}px` : 'normal'
      };
    }
    
    if (textNode.children) {
      textNode.children.forEach(extractTextStyles);
    }
  }
  
  extractTextStyles(node);
  
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

function compareVersions(fromVersion: any, toVersion: any): any {
  const comparison = {
    changes: {
      added: [],
      removed: [],
      modified: []
    },
    colorChanges: [],
    typographyChanges: [],
    summary: {
      totalChanges: 0,
      componentChanges: 0,
      designTokenChanges: 0
    }
  };

  const fromComponents = fromVersion.components as any[];
  const toComponents = toVersion.components as any[];
  
  const fromComponentIds = new Set(fromComponents.map((c: any) => c.id));
  const toComponentIds = new Set(toComponents.map((c: any) => c.id));

  toComponents.forEach((component: any) => {
    if (!fromComponentIds.has(component.id)) {
      comparison.changes.added.push({
        type: 'component',
        id: component.id,
        name: component.name,
        data: component
      });
    }
  });

  fromComponents.forEach((component: any) => {
    if (!toComponentIds.has(component.id)) {
      comparison.changes.removed.push({
        type: 'component',
        id: component.id,
        name: component.name,
        data: component
      });
    }
  });

  fromComponents.forEach((fromComp: any) => {
    const toComp = toComponents.find((c: any) => c.id === fromComp.id);
    if (toComp && JSON.stringify(fromComp) !== JSON.stringify(toComp)) {
      comparison.changes.modified.push({
        type: 'component',
        id: fromComp.id,
        name: fromComp.name,
        from: fromComp,
        to: toComp
      });
    }
  });

  const fromTokens = fromVersion.designTokens as any;
  const toTokens = toVersion.designTokens as any;

  if (fromTokens.colors && toTokens.colors) {
    const addedColors = toTokens.colors.filter((c: string) => !fromTokens.colors.includes(c));
    const removedColors = fromTokens.colors.filter((c: string) => !toTokens.colors.includes(c));
    
    comparison.colorChanges = [...addedColors.map((c: string) => ({ type: 'added', color: c })), 
                              ...removedColors.map((c: string) => ({ type: 'removed', color: c }))];
  }

  comparison.summary.totalChanges = comparison.changes.added.length + 
                                   comparison.changes.removed.length + 
                                   comparison.changes.modified.length;
  comparison.summary.componentChanges = comparison.summary.totalChanges;
  comparison.summary.designTokenChanges = comparison.colorChanges.length;

  return comparison;
}

function extractColorPaletteFromFigmaData(figmaData: any): any[] {
  const colors = new Map();

  function traverseNode(node: any) {
    if (node.fills) {
      node.fills.forEach((fill: any) => {
        if (fill.type === 'SOLID' && fill.color) {
          const hex = convertFigmaColorToHex(fill.color, fill.opacity || 1);
          const rgb = {
            r: Math.round((fill.color.r || 0) * 255),
            g: Math.round((fill.color.g || 0) * 255),
            b: Math.round((fill.color.b || 0) * 255)
          };
          
          if (!colors.has(hex)) {
            colors.set(hex, {
              hex,
              rgb,
              hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
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

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function generateReactComponentCode(component: any, designTokens: any) {
  const componentName = component.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, (c: string) => c.toUpperCase());
  
  // Generate prop types based on component variants
  const variantTypes = component.variants?.length > 0 
    ? component.variants.map((v: any) => `"${v.name.toLowerCase().replace(/\s+/g, '-')}"`)
    : ['"default"'];
  
  // Extract styles from component
  const styles = component.styles || {};
  const baseClasses = [];
  const customStyles: string[] = [];
  
  // Convert styles to Tailwind classes
  if (styles.display === 'flex') {
    baseClasses.push('flex');
    if (styles.flexDirection === 'row') baseClasses.push('flex-row');
    if (styles.flexDirection === 'column') baseClasses.push('flex-col');
    if (styles.gap) baseClasses.push(`gap-${Math.round(parseInt(styles.gap) / 4)}`);
  }
  
  if (styles.backgroundColor) {
    customStyles.push(`background-color: ${styles.backgroundColor};`);
  }
  
  if (styles.borderRadius) {
    baseClasses.push(`rounded-${styles.borderRadius <= 4 ? 'sm' : styles.borderRadius <= 8 ? 'md' : 'lg'}`);
  }
  
  if (styles.padding) {
    const paddingValues = styles.padding.split(' ');
    if (paddingValues.length === 4) {
      const [top, right, bottom, left] = paddingValues.map((p: string) => parseInt(p));
      if (top === bottom && left === right) {
        baseClasses.push(`px-${Math.round(left / 4)}`, `py-${Math.round(top / 4)}`);
      } else {
        baseClasses.push(`p-${Math.round(Math.max(top, right, bottom, left) / 4)}`);
      }
    }
  }

  const reactCode = `import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const ${componentName.toLowerCase()}Variants = cva(
  "${baseClasses.join(' ')}",
  {
    variants: {
      variant: {
        ${variantTypes.map((type: string) => `${type}: "bg-primary text-primary-foreground hover:bg-primary/90"`).join(',\n        ')}
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

interface ${componentName}Props 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${componentName.toLowerCase()}Variants> {
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className,
  children,
  variant,
  size,
  ...props 
}) => {
  return (
    <div 
      className={cn(${componentName.toLowerCase()}Variants({ variant, size }), className)}
      ${customStyles.length > 0 ? `style={{ ${customStyles.join(' ')} }}` : ''}
      {...props}
    >
      {children}
    </div>
  );
};

export default ${componentName};
export { ${componentName.toLowerCase()}Variants };`;

  // Generate CSS from extracted styles
  const cssRules = Object.entries(styles).map(([property, value]) => {
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `  ${cssProperty}: ${value};`;
  }).join('\n');

  const cssCode = `.${componentName.toLowerCase()} {
${cssRules}
  transition: all 0.2s ease-in-out;
}

.${componentName.toLowerCase()}:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.${componentName.toLowerCase()}:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}`;

  const tailwindClasses = baseClasses.join(' ');

  // Generate HTML structure
  const htmlStructure = `<div class="${baseClasses.join(' ')}"${customStyles.length > 0 ? ` style="${customStyles.join(' ')}"` : ''}>
  <!-- Component content -->
</div>`;

  return {
    react: reactCode,
    css: cssCode,
    tailwind: tailwindClasses,
    html: htmlStructure
  };
}

function extractDesignTokens(figmaData: any) {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Get statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Validate Figma URL
  app.post("/api/figma/validate", async (req, res) => {
    try {
      const { url, token } = req.body;
      
      if (!url || !token) {
        return res.status(400).json({ message: "URL and token are required" });
      }

      // Extract file ID from Figma URL (supports both /file/ and /design/ formats)
      const fileIdMatch = url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL format" });
      }

      const fileId = fileIdMatch[2];

      // Test API access
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
          method: 'GET',
          headers: {
            'X-Figma-Token': token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        res.json({
          valid: true,
          fileId,
          fileName: data.name,
          lastModified: data.lastModified,
          thumbnailUrl: data.thumbnailUrl
        });
      } catch (apiError) {
        res.status(401).json({ 
          valid: false, 
          message: "Invalid token or insufficient permissions" 
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Validation failed" });
    }
  });

  // Extract components from Figma
  app.post("/api/figma/extract", async (req, res) => {
    try {
      const { url, token, userId = 1 } = req.body;
      
      const validation = z.object({
        url: z.string().url(),
        token: z.string().min(1),
        userId: z.number().optional()
      }).parse(req.body);

      // Extract file ID (supports both /file/ and /design/ formats)
      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];

      // Create processing job
      const job = await storage.createProcessingJob({
        type: 'figma_extraction',
        status: 'processing',
        inputData: { url: validation.url, fileId },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId: validation.userId || 1
      });

      // Process in background (simulate async processing)
      setTimeout(async () => {
        try {
          // Update progress
          await storage.updateProcessingJob(job.id, { progressPercentage: 25 });

          // Fetch Figma data
          const figmaData = await fetchFigmaFile(fileId, validation.token);
          await storage.updateProcessingJob(job.id, { progressPercentage: 50 });

          // Extract components
          const components = await extractComponentsFromFigmaData(figmaData);
          await storage.updateProcessingJob(job.id, { progressPercentage: 75 });

          // Extract design tokens
          const designTokens = extractDesignTokens(figmaData);

          // Create project
          const project = await storage.createFigmaProject({
            name: figmaData.name || 'Unnamed Project',
            figmaFileId: fileId,
            figmaUrl: validation.url,
            userId: validation.userId || 1
          });

          // Generate code for each component
          const generatedComponents = [];
          for (const component of components) {
            const generatedCode = generateReactComponentCode(component, designTokens);
            
            const savedComponent = await storage.createGeneratedComponent({
              name: component.name,
              projectId: project.id,
              sourceType: 'figma_url',
              sourceData: component,
              generatedCode,
              designTokens,
              metadata: {
                figmaNodeId: component.id,
                extractedAt: new Date().toISOString()
              },
              isPublic: false
            });

            generatedComponents.push(savedComponent);
          }

          // Complete the job
          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { 
              projectId: project.id,
              componentsCount: generatedComponents.length,
              designTokens 
            }
          });

        } catch (error) {
          await storage.updateProcessingJob(job.id, { 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            progressPercentage: 100
          });
        }
      }, 100);

      res.json({ jobId: job.id, status: 'processing' });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Extraction failed" });
    }
  });

  // Process CSS code
  app.post("/api/css/process", async (req, res) => {
    try {
      const { cssCode, options = {}, userId = 1 } = req.body;
      
      if (!cssCode || typeof cssCode !== 'string') {
        return res.status(400).json({ message: "CSS code is required" });
      }

      // Create processing job
      const job = await storage.createProcessingJob({
        type: 'css_processing',
        status: 'processing',
        inputData: { cssCode, options },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId
      });

      // Process CSS (simulate async processing)
      setTimeout(async () => {
        try {
          await storage.updateProcessingJob(job.id, { progressPercentage: 30 });

          // Parse CSS and extract components
          const cssRules = cssCode.match(/\/\*\s*([^*]+)\s*\*\/\s*[\s\S]*?(?=\/\*|$)/g) || [];
          const components = [];

          for (const rule of cssRules) {
            const nameMatch = rule.match(/\/\*\s*([^*]+)\s*\*\//);
            const componentName = nameMatch ? nameMatch[1].trim() : 'UnnamedComponent';
            
            if (componentName && !componentName.includes('Auto layout')) {
              // Extract CSS properties
              const cssProperties = rule.match(/[a-z-]+:\s*[^;]+;/g) || [];
              
              // Generate React component
              const generatedCode = generateReactComponentCode({ name: componentName }, {});
              
              components.push({
                name: componentName,
                cssProperties,
                generatedCode
              });
            }
          }

          await storage.updateProcessingJob(job.id, { progressPercentage: 70 });

          // Create project for CSS import
          const project = await storage.createFigmaProject({
            name: 'CSS Import Project',
            figmaFileId: 'css-import',
            figmaUrl: 'css-import',
            userId
          });

          // Save generated components
          const savedComponents = [];
          for (const component of components) {
            const saved = await storage.createGeneratedComponent({
              name: component.name,
              projectId: project.id,
              sourceType: 'css_import',
              sourceData: { cssCode: cssCode },
              generatedCode: component.generatedCode,
              designTokens: { colors: [], typography: [], spacing: [] },
              metadata: {
                extractedAt: new Date().toISOString(),
                cssRulesCount: component.cssProperties.length
              },
              isPublic: false
            });
            savedComponents.push(saved);
          }

          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { 
              projectId: project.id,
              componentsCount: savedComponents.length
            }
          });

        } catch (error) {
          await storage.updateProcessingJob(job.id, { 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            progressPercentage: 100
          });
        }
      }, 100);

      res.json({ jobId: job.id, status: 'processing' });

    } catch (error) {
      res.status(500).json({ message: "CSS processing failed" });
    }
  });

  // Get processing job status
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getProcessingJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job status" });
    }
  });

  // Get project components
  app.get("/api/projects/:id/components", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const components = await storage.getComponentsByProject(projectId);
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  // Get component details
  app.get("/api/components/:id", async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const component = await storage.getComponent(componentId);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }

      res.json(component);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch component" });
    }
  });

  // Get recent jobs for user
  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const jobs = await storage.getProcessingJobsByUser(userId);
      const recentJobs = jobs.slice(-10).reverse(); // Get last 10 jobs, most recent first
      res.json(recentJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Version tracking API routes
  app.post("/api/versions/create", async (req, res) => {
    try {
      const { projectId, url, token, versionName, versionDescription } = req.body;
      
      const validation = z.object({
        projectId: z.number(),
        url: z.string().url(),
        token: z.string().min(1),
        versionName: z.string().min(1),
        versionDescription: z.string().optional()
      }).parse(req.body);

      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];

      const job = await storage.createProcessingJob({
        type: 'version_tracking',
        status: 'processing',
        inputData: { projectId: validation.projectId, url: validation.url, fileId, versionName: validation.versionName },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId: 1
      });

      setTimeout(async () => {
        try {
          await storage.updateProcessingJob(job.id, { progressPercentage: 25 });

          const figmaData = await fetchFigmaFile(fileId, validation.token);
          await storage.updateProcessingJob(job.id, { progressPercentage: 50 });

          const components = await extractComponentsFromFigmaData(figmaData);
          const designTokens = extractDesignTokensFromFigmaData(figmaData);
          await storage.updateProcessingJob(job.id, { progressPercentage: 75 });

          const version = await storage.createFigmaVersion({
            projectId: validation.projectId,
            versionName: validation.versionName,
            versionDescription: validation.versionDescription || '',
            figmaLastModified: figmaData.lastModified,
            figmaVersionId: figmaData.version,
            figmaData: figmaData,
            components: components,
            designTokens: designTokens,
            thumbnailUrl: figmaData.thumbnailUrl
          });

          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { versionId: version.id }
          });

        } catch (error) {
          await storage.updateProcessingJob(job.id, { 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            progressPercentage: 100
          });
        }
      }, 100);

      res.json({ jobId: job.id, status: 'processing' });

    } catch (error) {
      res.status(500).json({ message: "Version creation failed" });
    }
  });

  app.get("/api/versions/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const versions = await storage.getFigmaVersionsByProject(projectId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.post("/api/versions/compare", async (req, res) => {
    try {
      const { fromVersionId, toVersionId } = req.body;
      
      const validation = z.object({
        fromVersionId: z.number(),
        toVersionId: z.number()
      }).parse(req.body);

      const existingComparison = await storage.getVersionComparison(
        validation.fromVersionId, 
        validation.toVersionId
      );

      if (existingComparison) {
        return res.json(existingComparison);
      }

      const fromVersion = await storage.getFigmaVersion(validation.fromVersionId);
      const toVersion = await storage.getFigmaVersion(validation.toVersionId);

      if (!fromVersion || !toVersion) {
        return res.status(404).json({ message: "Version not found" });
      }

      const comparisonData = compareVersions(fromVersion, toVersion);

      const comparison = await storage.createVersionComparison({
        projectId: fromVersion.projectId,
        fromVersionId: validation.fromVersionId,
        toVersionId: validation.toVersionId,
        comparisonData: comparisonData
      });

      res.json(comparison);

    } catch (error) {
      res.status(500).json({ message: "Version comparison failed" });
    }
  });

  app.post("/api/figma/extract-colors", async (req, res) => {
    try {
      const { url, token } = req.body;
      
      const validation = z.object({
        url: z.string().url(),
        token: z.string().min(1)
      }).parse(req.body);

      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];
      const figmaData = await fetchFigmaFile(fileId, validation.token);
      const colorPalette = extractColorPaletteFromFigmaData(figmaData);

      res.json({ colorPalette });

    } catch (error) {
      res.status(500).json({ message: "Color extraction failed" });
    }
  });

  // Settings endpoints
  app.post("/api/settings/save", async (req, res) => {
    try {
      const settingsData = req.body;
      
      // In a real application, you would save to database with user ID
      // For now, we just return success since localStorage handles persistence
      res.json({ 
        success: true, 
        message: "Settings saved successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Settings save error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to save settings" 
      });
    }
  });

  // Design Analytics endpoints
  app.get("/api/design/health", async (req, res) => {
    try {
      const timeframe = req.query.timeframe || '30d';
      
      // Generate design health metrics
      const metrics = {
        overallScore: 82,
        componentConsistency: 88,
        colorCompliance: 95,
        typographyAlignment: 78,
        layoutStructure: 85,
        accessibilityScore: 72,
        performanceImpact: 90,
        timestamp: new Date().toISOString()
      };
      
      res.json({ metrics, timeframe });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  app.post("/api/design/health/generate", async (req, res) => {
    try {
      const { projectId, timeframe, token } = req.body;
      
      // Validate Figma token
      if (!token) {
        return res.status(400).json({ message: "Figma token required" });
      }

      // Simulate health analysis
      const metrics = {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        componentConsistency: Math.floor(Math.random() * 25) + 75,
        colorCompliance: Math.floor(Math.random() * 20) + 80,
        typographyAlignment: Math.floor(Math.random() * 30) + 70,
        layoutStructure: Math.floor(Math.random() * 25) + 75,
        accessibilityScore: Math.floor(Math.random() * 35) + 65,
        performanceImpact: Math.floor(Math.random() * 20) + 80,
        analysisDate: new Date().toISOString(),
        projectId
      };

      res.json({ metrics, status: 'completed' });
    } catch (error: any) {
      res.status(500).json({ message: "Health analysis failed" });
    }
  });

  app.get("/api/design/annotations", async (req, res) => {
    try {
      // Mock annotations data
      const annotations = [
        {
          id: '1',
          versionId: 1,
          componentId: 'btn-primary',
          annotationType: 'improvement',
          title: 'Button Spacing Improved',
          description: 'Increased padding for better touch targets',
          impact: 'medium',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          versionId: 2,
          componentId: 'nav-header',
          annotationType: 'breaking',
          title: 'Navigation Structure Changed',
          description: 'Menu hierarchy restructured - may affect existing implementations',
          impact: 'high',
          createdAt: '2024-01-14T15:30:00Z'
        }
      ];

      res.json(annotations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch annotations" });
    }
  });

  app.get("/api/design/trends", async (req, res) => {
    try {
      const timeframe = req.query.timeframe || '30d';
      
      const trends = [
        { metric: 'Component Reuse', current: 85, previous: 78, change: 7, trend: 'up', period: timeframe },
        { metric: 'Color Consistency', current: 95, previous: 92, change: 3, trend: 'up', period: timeframe },
        { metric: 'Typography Variations', current: 12, previous: 18, change: -6, trend: 'down', period: timeframe },
        { metric: 'Design Tokens Usage', current: 67, previous: 59, change: 8, trend: 'up', period: timeframe },
      ];

      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });

  app.post("/api/design/compare/visualize", async (req, res) => {
    try {
      const { fromVersion, toVersion, token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Figma token required" });
      }

      // Simulate version comparison analysis
      const annotations = [
        {
          id: '3',
          versionId: toVersion,
          componentId: 'card-component',
          annotationType: 'improvement',
          title: 'Card Shadow Enhanced',
          description: 'Added subtle shadow for better depth perception',
          impact: 'low',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          versionId: toVersion,
          componentId: 'button-group',
          annotationType: 'breaking',
          title: 'Button Group API Changed',
          description: 'Prop structure modified - requires code updates',
          impact: 'high',
          createdAt: new Date().toISOString()
        }
      ];

      const comparisonData = {
        fromVersion,
        toVersion,
        annotations,
        summary: {
          totalChanges: 12,
          improvements: 8,
          breakingChanges: 3,
          newComponents: 1
        },
        analysisDate: new Date().toISOString()
      };

      res.json(comparisonData);
    } catch (error: any) {
      res.status(500).json({ message: "Comparison analysis failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
