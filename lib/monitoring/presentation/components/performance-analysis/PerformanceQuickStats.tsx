'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';
import { BundleMonitoringService, GlobalBundleStats } from '../../../application/services/BundleMonitoringService';

interface PerformanceQuickStatsProps {
  frontendState: PerformanceTrackingState;
  networkStats: NetworkStats | null;
  isPaused?: boolean;
}

export const PerformanceQuickStats = React.memo<PerformanceQuickStatsProps>(({
  frontendState,
  networkStats,
  isPaused = false
}) => {
  const [bundleStats, setBundleStats] = useState<GlobalBundleStats | null>(null);
  const [bundleMonitoring] = useState(() => new BundleMonitoringService());

  // Load bundle stats
  useEffect(() => {
    const updateBundleStats = () => {
      try {
        const stats = bundleMonitoring.getGlobalBundleStats();
        setBundleStats(stats);
      } catch (error) {
        console.error('❌ Dashboard failed to load bundle stats:', error);
      }
    };

    // Initial fetch
    updateBundleStats();
    // Fetch again shortly after to catch preloaded metrics
    const prefetchTimeout = setTimeout(updateBundleStats, 500);
    // Continue polling
    const interval = setInterval(updateBundleStats, 5000);
    return () => {
      clearTimeout(prefetchTimeout);
      clearInterval(interval);
    };
  }, [bundleMonitoring]);

  const efficiency = useMemo(() => {
    const frontendEfficiency = frontendState.renderMetrics.count <= 10 ? 100 : 
      Math.max(0, 100 - (frontendState.renderMetrics.count - 10) * 3);
    
    const networkEfficiency = isPaused ? 100 : // Show 100% when paused
      networkStats ? Math.round(100 - networkStats.redundancyRate) : 100;
    
    // Add bundle efficiency based on performance score
    const bundleEfficiency = bundleStats ? bundleStats.averagePerformanceScore : 100;

    return { frontendEfficiency, networkEfficiency, bundleEfficiency };
  }, [frontendState.renderMetrics.count, networkStats, isPaused, bundleStats]);

  const barColorClasses = useMemo(() => {
    const getColorClass = (eff: number) => {
      return eff >= 90 ? 'bg-green-500' : 
             eff >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    };

    return {
      frontend: getColorClass(efficiency.frontendEfficiency),
      network: getColorClass(efficiency.networkEfficiency),
      bundle: getColorClass(efficiency.bundleEfficiency)
    };
  }, [efficiency.frontendEfficiency, efficiency.networkEfficiency, efficiency.bundleEfficiency]);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 text-sm">Quick Stats</h4>
      
      <div className="grid grid-cols-4 gap-3 text-xs">
        {/* Frontend Stats */}
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {frontendState.renderMetrics.count}
          </div>
          <div className="text-gray-600">Renders</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {bundleStats ? Math.round(bundleStats.totalCacheHitRatio * 100) : frontendState.cacheHitRate.toFixed(0)}%
          </div>
          <div className="text-gray-600">Cache Hit</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {networkStats?.totalCalls || 0}
          </div>
          <div className="text-gray-600">API Calls</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {bundleStats ? bundleStats.totalModules : 0}
          </div>
          <div className="text-gray-600">Modules</div>
        </div>
      </div>

      {/* Efficiency Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Frontend Efficiency</span>
            <span className="font-medium">{efficiency.frontendEfficiency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${barColorClasses.frontend}`}
              style={{ width: `${efficiency.frontendEfficiency}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Network Efficiency</span>
            <span className="font-medium">{efficiency.networkEfficiency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${barColorClasses.network}`}
              style={{ width: `${efficiency.networkEfficiency}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Bundle Efficiency</span>
            <span className="font-medium">{efficiency.bundleEfficiency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${barColorClasses.bundle}`}
              style={{ width: `${efficiency.bundleEfficiency}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceQuickStats.displayName = 'PerformanceQuickStats'; 