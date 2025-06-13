import React from 'react';
import { PerformanceMetricsSectionProps } from '../../../types/performance-metrics';
import { ComponentTimingBreakdown } from '../performance-metrics/ComponentTimingBreakdown';
import { SystemResourceUsage } from '../performance-metrics/SystemResourceUsage';
import { MemoryUsageDetails } from '../performance-metrics/MemoryUsageDetails';
import { NetworkMetrics } from '../performance-metrics/NetworkMetrics';
import { SystemHealthStatus } from '../performance-metrics/SystemHealthStatus';
import { PerformanceSummary } from '../performance-metrics/PerformanceSummary';

export function PerformanceMetricsSection({ performance }: PerformanceMetricsSectionProps) {
  if (!performance) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800 dark:text-orange-200">
        <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
        Performance Metrics & System Health
      </h4>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-3">
          <div className="text-sm">
            <strong>Business Logic:</strong> Real-time monitoring of system performance, resource utilization, and operational health metrics to ensure optimal chatbot response times and system reliability.
          </div>

          <ComponentTimingBreakdown performance={performance} />
          <SystemResourceUsage performance={performance} />
          <MemoryUsageDetails performance={performance} />
          <NetworkMetrics performance={performance} />
          <SystemHealthStatus performance={performance} />
          <PerformanceSummary performance={performance} />
        </div>
      </div>
    </div>
  );
} 