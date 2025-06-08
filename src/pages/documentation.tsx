
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Book, Code, Lightbulb, Rocket } from "lucide-react";
import { Link } from "wouter";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Back to Converter
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Documentation</h1>
                <p className="text-xs text-slate-500">Complete guide to Figma Converter</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Getting Started</p>
                  <p className="text-sm font-medium">API Reference</p>
                  <p className="text-sm font-medium">Examples</p>
                  <p className="text-sm font-medium">Troubleshooting</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="getting-started" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="getting-started">
                  <Rocket className="h-4 w-4 mr-2" />
                  Getting Started
                </TabsTrigger>
                <TabsTrigger value="api">
                  <Code className="h-4 w-4 mr-2" />
                  API Reference
                </TabsTrigger>
                <TabsTrigger value="examples">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Examples
                </TabsTrigger>
                <TabsTrigger value="troubleshooting">
                  <Book className="h-4 w-4 mr-2" />
                  Troubleshooting
                </TabsTrigger>
              </TabsList>

              <TabsContent value="getting-started">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started with Figma Converter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">1. Setup Your Figma Token</h3>
                      <p className="text-muted-foreground">
                        First, you'll need to generate a Figma access token to connect to the Figma API.
                      </p>
                      
                      <h3 className="text-lg font-semibold">2. Import Your Designs</h3>
                      <p className="text-muted-foreground">
                        Use the URL import tab to bring in your Figma designs and start the conversion process.
                      </p>
                      
                      <h3 className="text-lg font-semibold">3. Generate Components</h3>
                      <p className="text-muted-foreground">
                        Our AI will analyze your designs and generate React components with Tailwind CSS.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>API Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Detailed API documentation for integrating with Figma Converter.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples">
                <Card>
                  <CardHeader>
                    <CardTitle>Examples & Use Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Real-world examples of converting Figma designs to React components.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="troubleshooting">
                <Card>
                  <CardHeader>
                    <CardTitle>Troubleshooting Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Common issues and solutions when using Figma Converter.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
