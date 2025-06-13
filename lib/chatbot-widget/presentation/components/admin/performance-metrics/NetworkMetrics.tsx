import React from 'react';
import { Performance } from '../../../types/performance-metrics';

interface NetworkMetricsProps {
  performance: Performance;
}

export function NetworkMetrics({ performance }: NetworkMetricsProps) {
  if (!performance.networkMetrics) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">Network Metrics:</strong>
      <div className="mt-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-2">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <strong>Bytes In:</strong>
            <div className="font-mono text-green-600 dark:text-green-400">
              {formatBytes(performance.networkMetrics.totalBytesIn)}
            </div>
          </div>
          <div>
            <strong>Bytes Out:</strong>
            <div className="font-mono text-green-600 dark:text-green-400">
              {formatBytes(performance.networkMetrics.totalBytesOut)}
            </div>
          </div>
          <div>
            <strong>Avg Latency:</strong>
            <div className="font-mono text-green-600 dark:text-green-400">
              {performance.networkMetrics.averageLatency}ms
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          <strong>Total Transfer:</strong> {formatBytes(performance.networkMetrics.totalBytesIn + performance.networkMetrics.totalBytesOut)}
        </div>
      </div>
    </div>
  );
} 