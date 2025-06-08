/**
 * Figma CSS Parser
 * 
 * This utility provides functions to parse Figma CSS code and extract
 * component structure, styles, and other metadata.
 */

export interface ParsedCSS {
  componentName: string;
  cssRules: CssRule[];
  responsiveRules: ResponsiveRule[];
  animations: AnimationRule[];
  customProperties: CustomProperty[];
  layoutType: 'flexbox' | 'grid' | 'absolute' | 'static';
  designTokens: Record<string, string>;
  originalStructure: any;
  htmlStructure: string;
  optimizedCss: string;
  tailwindClasses: {
    main: string;
    customStyles: string[];
  };
}

export interface CssRule {
  selector: string;
  properties: Record<string, string>;
  pseudoClasses: string[];
}

export interface ResponsiveRule {
  breakpoint: string;
  minWidth?: string;
  maxWidth?: string;
  rules: CssRule[];
}

export interface AnimationRule {
  name: string;
  duration: string;
  timingFunction: string;
  keyframes: Record<string, Record<string, string>>;
}

export interface CustomProperty {
  name: string;
  value: string;
  usage: string[];
}

export interface GeneratedComponent {
  jsx: string;
  css: string;
  html: string;
  tailwindClasses: string;
}

/**
 * Enhanced function to parse Figma CSS with improved component extraction
 */
export function parseFigmaCss(cssCode: string): ParsedCSS {
  // Extract component name from CSS classes or generate one
  const componentName = extractComponentNameFromCss(cssCode) || "FigmaComponent";
  
  // Parse CSS rules
  const cssRules = parseCssRules(cssCode);
  const responsiveRules = extractResponsiveRules(cssCode);
  const animations = extractAnimations(cssCode);
  const customProperties = extractCustomProperties(cssCode);
  
  // Extract HTML structure
  const originalStructure = extractHtmlStructure(cssCode);
  const htmlStructure = generateHtmlFromStructure(originalStructure);
  
  // Generate optimized CSS
  const optimizedCss = generateOptimizedCss({
    componentName,
    cssRules,
    responsiveRules,
    animations,
    customProperties
  });
  
  // Convert CSS to Tailwind classes
  const tailwindClasses = convertCssToTailwind(cssRules);

  // Detect layout type and generate design tokens
  const layoutType = detectLayoutTypeFromRules(cssRules);
  const designTokens = generateDesignTokensFromRules(cssRules);
  
  return {
    componentName,
    cssRules: cssRules.map((rule: any) => ({
      selector: rule.selector || '',
      properties: rule.declarations?.reduce((acc: any, decl: any) => {
        acc[decl.property] = decl.value;
        return acc;
      }, {}) || {},
      pseudoClasses: []
    })),
    responsiveRules: responsiveRules.map((rule: string) => ({
      breakpoint: rule,
      rules: []
    })) as ResponsiveRule[],
    animations: animations.map((anim: any) => ({
      name: anim.name || '',
      duration: '0.3s',
      timingFunction: 'ease',
      keyframes: {}
    })),
    customProperties: customProperties.map((prop: any) => ({
      name: prop.name || '',
      value: prop.value || '',
      usage: []
    })),
    layoutType,
    designTokens,
    originalStructure,
    htmlStructure,
    optimizedCss,
    tailwindClasses
  };
}

/**
 * Legacy function maintained for compatibility
 */
export function parseFigmaCssToComponent(cssCode: string): ParsedCSS {
  const result = parseFigmaCss(cssCode);
  
  // Parse CSS rules with legacy method
  const cssRules = parseCssRules(cssCode);
  const responsiveRules = extractResponsiveRules(cssCode);
  const animations = extractAnimations(cssCode);
  const customProperties = extractCustomProperties(cssCode);
  
  // Extract HTML structure
  const originalStructure = extractHtmlStructure(cssCode);
  const htmlStructure = generateHtmlFromStructure(originalStructure);
  
  // Generate optimized CSS
  const optimizedCss = generateOptimizedCss({
    componentName: result.componentName,
    cssRules,
    responsiveRules,
    animations,
    customProperties
  });
  
  // Convert CSS to Tailwind classes
  const tailwindClasses = convertCssToTailwind(cssRules);
  
  return {
    ...result,
    cssRules,
    responsiveRules: responsiveRules.map((rule: string) => ({
      breakpoint: rule,
      rules: []
    })) as ResponsiveRule[],
    animations,
    customProperties,
    originalStructure,
    htmlStructure,
    optimizedCss,
    tailwindClasses
  };
}

