
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { parseFigmaCssToComponent, generateReactComponentFromCss } from "@/lib/figma-css-parser";

export interface ProcessedCssComponent {
  name: string;
  originalCss: string;
  reactCode: string;
  styledCss: string;
  htmlStructure: string;
  tailwindClasses: string;
  stats: {
    cssRules: number;
    responsiveBreakpoints: number;
    animations: number;
    customProperties: number;
  };
}

export function useCssProcessor() {
  const [cssCode, setCssCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedComponent, setProcessedComponent] = useState<ProcessedCssComponent | null>(null);
  const { toast } = useToast();

  const processCss = useCallback(async () => {
    if (!cssCode.trim()) {
      toast({
        title: "No CSS Code",
        description: "Please paste the Figma CSS code",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const parsedCss = parseFigmaCssToComponent(cssCode);
      const componentCode = generateReactComponentFromCss(parsedCss);
      
      setProcessedComponent({
        name: parsedCss.componentName,
        originalCss: cssCode,
        reactCode: componentCode.jsx,
        styledCss: componentCode.css,
        htmlStructure: componentCode.html,
        tailwindClasses: componentCode.tailwindClasses,
        stats: {
          cssRules: parsedCss.cssRules.length,
          responsiveBreakpoints: parsedCss.responsiveRules.length,
          animations: parsedCss.animations.length,
          customProperties: parsedCss.customProperties.length
        }
      });

      toast({
        title: "CSS Successfully Processed",
        description: "Component code generated with complete layout copy"
      });

    } catch (error) {
      toast({
        title: "CSS Processing Error",
        description: "An error occurred while analyzing the CSS code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cssCode, toast]);

  const loadDemoCSS = useCallback(() => {
    const demoCss = `/* button */
box-sizing: border-box;
display: flex;
flex-direction: row;
align-items: flex-start;
padding: 8px;
gap: 10px;
isolation: isolate;
position: relative;
width: 223px;
height: 60px;
background: #F1F1F1;
border-top: 0.5px solid rgba(40, 40, 40, 0.1);
box-shadow: inset 0px -1px 0px rgba(255, 255, 255, 0.8);
border-radius: 100px;`;
    
    setCssCode(demoCss);
    toast({
      title: "Demo CSS Loaded",
      description: "Figma button component CSS code loaded for testing"
    });
  }, [toast]);

  const reset = useCallback(() => {
    setCssCode("");
    setProcessedComponent(null);
  }, []);

  return {
    cssCode,
    setCssCode,
    isProcessing,
    processedComponent,
    processCss,
    loadDemoCSS,
    reset
  };
}
