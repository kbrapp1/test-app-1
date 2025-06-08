'use client';

import React, { useMemo, useCallback } from 'react';
import { Activity, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../../domain/network-efficiency/value-objects/NetworkIssue';

interface PerformanceCompactViewProps {
  overallScore: number;
  frontendIssues: OptimizationGap[];
  networkIssues: NetworkIssue[];
  onExpand: () => void;
}

export const PerformanceCompactView = React.memo<PerformanceCompactViewProps>(({
  overallScore,
  frontendIssues,
  networkIssues,
  onExpand
}) => {
  // Memoize status calculations
  const statusData = useMemo(() => {
    const frontendStatus: 'good' | 'warning' | 'error' = frontendIssues.length === 0 ? 'good' : 
                          frontendIssues.some(issue => issue.severity === 'high') ? 'error' : 'warning';
    
    const networkStatus: 'good' | 'warning' | 'error' = networkIssues.length === 0 ? 'good' :
                         networkIssues.some(issue => issue.severity === 'high') ? 'error' : 'warning';

    const overallColor = overallScore >= 90 ? 'text-green-600' : 
                        overallScore >= 70 ? 'text-yellow-600' : 'text-red-600';

    return {
      frontendStatus,
      networkStatus,
      overallColor
    };
  }, [frontendIssues, networkIssues, overallScore]);

  // Memoize icon and color utilities
  const getStatusIcon = useCallback((status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  }, []);

  const handleExpand = useCallback(() => {
    onExpand();
  }, [onExpand]);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={handleExpand}
        className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3 hover:bg-white transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-gray-600" />
          
          <div className="flex items-center gap-4 text-xs">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`font-bold ${statusData.overallColor}`}>{overallScore}</div>
              <div className="text-gray-500 text-[10px]">Score</div>
            </div>
            
            {/* Frontend Status */}
            <div className="flex items-center gap-1">
              {getStatusIcon(statusData.frontendStatus)}
              <div className="text-center">
                <div className={`font-medium ${getStatusColor(statusData.frontendStatus)}`}>
                  {frontendIssues.length}
                </div>
                <div className="text-gray-500 text-[10px]">FE</div>
              </div>
            </div>
            
            {/* Network Status */}
            <div className="flex items-center gap-1">
              {getStatusIcon(statusData.networkStatus)}
              <div className="text-center">
                <div className={`font-medium ${getStatusColor(statusData.networkStatus)}`}>
                  {networkIssues.length}
                </div>
                <div className="text-gray-500 text-[10px]">NET</div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
});

PerformanceCompactView.displayName = 'PerformanceCompactView'; 