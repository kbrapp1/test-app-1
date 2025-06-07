'use client';

import React, { useMemo } from 'react';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

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
  const efficiency = useMemo(() => {
    const frontendEfficiency = frontendState.renderMetrics.count <= 10 ? 100 : 
      Math.max(0, 100 - (frontendState.renderMetrics.count - 10) * 3);
    
    const networkEfficiency = isPaused ? 100 : // Show 100% when paused
      networkStats ? Math.round(100 - networkStats.redundancyRate) : 100;

    return { frontendEfficiency, networkEfficiency };
  }, [frontendState.renderMetrics.count, networkStats, isPaused]);

  const barColorClasses = useMemo(() => {
    const getFrontendColorClass = (eff: number) => {
      return eff >= 90 ? 'bg-green-500' : 
             eff >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    };

    const getNetworkColorClass = (eff: number) => {
      return eff >= 90 ? 'bg-green-500' : 
             eff >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    };

    return {
      frontend: getFrontendColorClass(efficiency.frontendEfficiency),
      network: getNetworkColorClass(efficiency.networkEfficiency)
    };
  }, [efficiency.frontendEfficiency, efficiency.networkEfficiency]);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 text-sm">Quick Stats</h4>
      
      <div className="grid grid-cols-3 gap-3 text-xs">
        {/* Frontend Stats */}
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {frontendState.renderMetrics.count}
          </div>
          <div className="text-gray-600">Renders</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {frontendState.cacheHitRate.toFixed(0)}%
          </div>
          <div className="text-gray-600">Cache Hit</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {networkStats?.totalCalls || 0}
          </div>
          <div className="text-gray-600">API Calls</div>
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
      </div>
    </div>
  );
});

PerformanceQuickStats.displayName = 'PerformanceQuickStats'; 