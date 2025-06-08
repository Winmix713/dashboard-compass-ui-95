import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Download, Eye, Link, Key, Shield, Loader2 } from "lucide-react";
import { FigmaComponentCard } from "@/components/figma-component-card";
import { DesignTokensDisplay } from "@/components/design-tokens-display";
import { ProcessedComponentView } from "@/components/processed-component-view";
import { useFigmaSettings } from "@/hooks/useFigmaSettings";

export default function FigmaUrlTab() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [extractedComponents, setExtractedComponents] = useState<any[]>([]);
  const [designTokens, setDesignTokens] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, getSavedToken, hasValidToken } = useFigmaSettings();

  // Auto-load saved token when settings are available
  useEffect(() => {
    if (hasValidToken() && !figmaToken) {
      setFigmaToken(getSavedToken());
      toast({
        title: "Token Loaded",
        description: "Using saved Figma token from settings",
      });
    }
  }, [settings, figmaToken, getSavedToken, hasValidToken, toast]);

  // Validate Figma URL and token
  const validateMutation = useMutation({
    mutationFn: async (data: { url: string; token: string }) => {
      const response = await apiRequest("POST", "/api/figma/validate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.valid) {
        toast({
          title: "Validation Successful",
          description: "Figma file access confirmed",
        });
      }
    },
    onError: (error: any) => {
      setValidationResult({ valid: false, message: error.message });
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
      setActiveJobId(data.jobId);
      toast({
        title: "Extraction Started",
        description: "Processing your Figma file...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll job status
  const { data: jobStatus } = useQuery({
    queryKey: ["job", activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const response = await apiRequest("GET", `/api/jobs/${activeJobId}`);
      return response.json();
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Fetch components when job completes
  const { data: components } = useQuery({
    queryKey: ["components", jobStatus?.outputData?.projectId],
    queryFn: async () => {
      if (!jobStatus?.outputData?.projectId) return [];
      const response = await apiRequest("GET", `/api/projects/${jobStatus.outputData.projectId}/components`);
      return response.json();
    },
    enabled: !!jobStatus?.outputData?.projectId && jobStatus.status === 'completed',
  });

  // Update extracted components when data changes
  React.useEffect(() => {
    if (components && components.length > 0) {
      setExtractedComponents(components);
      if (jobStatus?.outputData?.designTokens) {
        setDesignTokens(jobStatus.outputData.designTokens);
      }
      toast({
        title: "Extraction Complete",
        description: `Successfully extracted ${components.length} components`,
      });
    }
  }, [components, jobStatus, toast]);

  // Utility functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const downloadFile = (content: string, fileName: string, fileType: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const handleValidate = () => {
    if (!figmaUrl || !figmaToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both Figma URL and access token",
        variant: "destructive",
      });
      return;
    }
    
    validateMutation.mutate({ url: figmaUrl, token: figmaToken });
  };

  const handleExtract = () => {
    if (!validationResult?.valid) {
      toast({
        title: "Validation Required",
        description: "Please validate your Figma URL and token first",
        variant: "destructive",
      });
      return;
    }
    
    extractMutation.mutate();
  };

  const isValidUrl = figmaUrl.includes('figma.com/file/');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Figma File Import</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="figma-url" className="flex items-center space-x-2 mb-2">
                <Link className="h-4 w-4" />
                <span>Figma File URL</span>
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="figma-url"
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {figmaUrl && (
                    isValidUrl ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">Paste your Figma file URL here</p>
            </div>

            <div>
              <Label htmlFor="figma-token" className="flex items-center space-x-2 mb-2">
                <Key className="h-4 w-4" />
                <span>Figma Access Token</span>
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="figma-token"
                  type={showToken ? "text" : "password"}
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="Enter your Figma API token"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  <i className={`fas ${showToken ? 'fa-eye-slash' : 'fa-eye'} text-slate-400`}></i>
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-info-circle text-blue-500 text-sm mt-0.5"></i>
                  <p className="text-sm text-slate-500">
                    Get your token from{" "}
                    <a 
                      href="https://www.figma.com/settings#account-settings-personal-access-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Figma Settings
                    </a>
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Token Creation Steps:</h4>
                  <ol className="text-xs text-blue-700 space-y-1">
                    <li>1. Log in to figma.com</li>
                    <li>2. Go to Settings → Account → Personal access tokens</li>
                    <li>3. Click "Create a new personal access token"</li>
                    <li>4. Name it "Figma to React Converter"</li>
                    <li>5. Make sure you have access to the file you want to convert</li>
                    <li>6. Copy the token immediately (it won't be shown again)</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your token is processed locally and never stored on our servers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleValidate}
                disabled={!figmaUrl || !figmaToken || validateMutation.isPending}
                className="flex-1"
                variant={validationResult?.valid ? "secondary" : "default"}
              >
                {validateMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {validationResult?.valid ? "Re-validate" : "Validate Access"}
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!validationResult?.valid || extractMutation.isPending}
                variant="outline"
              >
                {extractMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Extract Components
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">URL Validation</h3>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isValidUrl ? 'bg-success text-white' : 'bg-slate-200'
                }`}>
                  <Link className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">URL Format</p>
                  <p className="text-xs text-slate-500">
                    {isValidUrl ? "Valid Figma URL detected" : "Waiting for valid Figma URL..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  validationResult?.valid ? 'bg-success text-white' : 'bg-slate-200'
                }`}>
                  <Key className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Token Authentication</p>
                  <p className="text-xs text-slate-500">
                    {validationResult?.valid ? "Token validated successfully" : 
                     validationResult?.valid === false ? "Token validation failed" : "Token not validated"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  validationResult?.valid ? 'bg-success text-white' : 'bg-slate-200'
                }`}>
                  <i className="fas fa-unlock text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">File Access</p>
                  <p className="text-xs text-slate-500">
                    {validationResult?.valid ? "File access confirmed" : "Pending validation"}
                  </p>
                </div>
              </div>

              {validationResult?.valid && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">File Information</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Name: {validationResult.fileName || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-600">
                    File ID: {validationResult.fileId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-lightbulb text-blue-600 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Pro Tip</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure your Figma file has proper component naming for better extraction results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
