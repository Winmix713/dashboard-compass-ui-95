import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Eye, Code, FileText, Palette, Link2, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OutputPanel() {
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const { toast } = useToast();

  // Get recent components
  const { data: recentJobs } = useQuery({
    queryKey: ["/api/jobs"],
    refetchInterval: 5000,
  });

  const handleCopyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `${type} code has been copied to clipboard`,
    });
  };

  const handleDownloadZip = () => {
    toast({
      title: "Download Started",
      description: "Your components are being packaged for download",
    });
  };

  // Find completed jobs with components
  const completedJobs = recentJobs?.filter((job: any) => 
    job.status === 'completed' && job.outputData?.componentsCount > 0
  ) || [];

  return (
    <div className="mt-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated Components</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleCopyCode("", "All")}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {completedJobs.length > 0 ? (
            <div className="space-y-6">
              {/* Component List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedJobs.map((job: any) => (
                  <Card 
                    key={job.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => setSelectedComponent(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            {job.type === 'figma_extraction' ? (
                              <Link2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileCode className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">
                              {job.type === 'figma_extraction' ? 'Figma Components' : 'CSS Components'}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {job.outputData?.componentsCount || 0} components
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-success text-success-foreground">
                          Ready
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        Generated {new Date(job.completedAt || job.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Component Details */}
              {selectedComponent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Component Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="react" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="react" className="flex items-center space-x-2">
                          <i className="fab fa-react text-sm"></i>
                          <span>React</span>
                        </TabsTrigger>
                        <TabsTrigger value="css" className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>CSS</span>
                        </TabsTrigger>
                        <TabsTrigger value="tailwind" className="flex items-center space-x-2">
                          <i className="fas fa-wind text-sm"></i>
                          <span>Tailwind</span>
                        </TabsTrigger>
                        <TabsTrigger value="tokens" className="flex items-center space-x-2">
                          <Palette className="h-4 w-4" />
                          <span>Tokens</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="react" className="mt-4">
                        <Card className="bg-slate-900">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-mono text-slate-300">React Component</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-slate-300 hover:text-white"
                                onClick={() => handleCopyCode(mockReactCode, "React")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
                              <code>{mockReactCode}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="css" className="mt-4">
                        <Card className="bg-slate-900">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-mono text-slate-300">CSS Styles</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-slate-300 hover:text-white"
                                onClick={() => handleCopyCode(mockCssCode, "CSS")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
                              <code>{mockCssCode}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="tailwind" className="mt-4">
                        <Card className="bg-slate-900">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-mono text-slate-300">Tailwind Classes</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-slate-300 hover:text-white"
                                onClick={() => handleCopyCode(mockTailwindClasses, "Tailwind")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-slate-300 font-mono leading-relaxed">
                              <div className="space-y-2">
                                {mockTailwindClasses.split(' ').map((cls, index) => (
                                  <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                                    {cls}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="tokens" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {mockDesignTokens.colors.map((color, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: color.value }}
                                  ></div>
                                  <span className="text-xs font-mono">{color.name}</span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Typography</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {mockDesignTokens.typography.map((font, index) => (
                                <div key={index} className="text-xs">
                                  <div className="font-medium">{font.name}</div>
                                  <div className="text-slate-500">{font.fontFamily} {font.fontSize}px</div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Spacing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {mockDesignTokens.spacing.map((space, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <span className="font-mono">{space.name}</span>
                                  <span className="text-slate-500">{space.value}</span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-cubes text-slate-300 text-4xl mb-4"></i>
              <h4 className="text-lg font-medium text-slate-900 mb-2">Ready to Generate Components</h4>
              <p className="text-slate-500 mb-6">
                Import a Figma file or paste CSS code to start generating React components
              </p>
              <div className="flex justify-center space-x-4">
                <Button>
                  <Link2 className="h-4 w-4 mr-2" />
                  Import from Figma
                </Button>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Paste CSS Code
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data for demonstration
const mockReactCode = `import React from "react";
import { cn } from "@/lib/utils";

interface FigmaButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const FigmaButton: React.FC<FigmaButtonProps> = ({ 
  className,
  children,
  variant = "default",
  size = "md",
  ...props 
}) => {
  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
        },
        {
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4": size === "md",
          "h-12 px-6 text-lg": size === "lg",
        },
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};

export default FigmaButton;`;

const mockCssCode = `.figma-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: colors 0.2s;
}

.figma-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.figma-button.primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.figma-button.primary:hover {
  background-color: var(--primary/90);
}`;

const mockTailwindClasses = "inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4";

const mockDesignTokens = {
  colors: [
    { name: "primary", value: "#2563eb" },
    { name: "secondary", value: "#64748b" },
    { name: "success", value: "#059669" },
    { name: "warning", value: "#d97706" },
  ],
  typography: [
    { name: "heading", fontFamily: "Inter", fontSize: 24, fontWeight: 600 },
    { name: "body", fontFamily: "Inter", fontSize: 16, fontWeight: 400 },
    { name: "caption", fontFamily: "Inter", fontSize: 12, fontWeight: 400 },
  ],
  spacing: [
    { name: "xs", value: "4px" },
    { name: "sm", value: "8px" },
    { name: "md", value: "16px" },
    { name: "lg", value: "24px" },
    { name: "xl", value: "32px" },
  ],
};
