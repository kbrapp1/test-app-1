'use client';

import React, { useState, useEffect } from 'react';
import { BundleMonitoringService, GlobalBundleStats } from '../../../application/services/BundleMonitoringService';

interface BundleDetailsContentProps {
  bundleStats: GlobalBundleStats | null;
  bundleScore: number;
  isPaused?: boolean;
}

export const BundleDetailsContent = React.memo<BundleDetailsContentProps>(({
  bundleStats,
  bundleScore,
  isPaused = false
}) => {
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [bundleMonitoring] = useState(() => new BundleMonitoringService());

  useEffect(() => {
    const updateDetailedStats = () => {
      try {
        const performanceMetrics = bundleMonitoring.getPerformanceMetrics();
        setDetailedStats(performanceMetrics);
      } catch (error) {
        // Silent fail - bundle monitoring is optional
      }
    };

    updateDetailedStats();
    const interval = setInterval(updateDetailedStats, 10000);
    return () => clearInterval(interval);
  }, [bundleMonitoring]);

  if (isPaused) {
    return (
      <div className="text-center py-4 text-gray-500 text-xs">
        Bundle monitoring paused
      </div>
    );
  }

  if (!bundleStats) {
    return (
      <div className="text-center py-4 text-gray-500 text-xs">
        No bundle data available
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Bundle Overview */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-700">Bundle Overview</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Performance Score</div>
            <div className="font-bold text-lg text-blue-600">
              {bundleStats.averagePerformanceScore}/100
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Cache Hit Ratio</div>
            <div className="font-bold text-lg text-green-600">
              {Math.round(bundleStats.totalCacheHitRatio * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Load Times */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-700">Load Performance</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Lazy Loading</div>
            <div className="font-bold text-orange-600">
              {Math.round(bundleStats.lazyLoadingCoverage * 100)}%
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Total Modules</div>
            <div className="font-bold text-purple-600">
              {bundleStats.totalModules}
            </div>
          </div>
        </div>
      </div>

      {/* Session Performance */}
      {detailedStats && (
        <div className="space-y-2">
          <h5 className="font-medium text-gray-700">Session Performance</h5>
          <div className="bg-gray-50 p-2 rounded">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-600">Modules Tracked</div>
                <div className="font-bold">{detailedStats.session?.modulesTracked || 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Avg Load Time</div>
                <div className="font-bold">{detailedStats.session?.averageLoadTime || 0}ms</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-700">Optimization Tips</h5>
        <div className="space-y-1">
          {bundleStats.averagePerformanceScore < 90 && (
            <div className="text-amber-600 bg-amber-50 p-2 rounded">
              ⚡ Consider lazy loading unused components
            </div>
          )}
          {bundleStats.totalCacheHitRatio < 0.8 && (
            <div className="text-blue-600 bg-blue-50 p-2 rounded">
              💾 Cache hit ratio could be improved
            </div>
          )}
          {!bundleStats.criticalPathOptimized && (
            <div className="text-red-600 bg-red-50 p-2 rounded">
              🐌 Critical path is not optimized
            </div>
          )}
          {bundleStats.averagePerformanceScore >= 90 && 
           bundleStats.totalCacheHitRatio >= 0.8 && 
           bundleStats.criticalPathOptimized && (
            <div className="text-green-600 bg-green-50 p-2 rounded">
              ✅ Bundle performance is optimized
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BundleDetailsContent.displayName = 'BundleDetailsContent'; 