import React from 'react';
import { Performance, PerformanceStatus } from '../../../types/performance-metrics';

interface SystemHealthStatusProps {
  performance: Performance;
}

export function SystemHealthStatus({ performance }: SystemHealthStatusProps) {
  if (!performance.systemHealth) return null;

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }): PerformanceStatus => {
    if (value <= thresholds.good) return { color: 'text-green-600', status: 'Good' };
    if (value <= thresholds.warning) return { color: 'text-yellow-600', status: 'Warning' };
    return { color: 'text-red-600', status: 'Critical' };
  };

  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">System Health Status:</strong>
      <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between items-center">
              <strong>CPU Usage:</strong>
              <span className={`font-mono ${getPerformanceStatus(performance.systemHealth.cpuUsage, { good: 50, warning: 80 }).color}`}>
                {performance.systemHealth.cpuUsage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  performance.systemHealth.cpuUsage <= 50 ? 'bg-green-500' :
                  performance.systemHealth.cpuUsage <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(performance.systemHealth.cpuUsage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <strong>Memory Usage:</strong>
              <span className={`font-mono ${getPerformanceStatus(performance.systemHealth.memoryUsage, { good: 60, warning: 85 }).color}`}>
                {performance.systemHealth.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  performance.systemHealth.memoryUsage <= 60 ? 'bg-green-500' :
                  performance.systemHealth.memoryUsage <= 85 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(performance.systemHealth.memoryUsage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <strong>Active Connections:</strong>
            <div className="font-mono text-gray-600 dark:text-gray-400">
              {performance.systemHealth.activeConnections}
            </div>
          </div>
          
          <div>
            <strong>Queue Depth:</strong>
            <div className="font-mono text-gray-600 dark:text-gray-400">
              {performance.systemHealth.queueDepth}
            </div>
          </div>
        </div>

        {/* System Health Alerts */}
        <div className="mt-2 space-y-1">
          {performance.systemHealth.cpuUsage > 80 && (
            <div className="text-red-600 text-xs">
              🔥 Critical: High CPU usage detected
            </div>
          )}
          {performance.systemHealth.memoryUsage > 85 && (
            <div className="text-red-600 text-xs">
              🔥 Critical: High memory usage detected
            </div>
          )}
          {performance.systemHealth.queueDepth > 10 && (
            <div className="text-yellow-600 text-xs">
              ⚠ Warning: High queue depth detected
            </div>
          )}
          {performance.systemHealth.cpuUsage <= 50 && performance.systemHealth.memoryUsage <= 60 && performance.systemHealth.queueDepth <= 5 && (
            <div className="text-green-600 text-xs">
              ✅ System operating within normal parameters
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 