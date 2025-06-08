import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Key, 
  Shield, 
  Settings, 
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FigmaSettings {
  accessToken: string;
  autoSaveTokens: boolean;
  enableVersionTracking: boolean;
  defaultExportFormat: string;
  colorExtractionEnabled: boolean;
  batchProcessingEnabled: boolean;
  shareableLinksEnabled: boolean;
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<FigmaSettings>({
    accessToken: '',
    autoSaveTokens: true,
    enableVersionTracking: true,
    defaultExportFormat: 'react',
    colorExtractionEnabled: true,
    batchProcessingEnabled: true,
    shareableLinksEnabled: true,
  });
  
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [lastValidated, setLastValidated] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('figma-converter-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        if (parsed.accessToken) {
          setTokenStatus('unknown');
          setLastValidated(localStorage.getItem('figma-token-last-validated'));
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Validate Figma token mutation
  const validateTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/figma/validate", { token });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setTokenStatus('valid');
        setLastValidated(new Date().toISOString());
        localStorage.setItem('figma-token-last-validated', new Date().toISOString());
        toast({
          title: "Token Validated",
          description: "Your Figma access token is valid and working",
        });
      } else {
        setTokenStatus('invalid');
        toast({
          title: "Invalid Token",
          description: data.message || "The Figma token is not valid",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setTokenStatus('invalid');
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: FigmaSettings) => {
      // Save to localStorage
      localStorage.setItem('figma-converter-settings', JSON.stringify(settingsData));
      
      // Optionally save to backend for syncing across devices
      const response = await apiRequest("POST", "/api/settings/save", settingsData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully",
      });
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: any) => {
      // Still save locally even if backend fails
      localStorage.setItem('figma-converter-settings', JSON.stringify(settings));
      toast({
        title: "Settings Saved Locally",
        description: "Settings saved to your browser (backend sync failed)",
      });
    },
  });

  const handleSettingChange = (key: keyof FigmaSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    if (settings.accessToken && tokenStatus !== 'valid') {
      toast({
        title: "Validate Token First",
        description: "Please validate your Figma token before saving",
        variant: "destructive",
      });
      return;
    }
    
    saveSettingsMutation.mutate(settings);
  };

  const handleValidateToken = () => {
    if (!settings.accessToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a Figma access token to validate",
        variant: "destructive",
      });
      return;
    }
    
    validateTokenMutation.mutate(settings.accessToken);
  };

  const handleClearSettings = () => {
    localStorage.removeItem('figma-converter-settings');
    localStorage.removeItem('figma-token-last-validated');
    setSettings({
      accessToken: '',
      autoSaveTokens: true,
      enableVersionTracking: true,
      defaultExportFormat: 'react',
      colorExtractionEnabled: true,
      batchProcessingEnabled: true,
      shareableLinksEnabled: true,
    });
    setTokenStatus('unknown');
    setLastValidated(null);
    toast({
      title: "Settings Cleared",
      description: "All settings have been reset to defaults",
    });
  };

  const getTokenStatusBadge = () => {
    switch (tokenStatus) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="outline">Not Validated</Badge>;
    }
  };

  const formatLastValidated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Settings & Configuration</h2>
          <p className="text-sm text-slate-500">
            Configure your Figma tokens and preferences for seamless design conversion
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getTokenStatusBadge()}
        </div>
      </div>

      {/* Figma API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Figma API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="figma-token">Figma Access Token</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  id="figma-token"
                  type={showToken ? "text" : "password"}
                  value={settings.accessToken}
                  onChange={(e) => handleSettingChange('accessToken', e.target.value)}
                  placeholder="Enter your Figma personal access token"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleValidateToken}
                disabled={validateTokenMutation.isPending || !settings.accessToken.trim()}
                variant="outline"
              >
                {validateTokenMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Validate
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>Last validated: {formatLastValidated(lastValidated)}</span>
              {tokenStatus === 'valid' && (
                <span className="text-green-600">✓ Ready to use</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">How to get your Figma token:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to your Figma account settings</li>
              <li>Navigate to "Personal Access Tokens"</li>
              <li>Click "Create new token"</li>
              <li>Give it a descriptive name and copy the token</li>
              <li>Paste it here and click "Validate"</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save">Auto-save tokens</Label>
              <p className="text-sm text-slate-500">Automatically save tokens for future use</p>
            </div>
            <Switch
              id="auto-save"
              checked={settings.autoSaveTokens}
              onCheckedChange={(checked) => handleSettingChange('autoSaveTokens', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="version-tracking">Version tracking</Label>
              <p className="text-sm text-slate-500">Enable automatic version tracking for Figma designs</p>
            </div>
            <Switch
              id="version-tracking"
              checked={settings.enableVersionTracking}
              onCheckedChange={(checked) => handleSettingChange('enableVersionTracking', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="color-extraction">Color extraction</Label>
              <p className="text-sm text-slate-500">Automatically extract color palettes from designs</p>
            </div>
            <Switch
              id="color-extraction"
              checked={settings.colorExtractionEnabled}
              onCheckedChange={(checked) => handleSettingChange('colorExtractionEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="batch-processing">Batch processing</Label>
              <p className="text-sm text-slate-500">Enable batch processing for multiple components</p>
            </div>
            <Switch
              id="batch-processing"
              checked={settings.batchProcessingEnabled}
              onCheckedChange={(checked) => handleSettingChange('batchProcessingEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shareable-links">Shareable links</Label>
              <p className="text-sm text-slate-500">Enable sharing of converted components via links</p>
            </div>
            <Switch
              id="shareable-links"
              checked={settings.shareableLinksEnabled}
              onCheckedChange={(checked) => handleSettingChange('shareableLinksEnabled', checked)}
            />
          </div>

          <Separator />

          <div>
            <Label htmlFor="export-format">Default export format</Label>
            <select
              id="export-format"
              value={settings.defaultExportFormat}
              onChange={(e) => handleSettingChange('defaultExportFormat', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="react">React (JSX)</option>
              <option value="vue">Vue.js</option>
              <option value="angular">Angular</option>
              <option value="html">HTML + CSS</option>
              <option value="tailwind">Tailwind CSS</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleClearSettings}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Settings
        </Button>
        
        <Button
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveSettingsMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Current Status */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Current Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-slate-700">Token Status</div>
              <div className={`${tokenStatus === 'valid' ? 'text-green-600' : tokenStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'}`}>
                {tokenStatus === 'valid' ? 'Valid' : tokenStatus === 'invalid' ? 'Invalid' : 'Not Set'}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Auto-save</div>
              <div className={settings.autoSaveTokens ? 'text-green-600' : 'text-slate-500'}>
                {settings.autoSaveTokens ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Export Format</div>
              <div className="text-slate-600 capitalize">{settings.defaultExportFormat}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Features</div>
              <div className="text-slate-600">
                {[
                  settings.enableVersionTracking && 'Versions',
                  settings.colorExtractionEnabled && 'Colors',
                  settings.batchProcessingEnabled && 'Batch',
                  settings.shareableLinksEnabled && 'Sharing'
                ].filter(Boolean).join(', ') || 'None'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}