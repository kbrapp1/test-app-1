/**
 * Cache Metrics Section Component
 * 
 * AI INSTRUCTIONS:
 * - Always add displayName to memoized components for debugging
 * - Follow single responsibility principle for component logic
 * - Use proper TypeScript interfaces for props
 */

'use client';

import React from 'react';
import { Database } from 'lucide-react';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

interface CacheMetricsSectionProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
}

export const CacheMetricsSection: React.FC<CacheMetricsSectionProps> = React.memo(({
  metrics,
  trackingState
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700 flex items-center gap-1">
        <Database className="w-3 h-3" />
        React Query Cache
      </h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Cache Size:</span>
          <span className="font-mono">{metrics.cacheSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hit Rate:</span>
          <span className="font-mono">{trackingState.cacheHitRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Active Mutations:</span>
          <span className="font-mono">{metrics.activeMutations}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Optimized:</span>
          <span className={`font-mono ${metrics.isOptimized ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.isOptimized ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
});

// AI: Add displayName for better debugging support
CacheMetricsSection.displayName = 'CacheMetricsSection'; 