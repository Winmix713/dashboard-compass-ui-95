
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface ProcessingStatusCardProps {
  title: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  results?: {
    componentsCount?: number;
    tokensCount?: number;
  };
}

export default function ProcessingStatusCard({ 
  title, 
  status, 
  progress = 0, 
  message, 
  results 
}: ProcessingStatusCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {title}
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'processing' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {message && (
          <p className="text-sm text-slate-600 mb-3">{message}</p>
        )}
        
        {status === 'completed' && results && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {results.componentsCount && (
              <div>
                <span className="text-slate-500">Components:</span>
                <span className="ml-2 font-medium">{results.componentsCount}</span>
              </div>
            )}
            {results.tokensCount && (
              <div>
                <span className="text-slate-500">Tokens:</span>
                <span className="ml-2 font-medium">{results.tokensCount}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
