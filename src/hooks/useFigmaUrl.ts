
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

export function useFigmaUrl() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [urlValidation, setUrlValidation] = useState<FigmaValidationResult>({
    isValid: false,
    message: ""
  });

  const { toast } = useToast();

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
          
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          
        } else if (job.status === 'failed') {
          toast({
            title: "Processing Failed",
            description: job.errorMessage || "Unknown error occurred",
            variant: "destructive",
          });
        } else if (job.status === 'processing') {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
      }
    };
    
    checkStatus();
  }, [toast]);

  const validateFigmaUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('figma.com') && url.includes('/file/');
    } catch {
      return false;
    }
  }, []);

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

  const reset = useCallback(() => {
    setFigmaUrl("");
    setFigmaToken("");
    setUrlValidation({ isValid: false, message: "" });
  }, []);

  return {
    figmaUrl,
    setFigmaUrl,
    figmaToken,
    setFigmaToken,
    urlValidation,
    validateFigmaUrl,
    handleValidate,
    handleExtract,
    reset,
    isValidating: validateMutation.isPending,
    isExtracting: extractMutation.isPending,
  };
}
