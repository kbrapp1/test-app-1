import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Performance } from '../../../types/performance-metrics';

interface PerformanceSummaryProps {
  performance: Performance;
}

export function PerformanceSummary({ performance }: PerformanceSummaryProps) {
  const getOverallStatus = () => {
    if (performance.componentTimings.total < 1000) return { variant: "default" as const, label: 'Excellent' };
    if (performance.componentTimings.total < 3000) return { variant: "secondary" as const, label: 'Good' };
    return { variant: "destructive" as const, label: 'Needs Optimization' };
  };

  const calculateEfficiencyScore = () => {
    return Math.max(0, 100 - Math.floor(performance.componentTimings.total / 50));
  };

  const calculateCacheHitRate = () => {
    if (performance.cacheHits === 0) return 'N/A';
    const totalRequests = performance.cacheHits + performance.dbQueries;
    return ((performance.cacheHits / totalRequests) * 100).toFixed(1) + '%';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">Performance Summary:</strong>
      <div className="mt-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
        <div className="text-xs space-y-1">
          <div>
            <strong>Overall Status:</strong> 
            <Badge 
              variant={overallStatus.variant}
              className="ml-1"
            >
              {overallStatus.label}
            </Badge>
          </div>
          <div>
            <strong>Efficiency Score:</strong> 
            <span className="ml-1 font-mono">
              {calculateEfficiencyScore().toFixed(0)}/100
            </span>
          </div>
          <div>
            <strong>Cache Hit Rate:</strong> 
            <span className="ml-1 font-mono">
              {calculateCacheHitRate()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 