/**
 * Generate React component from parsed CSS
 */
export function generateReactComponentFromCss(parsedCss: ParsedCSS): GeneratedComponent {
  const componentName = parsedCss.componentName;
  
  // Generate JSX structure based on Figma components
  const jsxStructure = generateJsxFromFigmaStructure(parsedCss.cssRules);
  
  // Convert CSS to Tailwind classes where possible
  const tailwindClasses = parsedCss.tailwindClasses.main;
  
  // Generate component code with proper structure
  const jsx = `import React from "react";

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
  text = "Brief generated",
  variant = "default",
  size = "md",
  ...props 
}) => {
  return (
    <div 
      className={\`${tailwindClasses} \${className || ""}\`} 
      {...props}
    >
      ${jsxStructure}
      {children}
    </div>
  );
};

export default ${componentName};`;

  // Generate standalone CSS
  const css = parsedCss.optimizedCss;
  
  // Generate HTML version
  const html = `<!DOCTYPE html>
<html lang="hu">
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
        ${parsedCss.htmlStructure}
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
 * Extract component name from CSS code
 */
function extractComponentNameFromCss(css: string): string {
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
 * Parse CSS rules from CSS code
 */
function parseCssRules(css: string) {
  const rules: any[] = [];
  
  // First, handle Figma CSS blocks that don't have explicit selectors
  const figmaBlocks = parseFigmaCssBlocks(css);
  
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
        declarations: parseDeclarations(declarations),
        originalRule: match[0]
      });
    }
  }
  
  // Add parsed Figma blocks as rules
  rules.push(...figmaBlocks);
  
  return rules;
}

/**
 * Parse Figma CSS blocks that don't have explicit selectors
 */
function parseFigmaCssBlocks(css: string) {
  const blocks: any[] = [];
  
  // Split CSS by comments that indicate component names
  const commentRegex = /\/\*\s*([^*]+)\s*\*\//g;
  const parts = css.split(commentRegex);
  
  for (let i = 1; i < parts.length; i += 2) {
    const componentName = parts[i].trim();
    const cssContent = parts[i + 1] ? parts[i + 1].trim() : '';
    
    if (cssContent && componentName && !componentName.includes('Auto layout') && !componentName.includes('Inside auto layout')) {
      // Extract CSS declarations from the block
      const declarations = extractDeclarationsFromBlock(cssContent);
      
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
 * Extract declarations from a CSS block
 */
function extractDeclarationsFromBlock(cssBlock: string) {
  const declarations: any[] = [];
  
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
 * Parse declarations from a CSS rule
 */
function parseDeclarations(declarations: string) {
  return declarations.split(';')
    .filter(decl => decl.trim())
    .map(decl => {
      const [property, value] = decl.split(':').map(s => s.trim());
      return { property, value };
    });
}

/**
 * Extract responsive rules from CSS code
 */
function extractResponsiveRules(css: string) {
  const mediaRules: string[] = [];
  const mediaRegex = /@media\s*\([^)]+\)\s*\{[^{}]*(?:\{[^}]*\}[^{}]*)*\}/g;
  let match;
  
  while ((match = mediaRegex.exec(css)) !== null) {
    mediaRules.push(match[0]);
  }
  
  return mediaRules;
}

/**
 * Extract animations from CSS code
 */
function extractAnimations(css: string) {
  const animations: any[] = [];
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
 * Extract custom properties from CSS code
 */
function extractCustomProperties(css: string) {
  const properties: any[] = [];
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
 * Extract HTML structure from CSS code
 */
function extractHtmlStructure(css: string) {
  // Analyze CSS selectors to infer HTML structure
  const selectors = css.match(/[^{]+(?=\s*\{)/g) || [];
  const structure = {
    elements: [],
    hierarchy: buildElementHierarchy(selectors)
  };
  
  return structure;
}

/**
 * Build element hierarchy from CSS selectors
 */
function buildElementHierarchy(selectors: string[]) {
  // Build a tree structure from CSS selectors
  const hierarchy: any[] = [];
  
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
 * Generate HTML from structure
 */
function generateHtmlFromStructure(structure: any) {
  if (!structure.hierarchy || structure.hierarchy.length === 0) {
    return '<div class="figma-content">Figma komponens tartalma</div>';
  }
  
  return structure.hierarchy.map((item: any) => {
    const elementType = inferElementType(item.selector);
    const className = extractClassFromSelector(item.selector);
    
    return `<${elementType} class="${className}">
      <!-- ${item.selector} -->
    </${elementType}>`;
  }).join('\n        ');
}

/**
 * Infer element type from CSS selector
 */
function inferElementType(selector: string): string {
  if (selector.includes('button') || selector.includes('btn')) return 'button';
  if (selector.includes('header')) return 'header';
  if (selector.includes('footer')) return 'footer';
  if (selector.includes('nav')) return 'nav';
  if (selector.includes('main')) return 'main';
  if (selector.includes('section')) return 'section';
  if (selector.includes('article')) return 'article';
  if (selector.includes('aside')) return 'aside';
  if (selector.includes('h1') || selector.includes('title')) return 'h1';
  if (selector.includes('h2')) return 'h2';
  if (selector.includes('h3')) return 'h3';
  if (selector.includes('p') || selector.includes('text')) return 'p';
  if (selector.includes('span')) return 'span';
  if (selector.includes('img') || selector.includes('image')) return 'img';
  if (selector.includes('a') || selector.includes('link')) return 'a';
  if (selector.includes('ul') || selector.includes('list')) return 'ul';
  if (selector.includes('li') || selector.includes('item')) return 'li';
  return 'div';
}

/**
 * Extract class from CSS selector
 */
function extractClassFromSelector(selector: string): string {
  const classMatch = selector.match(/\.([a-zA-Z0-9-_]+)/);
  return classMatch ? classMatch[1] : 'figma-element';
}

/**
 * Convert CSS to Tailwind classes
 */
function convertCssToTailwind(cssRules: any[]) {
  const tailwindMap: { [key: string]: string } = {
    'display: flex': 'flex',
    'display: block': 'block',
    'display: inline': 'inline',
    'display: inline-block': 'inline-block',
    'display: grid': 'grid',
    'flex-direction: column': 'flex-col',
    'flex-direction: row': 'flex-row',
    'justify-content: center': 'justify-center',
    'justify-content: space-between': 'justify-between',
    'justify-content: flex-start': 'justify-start',
    'justify-content: flex-end': 'justify-end',
    'align-items: center': 'items-center',
    'align-items: flex-start': 'items-start',
    'align-items: flex-end': 'items-end',
    'text-align: center': 'text-center',
    'text-align: left': 'text-left',
    'text-align: right': 'text-right',
    'font-weight: bold': 'font-bold',
    'font-weight: 600': 'font-semibold',
    'font-weight: 500': 'font-medium',
    'font-weight: 400': 'font-normal',
    'font-weight: 300': 'font-light',
    'position: relative': 'relative',
    'position: absolute': 'absolute',
    'position: fixed': 'fixed',
    'position: sticky': 'sticky',
    'overflow: hidden': 'overflow-hidden',
    'overflow: auto': 'overflow-auto',
    'border-radius: 50%': 'rounded-full',
    'cursor: pointer': 'cursor-pointer',
    'box-sizing: border-box': '',
    'isolation: isolate': 'isolate'
  };

  let mainClasses = '';
  const customStyles: string[] = [];
  
  cssRules.forEach(rule => {
    if (rule.declarations) {
      rule.declarations.forEach((decl: any) => {
        const cssDecl = `${decl.property}: ${decl.value}`;
        
        if (tailwindMap[cssDecl]) {
          mainClasses += tailwindMap[cssDecl] + ' ';
        } else {
          // Handle specific Figma properties
          switch (decl.property) {
            case 'border-radius':
              if (decl.value.includes('100px')) {
                mainClasses += 'rounded-full ';
              } else if (decl.value.includes('90px')) {
                mainClasses += 'rounded-full ';
              } else {
                mainClasses += 'rounded-lg ';
              }
              break;
              
            case 'padding':
              const paddingValues = decl.value.split(' ');
              if (paddingValues.length === 1) {
                mainClasses += 'p-4 ';
              } else if (paddingValues.length === 2) {
                mainClasses += 'py-3 px-6 ';
              }
              break;
              
            case 'gap':
              if (decl.value === '10px') {
                mainClasses += 'gap-2.5 ';
              } else if (decl.value === '8px') {
                mainClasses += 'gap-2 ';
              }
              break;
              
            case 'width':
            case 'height':
              // Add custom styles for exact dimensions
              customStyles.push(`${decl.property}: ${decl.value}`);
              break;
              
            case 'background':
              if (decl.value.startsWith('#')) {
                customStyles.push(`background-color: ${decl.value}`);
              } else {
                customStyles.push(`background: ${decl.value}`);
              }
              break;
              
            case 'box-shadow':
              customStyles.push(`box-shadow: ${decl.value}`);
              break;
              
            case 'backdrop-filter':
              customStyles.push(`backdrop-filter: ${decl.value}`);
              break;
          }
        }
      });
    }
  });
  
  return {
    main: mainClasses.trim(),
    customStyles
  };
}

/**
 * Generate optimized CSS from parsed CSS
 */
function generateOptimizedCss(parsedCss: any) {
  const { componentName, cssRules, responsiveRules, animations, customProperties } = parsedCss;
  
  let css = `/* ${componentName} Component */\n\n`;
  
  // Add custom properties
  if (customProperties.length > 0) {
    css += ':root {\n';
    customProperties.forEach((prop: any) => {
      css += `  --${prop.name}: ${prop.value};\n`;
    });
    css += '}\n\n';
  }
  
  // Add main component styles
  cssRules.forEach((rule: any) => {
    if (rule.selector && rule.declarations) {
      css += `${rule.selector} {\n`;
      rule.declarations.forEach((decl: any) => {
        css += `  ${decl.property}: ${decl.value};\n`;
      });
      css += '}\n\n';
    }
  });
  
  // Add responsive rules
  responsiveRules.forEach((rule: string) => {
    css += `${rule}\n\n`;
  });
  
  // Add animations
  animations.forEach((anim: any) => {
    css += `${anim.definition}\n\n`;
  });
  
  return css;
}

function generateJsxFromFigmaStructure(cssRules: any[]) {
  // Analyze CSS rules to determine component structure
  const hasButton = cssRules.some(rule => 
    rule.figmaComponent && (rule.figmaComponent.includes('button') || rule.figmaComponent.includes('Button'))
  );
  
  const hasText = cssRules.some(rule => 
    rule.figmaComponent && (rule.figmaComponent.includes('Brief') || rule.figmaComponent.includes('text'))
  );
  
  const hasIcon = cssRules.some(rule => 
    rule.figmaComponent && (rule.figmaComponent.includes('check') || rule.figmaComponent.includes('Icon'))
  );
  
  const hasFrame = cssRules.some(rule => 
    rule.figmaComponent && rule.figmaComponent.includes('Frame')
  );

  // Generate appropriate JSX structure
  if (hasButton || hasFrame) {
    return `<div className="frame-content">
        ${hasText ? `<span className="button-text">{text}</span>` : ''}
        ${hasIcon ? `<div className="check-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#00A656"/>
            <path d="M6.5 9.5L4.5 7.5L3.5 8.5L6.5 11.5L12.5 5.5L11.5 4.5L6.5 9.5Z" fill="white"/>
          </svg>
        </div>` : ''}
      </div>`;
  }
  
  return `<div className="figma-content">
      {children}
    </div>`;
}

/**
 * Detect layout type from CSS rules
 */
function detectLayoutTypeFromRules(cssRules: any[]): 'flexbox' | 'grid' | 'absolute' | 'static' {
  for (const rule of cssRules) {
    if (rule.declarations) {
      for (const decl of rule.declarations) {
        if (decl.property === 'display') {
          if (decl.value === 'flex') return 'flexbox';
          if (decl.value === 'grid') return 'grid';
        }
        if (decl.property === 'position' && decl.value === 'absolute') {
          return 'absolute';
        }
      }
    }
  }
  return 'static';
}

/**
 * Generate design tokens from CSS rules
 */
function generateDesignTokensFromRules(cssRules: any[]): Record<string, string> {
  const tokens: Record<string, string> = {};
  
  cssRules.forEach((rule, index) => {
    if (rule.declarations) {
      rule.declarations.forEach((decl: any) => {
        switch (decl.property) {
          case 'color':
            if (decl.value.startsWith('#')) {
              tokens[`color-${index}`] = decl.value;
            }
            break;
          case 'background':
          case 'background-color':
            if (decl.value.startsWith('#')) {
              tokens[`bg-${index}`] = decl.value;
            }
            break;
          case 'border-radius':
            tokens[`radius-${index}`] = decl.value;
            break;
          case 'font-size':
            tokens[`text-${index}`] = decl.value;
            break;
          case 'font-weight':
            tokens[`weight-${index}`] = decl.value;
            break;
        }
      });
    }
  });
  
  return tokens;
}