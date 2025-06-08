import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudUpload, FolderOpen, Play, Clock, Check, X, Download, FileCode, Link2 } from "lucide-react";

export default function BatchProcessingTab() {
  const [batchSettings, setBatchSettings] = useState({
    parallelProcessing: true,
    autoExportResults: true,
    errorNotifications: true,
    maxConcurrentJobs: "3",
  });

  // Get recent jobs
  const { data: recentJobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Handle file drop logic here
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><Check className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'processing':
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'figma_extraction':
        return <Link2 className="h-5 w-5 text-blue-500" />;
      case 'css_processing':
        return <FileCode className="h-5 w-5 text-green-500" />;
      default:
        return <FileCode className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Batch Processing</h3>
        <p className="text-slate-600">Process multiple Figma files or CSS imports simultaneously</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <CloudUpload className="h-8 w-8 text-slate-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-slate-900">Drop files here or click to upload</h4>
                <p className="text-sm text-slate-500 mt-2">
                  Support for .css, .txt, or JSON files with Figma URLs
                </p>
              </div>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </div>

          {/* Processing Queue */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Processing Queue</h4>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center text-slate-500">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading jobs...
                  </div>
                ) : recentJobs && recentJobs.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {recentJobs.slice(0, 5).map((job: any) => (
                      <div key={job.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                            {getJobIcon(job.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {job.type === 'figma_extraction' ? 'Figma Extraction' : 'CSS Processing'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {job.inputData?.url ? 'Figma URL' : 'CSS Code'} • 
                              {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(job.status)}
                          {job.status === 'completed' && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <CloudUpload className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No processing jobs yet</p>
                    <p className="text-xs mt-1">Upload files to start batch processing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Batch Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Batch Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="parallel-processing" className="text-sm">
                  Parallel Processing
                </Label>
                <Checkbox
                  id="parallel-processing"
                  checked={batchSettings.parallelProcessing}
                  onCheckedChange={(checked) =>
                    setBatchSettings(prev => ({ ...prev, parallelProcessing: !!checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-export" className="text-sm">
                  Auto-export Results
                </Label>
                <Checkbox
                  id="auto-export"
                  checked={batchSettings.autoExportResults}
                  onCheckedChange={(checked) =>
                    setBatchSettings(prev => ({ ...prev, autoExportResults: !!checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="error-notifications" className="text-sm">
                  Error Notifications
                </Label>
                <Checkbox
                  id="error-notifications"
                  checked={batchSettings.errorNotifications}
                  onCheckedChange={(checked) =>
                    setBatchSettings(prev => ({ ...prev, errorNotifications: !!checked }))
                  }
                />
              </div>

              <div>
                <Label className="text-sm block mb-2">Max Concurrent Jobs</Label>
                <Select
                  value={batchSettings.maxConcurrentJobs}
                  onValueChange={(value) =>
                    setBatchSettings(prev => ({ ...prev, maxConcurrentJobs: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 (Recommended)</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" disabled={!recentJobs || recentJobs.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Start Batch Processing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
