
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import TabNavigation from "@/components/shared/TabNavigation";
import StatsOverview from "@/components/figma-converter/StatsOverview";
import FigmaUrlTab from "@/components/figma-converter/FigmaUrlTab";
import CssImportTab from "@/components/figma-converter/CssImportTab";
import BatchProcessingTab from "@/components/figma-converter/BatchProcessingTab";
import SettingsTab from "@/components/figma-converter/SettingsTab";
import VersionTrackingTab from "@/components/figma-converter/VersionTrackingTab";
import DesignAnalyticsTab from "@/components/figma-converter/DesignAnalyticsTab";
import OutputPanel from "@/components/figma-converter/OutputPanel";
import { useFigmaSettings } from "@/hooks/useFigmaSettings";

const TAB_ITEMS = [
  { value: "url-import", label: "Figma URL Import", icon: "fa-link" },
  { value: "css-import", label: "CSS Code Import", icon: "fa-code" },
  { value: "version-tracking", label: "Version Tracking", icon: "fa-code-branch" },
  { value: "design-analytics", label: "Design Analytics", icon: "fa-chart-line" },
  { value: "batch-process", label: "Batch Processing", icon: "fa-layer-group" },
  { value: "settings", label: "Export Settings", icon: "" },
];

export default function FigmaConverter() {
  const [activeTab, setActiveTab] = useState("url-import");
  const { hasValidToken } = useFigmaSettings();

  return (
    <AppLayout hasValidToken={hasValidToken()}>
      <StatsOverview />

      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabNavigation tabs={TAB_ITEMS} activeTab={activeTab} />

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

      <OutputPanel />
    </AppLayout>
  );
}
