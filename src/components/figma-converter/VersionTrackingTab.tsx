import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  Clock, 
  Plus, 
  ArrowRightLeft, 
  Palette,
  Eye,
  Download,
  History,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InteractiveCssPreview } from '@/components/css-preview/InteractiveCssPreview';
import { useFigmaSettings } from '@/hooks/useFigmaSettings';

interface VersionData {
  id: number;
  versionName: string;
  versionDescription: string;
  figmaLastModified: string;
  createdAt: string;
  thumbnailUrl?: string;
  components: any[];
  designTokens: any;
}

interface ComparisonData {
  changes: {
    added: any[];
    removed: any[];
    modified: any[];
  };
  colorChanges: any[];
  summary: {
    totalChanges: number;
    componentChanges: number;
    designTokenChanges: number;
  };
}

export const VersionTrackingTab: React.FC = () => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<{ from?: number; to?: number }>({});
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const { toast } = useToast();
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

  // Mock project ID for demonstration
  const projectId = 1;

  // Fetch versions for the project
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: [`/api/versions/${projectId}`],
    enabled: !!projectId,
  });

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/versions/create", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Version Creation Started",
        description: `Processing version "${versionName}"...`,
      });
      setVersionName('');
      setVersionDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Version Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Compare versions mutation
  const compareVersionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/versions/compare", data);
      return response.json();
    },
    onSuccess: (data) => {
      setComparisonData(data.comparisonData);
      toast({
        title: "Comparison Complete",
        description: `Found ${data.comparisonData.summary.totalChanges} changes`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Extract colors mutation
  const extractColorsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/figma/extract-colors", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Colors Extracted",
        description: `Found ${data.colorPalette.length} unique colors`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Color Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateVersion = () => {
    if (!figmaUrl || !figmaToken || !versionName) {
      toast({
        title: "Missing Information",
        description: "Please provide Figma URL, token, and version name",
        variant: "destructive",
      });
      return;
    }

    createVersionMutation.mutate({
      projectId,
      url: figmaUrl,
      token: figmaToken,
      versionName,
      versionDescription,
    });
  };

  const handleCompareVersions = () => {
    if (!selectedVersions.from || !selectedVersions.to) {
      toast({
        title: "Select Versions",
        description: "Please select both versions to compare",
        variant: "destructive",
      });
      return;
    }

    compareVersionsMutation.mutate({
      fromVersionId: selectedVersions.from,
      toVersionId: selectedVersions.to,
    });
  };

  const handleExtractColors = () => {
    if (!figmaUrl || !figmaToken) {
      toast({
        title: "Missing Information",
        description: "Please provide Figma URL and token",
        variant: "destructive",
      });
      return;
    }

    extractColorsMutation.mutate({
      url: figmaUrl,
      token: figmaToken,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <h2 className="text-xl font-semibold text-slate-900">Version Tracking</h2>
          <p className="text-sm text-slate-500">
            Track Figma design changes and compare versions over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <History className="h-3 w-3" />
            {versions.length} versions
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Version</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="colors">Color Extraction</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Version
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="figma-url">Figma File URL</Label>
                <Input
                  id="figma-url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                />
              </div>
              
              <div>
                <Label htmlFor="figma-token">Figma Access Token</Label>
                <Input
                  id="figma-token"
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="Enter your Figma API token"
                />
              </div>

              <div>
                <Label htmlFor="version-name">Version Name</Label>
                <Input
                  id="version-name"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g., v1.2.0, Homepage Redesign"
                />
              </div>

              <div>
                <Label htmlFor="version-description">Description (Optional)</Label>
                <Textarea
                  id="version-description"
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  placeholder="Describe the changes in this version..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCreateVersion}
                disabled={createVersionMutation.isPending}
                className="w-full"
              >
                {createVersionMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Version...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Create Version
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No versions created yet</p>
                  <p className="text-sm">Create your first version to start tracking changes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version: VersionData) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {version.versionName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold">{version.versionName}</h4>
                          <p className="text-sm text-slate-500">{version.versionDescription}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(version.createdAt)}
                            </span>
                            <span>{version.components.length} components</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVersions(prev => ({ ...prev, from: version.id }))}
                          className={selectedVersions.from === version.id ? 'bg-blue-50 border-blue-200' : ''}
                        >
                          Select as From
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVersions(prev => ({ ...prev, to: version.id }))}
                          className={selectedVersions.to === version.id ? 'bg-green-50 border-green-200' : ''}
                        >
                          Select as To
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Version Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Label>From Version</Label>
                    <div className="mt-1 p-2 border rounded bg-blue-50 text-sm">
                      {selectedVersions.from 
                        ? versions.find((v: VersionData) => v.id === selectedVersions.from)?.versionName || 'Unknown'
                        : 'Select a version from history'
                      }
                    </div>
                  </div>
                  <ArrowRightLeft className="h-5 w-5 text-slate-400 mt-6" />
                  <div className="flex-1">
                    <Label>To Version</Label>
                    <div className="mt-1 p-2 border rounded bg-green-50 text-sm">
                      {selectedVersions.to 
                        ? versions.find((v: VersionData) => v.id === selectedVersions.to)?.versionName || 'Unknown'
                        : 'Select a version from history'
                      }
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCompareVersions}
                  disabled={!selectedVersions.from || !selectedVersions.to || compareVersionsMutation.isPending}
                  className="w-full"
                >
                  {compareVersionsMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Comparing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      Compare Versions
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {comparisonData && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {comparisonData.changes.added.length}
                      </div>
                      <div className="text-sm text-green-700">Added</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {comparisonData.changes.modified.length}
                      </div>
                      <div className="text-sm text-blue-700">Modified</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {comparisonData.changes.removed.length}
                      </div>
                      <div className="text-sm text-red-700">Removed</div>
                    </div>
                  </div>

                  {comparisonData.colorChanges.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Color Changes</h4>
                      <div className="space-y-2">
                        {comparisonData.colorChanges.map((change: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: change.color }}
                            />
                            <span className="text-sm font-mono">{change.color}</span>
                            <Badge variant={change.type === 'added' ? 'default' : 'destructive'}>
                              {change.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                One-Click Color Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="color-figma-url">Figma File URL</Label>
                <Input
                  id="color-figma-url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                />
              </div>
              
              <div>
                <Label htmlFor="color-figma-token">Figma Access Token</Label>
                <Input
                  id="color-figma-token"
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="Enter your Figma API token"
                />
              </div>

              <Button
                onClick={handleExtractColors}
                disabled={extractColorsMutation.isPending}
                className="w-full"
              >
                {extractColorsMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Extracting Colors...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Extract Color Palette
                  </div>
                )}
              </Button>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Color Extraction Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Automatically extract all colors from Figma designs</li>
                  <li>• Get HEX, RGB, and HSL values for each color</li>
                  <li>• See where each color is used in your design</li>
                  <li>• One-click copy to clipboard functionality</li>
                  <li>• Export complete color palette for design systems</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};