// Bundle Analysis Panel - Monitoring Presentation Layer
// Single Responsibility: Display bundle performance metrics in global monitoring dashboard
// Following Golden Rule: Focused monitoring component integrated with global system

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BundleMonitoringService, GlobalBundleStats } from '../../../application/services/BundleMonitoringService';

interface BundleAnalysisProps {
  className?: string;
}

export const BundleAnalysisPanel: React.FC<BundleAnalysisProps> = ({ className }) => {
  const [bundleStats, setBundleStats] = useState<GlobalBundleStats | null>(null);
  const [bundleMonitoring] = useState(() => new BundleMonitoringService());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateStats = () => {
      try {
        const stats = bundleMonitoring.getGlobalBundleStats();
        setBundleStats(stats);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load bundle stats:', error);
        setIsLoading(false);
      }
    };

    // Initial load
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [bundleMonitoring]);

  const getPerformanceColor = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getCacheColor = (ratio: number): 'default' | 'secondary' | 'destructive' => {
    if (ratio >= 0.8) return 'default';
    if (ratio >= 0.6) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Bundle Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bundleStats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Bundle Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No bundle data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Bundle Analysis
          <Badge variant="outline" className="text-xs">
            {bundleStats.totalModules} modules
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Performance Score</span>
            <Badge variant={getPerformanceColor(bundleStats.averagePerformanceScore)}>
              {bundleStats.averagePerformanceScore}/100
            </Badge>
          </div>
          <Progress 
            value={bundleStats.averagePerformanceScore} 
            className="h-2"
          />
        </div>

        {/* Cache Hit Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Cache Hit Ratio</span>
            <Badge variant={getCacheColor(bundleStats.totalCacheHitRatio)}>
              {Math.round(bundleStats.totalCacheHitRatio * 100)}%
            </Badge>
          </div>
          <Progress 
            value={bundleStats.totalCacheHitRatio * 100} 
            className="h-2"
          />
        </div>

        {/* Optimization Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Critical Path</div>
            <Badge variant={bundleStats.criticalPathOptimized ? 'default' : 'destructive'} className="text-xs">
              {bundleStats.criticalPathOptimized ? 'Optimized' : 'Needs Work'}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Lazy Loading</div>
            <Badge variant={bundleStats.lazyLoadingCoverage > 0.8 ? 'default' : 'secondary'} className="text-xs">
              {Math.round(bundleStats.lazyLoadingCoverage * 100)}%
            </Badge>
          </div>
        </div>

        {/* Recommendations */}
        {bundleStats.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recommendations</div>
            <div className="space-y-1">
              {bundleStats.recommendations.slice(0, 2).map((recommendation, index) => (
                <div key={index} className="text-xs p-2 bg-muted/50 rounded text-muted-foreground">
                  {recommendation}
                </div>
              ))}
              {bundleStats.recommendations.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{bundleStats.recommendations.length - 2} more recommendations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <button
            onClick={() => bundleMonitoring.clear()}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-left"
          >
            Clear Bundle Data
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 