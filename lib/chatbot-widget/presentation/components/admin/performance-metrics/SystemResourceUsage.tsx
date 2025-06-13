import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Performance } from '../../../types/performance-metrics';

interface SystemResourceUsageProps {
  performance: Performance;
}

export function SystemResourceUsage({ performance }: SystemResourceUsageProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">System Resource Usage:</strong>
      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="flex justify-between">
            <span>Cache Hits:</span>
            <Badge variant="outline">{performance.cacheHits}</Badge>
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <span>DB Queries:</span>
            <Badge variant="outline">{performance.dbQueries}</Badge>
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <span>API Calls:</span>
            <Badge variant="outline">{performance.apiCalls}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 