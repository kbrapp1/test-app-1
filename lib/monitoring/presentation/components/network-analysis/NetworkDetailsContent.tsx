'use client';

import React, { useMemo, useCallback } from 'react';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';
import { Copy, Check } from 'lucide-react';
import { Button as _Button } from '@/components/ui/button';
import { NetworkReportFormattingService } from './NetworkReportFormattingService';

interface NetworkDetailsContentProps {
  networkStats: NetworkStats | null;
  networkScore: number;
  isPaused?: boolean;
}

export const NetworkDetailsContent = React.memo<NetworkDetailsContentProps>(({
  networkStats,
  networkScore,
  isPaused = false
}) => {
  const [copyButtonState, setCopyButtonState] = React.useState<'default' | 'success'>('default');

  // Memoize expensive calculations
  const statsCalculations = useMemo(() => {
    if (!networkStats) return null;

    const patternCallsCount = networkStats.redundantPatterns?.reduce(
      (sum, p) => sum + p.duplicateCalls.length, 0
    ) || 0;

    return {
      patternCallsCount,
      patternsCount: networkStats.redundantPatterns?.length || 0,
      recentCallsCount: networkStats.recentCalls?.length || 0,
      sessionTotal: networkStats.persistentRedundantCount || 0
    };
  }, [networkStats]);

  const copyRedundancyReport = useCallback(async () => {
    if (!networkStats?.redundantPatterns?.length) return;

    // Use the enhanced NetworkReportFormattingService for comprehensive root cause analysis
    const report = NetworkReportFormattingService.formatForClipboard(networkStats);
    
    try {
      await navigator.clipboard.writeText(report);
      setCopyButtonState('success');
      setTimeout(() => setCopyButtonState('default'), 2000);
    } catch {
      // Silent fail for copy operation
    }
  }, [networkStats]);



  // Memoize pattern display data
  const patternDisplayData = useMemo(() => {
    if (!networkStats?.redundantPatterns) return [];

    return networkStats.redundantPatterns.map((pattern, index) => {
      // Extract clean endpoint path
      const cleanPath = pattern.originalCall.url.replace(window.location.origin, '').split('?')[0];
      const displayPath = cleanPath.length > 40 ? `${cleanPath.substring(0, 40)}...` : cleanPath;
      
      // Show method and path like "GET /api/team/members" or "POST /api/team/members"
      const methodAndPath = `${pattern.originalCall.method} ${displayPath}`;

      return {
        key: index,
        pattern,
        methodAndPath,
        displayPath,
        callCount: pattern.duplicateCalls.length + 1
      };
    });
  }, [networkStats?.redundantPatterns]);

  // Memoize recent calls display data
  const recentCallsDisplayData = useMemo(() => {
    if (!networkStats?.recentCalls) return [];

    return networkStats.recentCalls.slice(0, 5).map((call, index) => {
      // Extract clean endpoint path
      const cleanPath = call.url.replace(window.location.origin, '').split('?')[0];
      const displayPath = cleanPath.length > 35 ? `${cleanPath.substring(0, 35)}...` : cleanPath;
      
      // Show method and path like "GET /api/team/members" or "POST /api/team/members"
      const methodAndPath = `${call.method} ${displayPath}`;

      const statusColorClass = call.status
        ? call.status >= 200 && call.status < 300 ? 'bg-green-500' : 
          call.status >= 400 ? 'bg-red-500' : 'bg-yellow-500'
        : '';

      return {
        key: call.id || index,
        call,
        methodAndPath,
        displayPath,
        statusColorClass
      };
    });
  }, [networkStats?.recentCalls]);

  if (!networkStats) {
    return (
      <div className="space-y-3 mt-3">
        <div className="text-center py-4 text-gray-500 text-xs">
          No network data available
        </div>
      </div>
    );
  }

  if (!statsCalculations) return null;

  return (
    <div className="space-y-3 mt-3">
      {isPaused && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-700 font-medium">Monitoring paused after reset</span>
          </div>
          <div className="text-blue-600 mt-1">
            Will resume automatically to show clean reset state
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Calls:</span>
          <span className="font-mono">{networkStats.totalCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Active Issues:</span>
          <span className="font-mono text-red-600">{networkStats.redundantCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Session Total:</span>
          <span className="font-mono text-orange-600">{statsCalculations.sessionTotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Efficiency:</span>
          <span className="font-mono">{networkScore}%</span>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-gray-700 border-b border-gray-200 pb-1">
          Debug Information
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600">Patterns Found:</span>
            <span className="font-mono">{statsCalculations.patternsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pattern Calls:</span>
            <span className="font-mono">{statsCalculations.patternCallsCount}</span>
          </div>
        </div>
      </div>

      {/* Redundant Patterns Details */}
      {patternDisplayData.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-700 border-b border-gray-200 pb-1 flex-1">
              Active Redundant Patterns
            </div>
            <button
              onClick={copyRedundancyReport}
              className="ml-2 h-5 px-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 flex-shrink-0"
              title="Copy redundancy report"
            >
              {copyButtonState === 'success' ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="sr-only">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="sr-only">Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {patternDisplayData.map(({ key, pattern, methodAndPath, callCount }) => (
              <div key={key} className="bg-red-50 border border-red-200 rounded-md p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-red-700">{methodAndPath}</span>
                  <span className="text-red-600">{callCount} calls</span>
                </div>
                <div className="text-gray-600 mt-1">
                  Window: {pattern.timeWindow}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Calls Summary */}
      {recentCallsDisplayData.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-gray-700 border-b border-gray-200 pb-1">
            Recent API Calls ({Math.min(5, statsCalculations.recentCallsCount)} of {statsCalculations.recentCallsCount})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {recentCallsDisplayData.map(({ key, call, methodAndPath, statusColorClass }) => (
              <div key={key} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center space-x-1 flex-1 min-w-0">
                  <span className="font-medium text-blue-600 flex-shrink-0 truncate" title={call.url}>{methodAndPath}</span>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {call.status && (
                    <span className={`w-2 h-2 rounded-full ${statusColorClass}`} title={`Status: ${call.status}`} />
                  )}
                  {call.duration && (
                    <span className="text-gray-500">{call.duration}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

NetworkDetailsContent.displayName = 'NetworkDetailsContent'; 