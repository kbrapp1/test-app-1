import React from 'react';
import { Performance } from '../../../types/performance-metrics';

interface MemoryUsageDetailsProps {
  performance: Performance;
}

export function MemoryUsageDetails({ performance }: MemoryUsageDetailsProps) {
  if (!performance.memoryUsage) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const heapUsagePercentage = (performance.memoryUsage.heapUsed / performance.memoryUsage.heapTotal) * 100;

  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">Memory Usage:</strong>
      <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <strong>Heap Used:</strong>
            <div className="font-mono text-blue-600 dark:text-blue-400">
              {formatBytes(performance.memoryUsage.heapUsed)}
            </div>
            <div className="text-muted-foreground">
              {heapUsagePercentage.toFixed(1)}% of heap
            </div>
          </div>
          <div>
            <strong>Heap Total:</strong>
            <div className="font-mono text-blue-600 dark:text-blue-400">
              {formatBytes(performance.memoryUsage.heapTotal)}
            </div>
          </div>
          <div>
            <strong>External:</strong>
            <div className="font-mono text-blue-600 dark:text-blue-400">
              {formatBytes(performance.memoryUsage.external)}
            </div>
          </div>
        </div>
        
        {/* Memory Usage Warning */}
        {heapUsagePercentage > 80 && (
          <div className="text-orange-600 text-xs mt-2">
            ⚠ Warning: High memory usage detected
          </div>
        )}
      </div>
    </div>
  );
} 