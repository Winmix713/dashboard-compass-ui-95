import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import StatsOverview from "@/components/figma-converter/StatsOverview";
import FigmaUrlTab from "@/components/figma-converter/FigmaUrlTab";
import CssImportTab from "@/components/figma-converter/CssImportTab";
import BatchProcessingTab from "@/components/figma-converter/BatchProcessingTab";
import SettingsTab from "@/components/figma-converter/SettingsTab";
import { VersionTrackingTab } from "@/components/figma-converter/VersionTrackingTab";
import { DesignAnalyticsTab } from "@/components/figma-converter/DesignAnalyticsTab";
import OutputPanel from "@/components/figma-converter/OutputPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Settings, HelpCircle, Shield, Key } from "lucide-react";
import { useFigmaSettings } from "@/hooks/useFigmaSettings";

export default function FigmaConverter() {
  const [activeTab, setActiveTab] = useState("url-import");
  const { hasValidToken, settings } = useFigmaSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-code text-white text-sm"></i>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Figma Converter Pro</h1>
                  <p className="text-xs text-slate-500">Design to Code Pipeline</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>System Active</span>
                </div>
                {hasValidToken() ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Token Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    <Key className="h-3 w-3 mr-1" />
                    Configure Token
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Interface */}
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-slate-200">
              <TabsList className="grid w-full grid-cols-6 bg-slate-50">
                <TabsTrigger 
                  value="url-import" 
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <i className="fas fa-link text-sm"></i>
                  <span>Figma URL Import</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="css-import"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <i className="fas fa-code text-sm"></i>
                  <span>CSS Code Import</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="version-tracking"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <i className="fas fa-code-branch text-sm"></i>
                  <span>Version Tracking</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="design-analytics"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <i className="fas fa-chart-line text-sm"></i>
                  <span>Design Analytics</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="batch-process"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <i className="fas fa-layer-group text-sm"></i>
                  <span>Batch Processing</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <Settings className="h-4 w-4" />
                  <span>Export Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="url-import" className="mt-0">
                <FigmaUrlTab />
              </TabsContent>
              
              <TabsContent value="css-import" className="mt-0">
                <CssImportTab />
              </TabsContent>
              
              <TabsContent value="version-tracking" className="mt-0">
                <VersionTrackingTab />
              </TabsContent>
              
              <TabsContent value="design-analytics" className="mt-0">
                <DesignAnalyticsTab />
              </TabsContent>
              
              <TabsContent value="batch-process" className="mt-0">
                <BatchProcessingTab />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <SettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Output Panel */}
        <OutputPanel />
      </main>
    </div>
  );
}
