'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { FrontendReportGenerationService } from '../../application/services/FrontendReportGenerationService';

interface PerformanceReportHeaderProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
  frontendOptimizations: OptimizationGap[];
}

export const PerformanceReportHeader: React.FC<PerformanceReportHeaderProps> = React.memo(({
  metrics,
  trackingState,
  frontendOptimizations
}) => {
  const [copyButtonState, setCopyButtonState] = useState<'default' | 'success'>('default');

  // Memoize expensive report generation
  const enhancedReport = useMemo(() => 
    FrontendReportGenerationService.generateReport(metrics, trackingState, frontendOptimizations),
    [metrics, trackingState, frontendOptimizations]
  );

  // Optimize click handler with useCallback
  const copyFrontendReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(enhancedReport);
      setCopyButtonState('success');
      setTimeout(() => setCopyButtonState('default'), 2000);
    } catch (error) {
      // Silent fail for copy operation
    }
  }, [enhancedReport]);

  return (
    <div className="flex justify-between items-center">
      <h3 className="font-medium text-gray-800">Frontend Performance</h3>
      <button
        onClick={copyFrontendReport}
        className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 transition-colors"
        title="Copy detailed frontend performance report"
      >
        {copyButtonState === 'success' ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy Report
          </>
        )}
      </button>
    </div>
  );
}); 