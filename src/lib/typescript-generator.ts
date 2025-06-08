export interface ComponentProps {
  [key: string]: {
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  };
}

export function generateTypeScriptInterface(componentName: string, props: ComponentProps): string {
  const interfaceName = `${componentName}Props`;
  
  const propLines = Object.entries(props).map(([propName, propConfig]) => {
    const optional = propConfig.required ? '' : '?';
    const description = propConfig.description ? `  /** ${propConfig.description} */\n` : '';
    
    return `${description}  ${propName}${optional}: ${propConfig.type};`;
  });

  return `export interface ${interfaceName} {
${propLines.join('\n')}
}`;
}

export function generatePropsFromCss(cssRules: any[]): ComponentProps {
  const props: ComponentProps = {
    className: {
      type: 'string',
      required: false,
      description: 'Additional CSS classes'
    },
    children: {
      type: 'React.ReactNode',
      required: false,
      description: 'Child elements'
    }
  };

  // Analyze CSS for dynamic properties
  cssRules.forEach(rule => {
    if (rule.properties) {
      Object.keys(rule.properties).forEach(property => {
        if (property.includes('color')) {
          props.color = {
            type: "'primary' | 'secondary' | 'success' | 'warning' | 'danger'",
            required: false,
            description: 'Color variant'
          };
        }
        
        if (property.includes('font-size')) {
          props.size = {
            type: "'small' | 'medium' | 'large'",
            required: false,
            description: 'Size variant'
          };
        }
      });
    }
  });

  return props;
}

export function generateReactComponent(
  componentName: string, 
  cssRules: any[],
  props: ComponentProps,
  htmlStructure: string,
  tailwindClasses: string
): string {
  const interfaceCode = generateTypeScriptInterface(componentName, props);
  const propNames = Object.keys(props).filter(name => name !== 'children');
  
  return `import React from 'react';
import { cn } from '@/lib/utils';

${interfaceCode}

export const ${componentName}: React.FC<${componentName}Props> = ({
  ${propNames.join(',\n  ')},
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('${tailwindClasses}', className)}
      {...props}
    >
      {children}
    </div>
  );
};

${componentName}.displayName = '${componentName}';`;
}