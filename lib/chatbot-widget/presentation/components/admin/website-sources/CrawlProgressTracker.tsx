'use client';

/** Crawl Progress Tracker Component */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Search, 
  Brain, 
  Zap, 
  CheckCircle, 
  X, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { CrawlProgress } from './WebsiteSourcesSection';

export interface CrawlProgressTrackerProps {
  sourceId: string;
  progress: CrawlProgress;
  onCancel?: () => void;
}

export function CrawlProgressTracker({ 
  sourceId, 
  progress, 
  onCancel 
}: CrawlProgressTrackerProps) {
  const statusConfig = getStatusConfig(progress.status);

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {progress.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : progress.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {progress.status === 'error' ? 'Crawl Failed' : 
                 progress.status === 'completed' ? 'Crawl Completed' : 
                 'Crawling Website'}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className={statusConfig.badgeClass}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
                {progress.message && (
                  <span className="text-sm">{progress.message}</span>
                )}
              </CardDescription>
            </div>
          </div>
          {onCancel && progress.status !== 'completed' && progress.status !== 'error' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.progress}%</span>
            </div>
            <Progress 
              value={progress.progress} 
              className={`h-2 ${progress.status === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}
            />
          </div>

          {/* Current Activity */}
          {progress.currentPage && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Current Page</span>
              <div className="text-sm text-muted-foreground bg-white p-2 rounded border">
                {progress.currentPage}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.pagesFound}
              </div>
              <div className="text-sm text-muted-foreground">Pages Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.pagesProcessed}
              </div>
              <div className="text-sm text-muted-foreground">Pages Processed</div>
            </div>
          </div>

          {/* Error Message */}
          {progress.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Error Details</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{progress.error}</p>
            </div>
          )}

          {/* Success Message */}
          {progress.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Crawl Successful</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Website content has been successfully processed and is now available for your chatbot.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusConfig(status: CrawlProgress['status']) {
  switch (status) {
    case 'starting':
      return {
        label: 'Starting',
        icon: <Globe className="w-3 h-3 mr-1" />,
        badgeClass: 'border-blue-200 text-blue-700'
      };
    case 'crawling':
      return {
        label: 'Crawling',
        icon: <Search className="w-3 h-3 mr-1" />,
        badgeClass: 'border-blue-200 text-blue-700'
      };
    case 'processing':
      return {
        label: 'Processing',
        icon: <Brain className="w-3 h-3 mr-1" />,
        badgeClass: 'border-purple-200 text-purple-700'
      };
    case 'vectorizing':
      return {
        label: 'Vectorizing',
        icon: <Zap className="w-3 h-3 mr-1" />,
        badgeClass: 'border-yellow-200 text-yellow-700'
      };
    case 'completed':
      return {
        label: 'Completed',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        badgeClass: 'border-green-200 text-green-700'
      };
    case 'error':
      return {
        label: 'Error',
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
        badgeClass: 'border-red-200 text-red-700'
      };
    default:
      return {
        label: 'Unknown',
        icon: null,
        badgeClass: 'border-gray-200 text-gray-700'
      };
  }
} 