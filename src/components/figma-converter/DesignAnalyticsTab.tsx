import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Users,
  Clock,
  Palette,
  Layout,
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFigmaSettings } from '@/hooks/useFigmaSettings';

interface DesignHealthMetrics {
  overallScore: number;
  componentConsistency: number;
  colorCompliance: number;
  typographyAlignment: number;
  layoutStructure: number;
  accessibilityScore: number;
  performanceImpact: number;
}

interface VersionAnnotation {
  id: string;
  versionId: number;
  componentId: string;
  annotationType: 'improvement' | 'issue' | 'suggestion' | 'breaking';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
}

interface DesignTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export const DesignAnalyticsTab: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState('health');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [healthMetrics, setHealthMetrics] = useState<DesignHealthMetrics | null>(null);
  const [annotations, setAnnotations] = useState<VersionAnnotation[]>([]);
  const [trends, setTrends] = useState<DesignTrend[]>([]);
  const { toast } = useToast();
  const { getSavedToken, hasValidToken } = useFigmaSettings();

  // Fetch design health metrics
  const healthQuery = useQuery({
    queryKey: ['/api/design/health', selectedTimeframe],
    enabled: hasValidToken(),
  });

  // Fetch version annotations
  const annotationsQuery = useQuery({
    queryKey: ['/api/design/annotations'],
    enabled: hasValidToken(),
  });

  // Fetch design trends
  const trendsQuery = useQuery({
    queryKey: ['/api/design/trends', selectedTimeframe],
    enabled: hasValidToken(),
  });

  // Generate health report mutation
  const generateHealthReportMutation = useMutation({
    mutationFn: async (data: { projectId: number; timeframe: string }) => {
      const response = await apiRequest("POST", "/api/design/health/generate", {
        ...data,
        token: getSavedToken()
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHealthMetrics(data.metrics);
      toast({
        title: "Health Report Generated",
        description: `Design health score: ${data.metrics.overallScore}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create version comparison mutation
  const createComparisonMutation = useMutation({
    mutationFn: async (data: { fromVersion: number; toVersion: number }) => {
      const response = await apiRequest("POST", "/api/design/compare/visualize", {
        ...data,
        token: getSavedToken()
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnnotations(data.annotations);
      toast({
        title: "Comparison Complete",
        description: `Found ${data.annotations.length} design changes`,
      });
    },
  });

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 75) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const mockHealthMetrics: DesignHealthMetrics = {
    overallScore: 82,
    componentConsistency: 88,
    colorCompliance: 95,
    typographyAlignment: 78,
    layoutStructure: 85,
    accessibilityScore: 72,
    performanceImpact: 90
  };

  const mockTrends: DesignTrend[] = [
    { metric: 'Component Reuse', current: 85, previous: 78, change: 7, trend: 'up', period: '30d' },
    { metric: 'Color Consistency', current: 95, previous: 92, change: 3, trend: 'up', period: '30d' },
    { metric: 'Typography Variations', current: 12, previous: 18, change: -6, trend: 'down', period: '30d' },
    { metric: 'Design Tokens Usage', current: 67, previous: 59, change: 8, trend: 'up', period: '30d' },
  ];

  const mockAnnotations: VersionAnnotation[] = [
    {
      id: '1',
      versionId: 1,
      componentId: 'btn-primary',
      annotationType: 'improvement',
      title: 'Button Spacing Improved',
      description: 'Increased padding for better touch targets',
      impact: 'medium',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      versionId: 2,
      componentId: 'nav-header',
      annotationType: 'breaking',
      title: 'Navigation Structure Changed',
      description: 'Menu hierarchy restructured - may affect existing implementations',
      impact: 'high',
      createdAt: '2024-01-14T15:30:00Z'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Design Analytics & Health</h2>
          <p className="text-sm text-slate-500">
            Comprehensive design system analytics and automated health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-1 text-sm border border-slate-300 rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
          </select>
          <Button
            onClick={() => generateHealthReportMutation.mutate({ projectId: 1, timeframe: selectedTimeframe })}
            disabled={generateHealthReportMutation.isPending || !hasValidToken()}
          >
            <Activity className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeMetric} onValueChange={setActiveMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="annotations">Version Annotations</TabsTrigger>
          <TabsTrigger value="comparison">Visual Comparison</TabsTrigger>
          <TabsTrigger value="trends">Analytics Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Health Score */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Overall Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getHealthScoreColor(mockHealthMetrics.overallScore)}`}>
                    {mockHealthMetrics.overallScore}%
                  </div>
                  <Badge className={getHealthScoreBadge(mockHealthMetrics.overallScore).color}>
                    {getHealthScoreBadge(mockHealthMetrics.overallScore).label}
                  </Badge>
                  <Progress value={mockHealthMetrics.overallScore} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Health Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Component Consistency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockHealthMetrics.componentConsistency} className="w-24" />
                      <span className="text-sm font-semibold w-8">{mockHealthMetrics.componentConsistency}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Color Compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockHealthMetrics.colorCompliance} className="w-24" />
                      <span className="text-sm font-semibold w-8">{mockHealthMetrics.colorCompliance}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Typography Alignment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockHealthMetrics.typographyAlignment} className="w-24" />
                      <span className="text-sm font-semibold w-8">{mockHealthMetrics.typographyAlignment}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Accessibility Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockHealthMetrics.accessibilityScore} className="w-24" />
                      <span className="text-sm font-semibold w-8">{mockHealthMetrics.accessibilityScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Performance Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockHealthMetrics.performanceImpact} className="w-24" />
                      <span className="text-sm font-semibold w-8">{mockHealthMetrics.performanceImpact}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="annotations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Collaborative Version Annotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnnotations.map((annotation) => (
                  <div key={annotation.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{annotation.title}</h4>
                          {getImpactBadge(annotation.impact)}
                          <Badge variant="outline">{annotation.annotationType}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{annotation.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Component: {annotation.componentId}</span>
                          <span>Version: {annotation.versionId}</span>
                          <span>Created: {new Date(annotation.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {annotation.annotationType === 'issue' && !annotation.resolvedAt && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        {annotation.resolvedAt && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                One-Click Visual Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Compare From Version</label>
                    <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md">
                      <option>Version 1.0</option>
                      <option>Version 1.1</option>
                      <option>Version 1.2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Compare To Version</label>
                    <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md">
                      <option>Version 1.2</option>
                      <option>Version 1.3</option>
                      <option>Current</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => createComparisonMutation.mutate({ fromVersion: 1, toVersion: 2 })}
                  disabled={createComparisonMutation.isPending || !hasValidToken()}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Visual Comparison
                </Button>

                {createComparisonMutation.isPending && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Analyzing design changes...</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-slate-600">Components Changed</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-slate-600">Improvements</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">3</div>
                      <div className="text-sm text-slate-600">Breaking Changes</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Design Trends Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend.trend)}
                        <div>
                          <div className="font-medium">{trend.metric}</div>
                          <div className="text-sm text-slate-500">{trend.period}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{trend.current}%</div>
                        <div className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.change >= 0 ? '+' : ''}{trend.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Impact Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800">Positive Impact</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 15% improvement in component reusability</li>
                      <li>• 8% reduction in design token variations</li>
                      <li>• 12% better accessibility compliance</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Areas for Improvement</span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Typography consistency needs attention</li>
                      <li>• Color usage could be optimized</li>
                      <li>• Some components lack proper documentation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};