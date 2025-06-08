import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, FileCode, Info, Wand2, Play, Palette, Download, Copy } from "lucide-react";
import { useFigmaConverter } from "@/hooks/use-figma-converter";
import { ProcessedComponentView } from "@/components/processed-component-view";
import { ExportDialog } from "@/components/export-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CssImportTab() {
  const {
    figmaCssCode,
    setFigmaCssCode,
    processedComponent,
    isProcessingCss,
    processFigmaCss,
    loadDemoCss,
    copyToClipboard,
    downloadFile,
  } = useFigmaConverter();

  const [options, setOptions] = useState({
    autoComponentName: true,
    generateTailwind: true,
    responsiveVariants: false,
    extractDesignTokens: true,
    optimizeForProduction: false,
  });
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const { toast } = useToast();

  // Process CSS code
  const processMutation = useMutation({
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
      // Poll for job status
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

  const pollJobStatus = async (jobId: number) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
        const job = await response.json();
        
        if (job.status === 'completed') {
          toast({
            title: "Processing Complete",
            description: `Generated ${job.outputData?.componentsCount || 0} components`,
          });
          setAnalysisResults(job.outputData);
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
      }
    };
    
    checkStatus();
  };

  const handleProcess = () => {
    if (!figmaCssCode.trim()) {
      toast({
        title: "No CSS Code",
        description: "Please provide CSS code to process",
        variant: "destructive",
      });
      return;
    }
    
    processFigmaCss();
  };

  const handleExport = (component: any) => {
    setExportData({
      reactCode: component.reactCode || '',
      css: component.styledCss || component.optimizedCss || '',
      html: component.htmlStructure || '',
      name: component.name || 'FigmaComponent'
    });
    setExportDialogOpen(true);
  };

  const handleAutoFormat = () => {
    // Simple CSS formatting
    const formatted = figmaCssCode
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n\n')
      .trim();
    setFigmaCssCode(formatted);
    
    toast({
      title: "CSS Formatted",
      description: "Your CSS code has been auto-formatted",
    });
  };

  // Calculate CSS statistics
  const cssStats = {
    lines: figmaCssCode.split('\n').length,
    size: (new Blob([figmaCssCode]).size / 1024).toFixed(1),
    rules: (figmaCssCode.match(/\{[^}]*\}/g) || []).length,
    components: (figmaCssCode.match(/\/\*\s*([^*]+)\s*\*\//g) || []).length,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* CSS Input Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Direct CSS Import</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="css-code" className="flex items-center space-x-2 mb-2">
                <FileCode className="h-4 w-4" />
                <span>Figma CSS Code</span>
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="css-code"
                value={figmaCssCode}
                onChange={(e) => setFigmaCssCode(e.target.value)}
                placeholder={`/* Paste your Figma CSS code here */
.component-name {
  /* Auto layout */
  display: flex;
  flex-direction: row;
  padding: 12px 24px;
  gap: 8px;
  
  /* Style */
  background: #2563EB;
  border-radius: 8px;
}`}
                className="h-64 font-mono text-sm resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-slate-500">Paste CSS exported from Figma</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadDemoCss}
                    className="h-7 px-2"
                  >
                    <Palette className="h-3 w-3 mr-1" />
                    Load Demo
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Lines: <span className="font-medium">{figmaCssCode.split('\n').length}</span></span>
                  <span>•</span>
                  <span>Size: <span className="font-medium">{(new Blob([figmaCssCode]).size / 1024).toFixed(1)} KB</span></span>
                </div>
              </div>
            </div>

            {/* Processing Options */}
            <Card className="bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Processing Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-component-name"
                    checked={options.autoComponentName}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, autoComponentName: !!checked }))
                    }
                  />
                  <Label htmlFor="auto-component-name" className="text-sm">
                    Automatic component name recognition
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generate-tailwind"
                    checked={options.generateTailwind}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, generateTailwind: !!checked }))
                    }
                  />
                  <Label htmlFor="generate-tailwind" className="text-sm">
                    Generate Tailwind classes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="responsive-variants"
                    checked={options.responsiveVariants}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, responsiveVariants: !!checked }))
                    }
                  />
                  <Label htmlFor="responsive-variants" className="text-sm">
                    Responsive variants
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* CSS Import Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">CSS Import Tips</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Include component name comments for better extraction</li>
                      <li>• Ensure complete CSS rules with proper selectors</li>
                      <li>• Multiple components can be processed at once</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleProcess}
                disabled={!figmaCssCode.trim() || isProcessingCss}
                className="flex-1"
              >
                {isProcessingCss ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Process CSS Locally
              </Button>
              <Button
                onClick={handleAutoFormat}
                disabled={!figmaCssCode.trim()}
                variant="outline"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-format
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Analysis Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">CSS Analysis</h3>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border border-slate-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{cssStats.rules}</p>
                    <p className="text-sm text-slate-500">CSS Rules</p>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{cssStats.components}</p>
                    <p className="text-sm text-slate-500">Components</p>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{figmaCssCode ? cssStats.lines : 0}</p>
                    <p className="text-sm text-slate-500">Properties</p>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">0</p>
                    <p className="text-sm text-slate-500">Animations</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Detected Components</h4>
                <div className="space-y-2">
                  {cssStats.components > 0 ? (
                    figmaCssCode.match(/\/\*\s*([^*]+)\s*\*\//g)?.map((comment: string, index: number) => {
                      const name = comment.replace(/\/\*\s*|\s*\*\//g, '').trim();
                      if (name && !name.includes('Auto layout')) {
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium">{name}</span>
                            <div className="h-2 w-2 bg-success rounded-full"></div>
                          </div>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-search text-2xl mb-2"></i>
                      <p className="text-sm">No CSS code provided yet</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processed Component Display */}
      {processedComponent && (
        <div className="col-span-1 lg:col-span-2 mt-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Generated Component: {processedComponent.name}
                <Badge variant="secondary">{processedComponent.stats?.cssRules || 0} CSS rules</Badge>
              </h3>
              <Button
                onClick={() => handleExport(processedComponent)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Component
              </Button>
            </div>
            
            <ProcessedComponentView
              component={{
                ...processedComponent,
                tailwindClasses: {
                  main: processedComponent.tailwindClasses || ''
                }
              }}
              onCopy={copyToClipboard}
              onDownload={downloadFile}
            />
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysisResults && (
        <div className="col-span-1 lg:col-span-2 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysisResults.componentsCount || 0}
                  </div>
                  <div className="text-sm text-green-700">Components Generated</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisResults.designTokensCount || 0}
                  </div>
                  <div className="text-sm text-blue-700">Design Tokens</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysisResults.tailwindClasses || 0}
                  </div>
                  <div className="text-sm text-purple-700">Tailwind Classes</div>
                </div>
              </div>
              
              {analysisResults.components?.map((component: any, index: number) => (
                <div key={index} className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{component.name}</h4>
                    <Button
                      size="sm"
                      onClick={() => handleExport(component)}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {component.description || 'React component generated from Figma CSS'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Dialog */}
      {exportData && (
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          componentData={exportData}
        />
      )}
    </div>
  );
}
