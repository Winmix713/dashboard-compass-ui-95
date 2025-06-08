import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { parseFigmaCssToComponent, generateReactComponentFromCss, type ParsedCSS, type GeneratedComponent } from "@/lib/figma-css-parser";

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

export function useFigmaConverter() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [figmaCssCode, setFigmaCssCode] = useState("");
  const [isProcessingCss, setIsProcessingCss] = useState(false);
  const [processedComponent, setProcessedComponent] = useState<ProcessedCssComponent | null>(null);
  const [urlValidation, setUrlValidation] = useState<FigmaValidationResult>({
    isValid: false,
    message: ""
  });
  
  const [options, setOptions] = useState<FigmaConverterOptions>({
    extractDesignTokens: true,
    generateVariants: true,
    includeResponsive: true,
    optimizeForProduction: true,
    extractColors: true,
    extractTypography: true,
    generateStorybook: false
  });

  const { toast } = useToast();

  // Validate Figma URL and token
  const validateMutation = useMutation({
    mutationFn: async (data: { url: string; token: string }) => {
      const response = await apiRequest("POST", "/api/figma/validate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUrlValidation({
        isValid: data.valid,
        message: data.valid ? "Validation successful" : data.message,
        parsedData: data.valid ? {
          fileId: data.fileId,
          fileName: data.fileName,
          lastModified: data.lastModified,
          thumbnailUrl: data.thumbnailUrl
        } : undefined
      });
      
      if (data.valid) {
        toast({
          title: "Validation Successful",
          description: "Figma file access confirmed",
        });
      }
    },
    onError: (error: any) => {
      setUrlValidation({
        isValid: false,
        message: error.message || "Validation failed"
      });
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Extract components from Figma
  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/figma/extract", {
        url: figmaUrl,
        token: figmaToken,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Extraction Started",
        description: `Job ${data.jobId} is processing your Figma file`,
      });
      
      // Start polling for job status
      pollJobStatus(data.jobId);
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process CSS code mutation
  const processCssMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/css/process", {
        cssCode: figmaCssCode,
        options,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Started",
        description: `Job ${data.jobId} is processing your CSS code`,
      });
      
      // Start polling for job status
      pollJobStatus(data.jobId);
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: number) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const job = await response.json();
        
        if (job.status === 'completed') {
          toast({
            title: "Processing Complete",
            description: `Generated ${job.outputData?.componentsCount || 0} components`,
          });
          
          // Invalidate and refetch queries to update UI
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          
        } else if (job.status === 'failed') {
          toast({
            title: "Processing Failed",
            description: job.errorMessage || "Unknown error occurred",
            variant: "destructive",
          });
        } else if (job.status === 'processing') {
          // Continue polling
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
        toast({
          title: "Status Check Failed",
          description: "Unable to check processing status",
          variant: "destructive",
        });
      }
    };
    
    checkStatus();
  }, [toast]);

  // Demo CSS for testing
  const loadDemoCss = useCallback(() => {
    const demoCss = `/* button */

box-sizing: border-box;

/* Auto layout */
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
/* input-light */
box-shadow: inset 0px -1px 0px rgba(255, 255, 255, 0.8), inset 0px 6px 13px rgba(24, 24, 24, 0.03), inset 0px 6px 4px -4px rgba(24, 24, 24, 0.05), inset 0px 4.5px 1.5px -4px rgba(24, 24, 24, 0.07);
border-radius: 100px;

/* Frame 1000002498 */
.frame-content {
box-sizing: border-box;

/* Auto layout */
display: flex;
flex-direction: row;
justify-content: center;
align-items: center;
padding: 12px 32px;
gap: 10px;

width: 207px;
height: 44px;

background: rgba(253, 253, 253, 0.7);
/* depth-light */
box-shadow: 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 6px 13px rgba(8, 8, 8, 0.03), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 5px 1.5px -4px rgba(8, 8, 8, 0.09);
backdrop-filter: blur(32px);
border-radius: 90px;

flex: none;
order: 1;
flex-grow: 0;
z-index: 1;
}

/* Brief generated */
.button-text {
width: 117px;
height: 20px;

font-family: 'CircularXX', system-ui, sans-serif;
font-style: normal;
font-weight: 500;
font-size: 14px;
line-height: 20px;

color: #1B1B1B;
opacity: 0.8;

flex: none;
order: 0;
flex-grow: 0;
}

/* check, checmark */
.check-icon {
width: 16px;
height: 16px;
flex: none;
order: 1;
flex-grow: 0;
}

/* Icon */
.check-icon::before {
content: "";
position: absolute;
left: 8.33%;
right: 8.33%;
top: 12.5%;
bottom: 12.5%;
background: #00A656;
border-radius: 2px;
}`;
    
    setFigmaCssCode(demoCss);
    toast({
      title: "Demo CSS Loaded",
      description: "Figma button component CSS code loaded for testing"
    });
  }, [toast]);

  // Copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  }, [toast]);

  // Download file function
  const downloadFile = useCallback((content: string, fileName: string, fileType: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Process Full CSS Import locally
  const processFigmaCss = useCallback(async () => {
    if (!figmaCssCode.trim()) {
      toast({
        title: "No CSS Code",
        description: "Please paste the Figma CSS code",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingCss(true);

    try {
      // Parse CSS and extract component structure
      const parsedCss: ParsedCSS = parseFigmaCssToComponent(figmaCssCode);
      
      // Generate complete React component with exact styling
      const componentCode: GeneratedComponent = generateReactComponentFromCss(parsedCss);
      
      setProcessedComponent({
        name: parsedCss.componentName,
        originalCss: figmaCssCode,
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
      setIsProcessingCss(false);
    }
  }, [figmaCssCode, toast]);

  // Validate Figma URL format
  const validateFigmaUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('figma.com') && url.includes('/file/');
    } catch {
      return false;
    }
  }, []);

  // Handle validation
  const handleValidate = useCallback(() => {
    if (!figmaUrl || !figmaToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both Figma URL and access token",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateFigmaUrl(figmaUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid Figma file URL",
        variant: "destructive",
      });
      return;
    }
    
    validateMutation.mutate({ url: figmaUrl, token: figmaToken });
  }, [figmaUrl, figmaToken, validateFigmaUrl, validateMutation, toast]);

  // Handle extraction
  const handleExtract = useCallback(() => {
    if (!urlValidation.isValid) {
      toast({
        title: "Validation Required",
        description: "Please validate your Figma URL and token first",
        variant: "destructive",
      });
      return;
    }
    
    extractMutation.mutate();
  }, [urlValidation.isValid, extractMutation, toast]);

  // Handle CSS processing via API
  const handleProcessCss = useCallback(() => {
    if (!figmaCssCode.trim()) {
      toast({
        title: "No CSS Code",
        description: "Please provide CSS code to process",
        variant: "destructive",
      });
      return;
    }
    
    processCssMutation.mutate();
  }, [figmaCssCode, processCssMutation, toast]);

  // Reset form state
  const resetForm = useCallback(() => {
    setFigmaUrl("");
    setFigmaToken("");
    setFigmaCssCode("");
    setProcessedComponent(null);
    setUrlValidation({ isValid: false, message: "" });
  }, []);

  return {
    // State
    figmaUrl,
    setFigmaUrl,
    figmaToken,
    setFigmaToken,
    figmaCssCode,
    setFigmaCssCode,
    urlValidation,
    options,
    setOptions,
    processedComponent,
    isProcessingCss,

    // Mutations
    validateMutation,
    extractMutation,
    processCssMutation,

    // Actions
    handleValidate,
    handleExtract,
    handleProcessCss,
    processFigmaCss,
    resetForm,
    validateFigmaUrl,
    loadDemoCss,
    copyToClipboard,
    downloadFile,

    // Loading states
    isValidating: validateMutation.isPending,
    isExtracting: extractMutation.isPending,
    isProcessing: processCssMutation.isPending,
  };
}
