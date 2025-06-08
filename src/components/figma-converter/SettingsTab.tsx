
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";

export default function SettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="figma-token" className="block text-sm font-medium mb-2">
              Figma Access Token
            </label>
            <input
              id="figma-token"
              type="password"
              placeholder="Enter your Figma access token"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
