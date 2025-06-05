'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../hooks/usePerformanceTracking';
import { CopyButtonStateDto } from '../../application/dto/UnifiedIssueDto';
import { ReportGenerationService } from '../../application/services/ReportGenerationService';
import { IssueMapper } from '../../application/mappers/IssueMapper';

interface CopyReportButtonsProps {
  frontendIssues: OptimizationGap[];
  networkIssues: NetworkIssue[];
  crossDomainInsights: CrossDomainInsight[];
  metrics?: PerformanceMetrics;
  trackingState?: PerformanceTrackingState;
  copyButtonState: CopyButtonStateDto;
  onCopyStateChange: (state: CopyButtonStateDto) => void;
}

export const CopyReportButtons: React.FC<CopyReportButtonsProps> = ({
  frontendIssues,
  networkIssues,
  crossDomainInsights,
  metrics,
  trackingState,
  copyButtonState,
  onCopyStateChange
}) => {
  const actualCrossDomainIssues = crossDomainInsights.filter(insight => {
    const positiveInsights = IssueMapper.getPositiveInsights(crossDomainInsights);
    return !positiveInsights.includes(insight);
  });

  const copyFrontendReport = async () => {
    try {
      let report: string;
      
      if (metrics && trackingState) {
        report = ReportGenerationService.generateFrontendReport(metrics, trackingState, frontendIssues);
      } else {
        // Fallback to basic report if comprehensive data not available
        report = `# Frontend Performance Report\nGenerated: ${new Date().toISOString()}\n\nIssues: ${frontendIssues.length}`;
      }
      
      await navigator.clipboard.writeText(report);
      onCopyStateChange({ ...copyButtonState, frontend: 'success' });
      setTimeout(() => onCopyStateChange({ ...copyButtonState, frontend: 'default' }), 2000);
    } catch (error) {
      // Error handling
    }
  };

  const copyCrossDomainReport = async () => {
    try {
      const report = await ReportGenerationService.generateCrossDomainReport(
        crossDomainInsights,
        trackingState?.pageContext || 'dam'
      );
      await navigator.clipboard.writeText(report);
      onCopyStateChange({ ...copyButtonState, crossDomain: 'success' });
      setTimeout(() => onCopyStateChange({ ...copyButtonState, crossDomain: 'default' }), 2000);
    } catch (error) {
      // Error handling
    }
  };

  const copyBackendReport = async () => {
    try {
      const report = await ReportGenerationService.generateNetworkReport(
        networkIssues,
        trackingState?.pageContext || 'dam'
      );
      await navigator.clipboard.writeText(report);
      onCopyStateChange({ ...copyButtonState, backend: 'success' });
      setTimeout(() => onCopyStateChange({ ...copyButtonState, backend: 'default' }), 2000);
    } catch (error) {
      // Error handling
    }
  };

  return (
    <div className="flex gap-1">
      {/* Frontend Report Button */}
      {frontendIssues.length > 0 && (
        <button
          onClick={copyFrontendReport}
          className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 transition-colors"
          title="Copy frontend performance report"
        >
          {copyButtonState.frontend === 'success' ? (
            <>
              <Check className="w-3 h-3" />
              ✓
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              FE
            </>
          )}
        </button>
      )}
      
      {/* Cross-Domain Report Button */}
      {actualCrossDomainIssues.length > 0 && (
        <button
          onClick={copyCrossDomainReport}
          className="flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200 transition-colors"
          title="Copy cross-domain performance report"
        >
          {copyButtonState.crossDomain === 'success' ? (
            <>
              <Check className="w-3 h-3" />
              ✓
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              CD
            </>
          )}
        </button>
      )}
      
      {/* Backend/Network Report Button */}
      {networkIssues.length > 0 && (
        <button
          onClick={copyBackendReport}
          className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 transition-colors"
          title="Copy backend/network performance report"
        >
          {copyButtonState.backend === 'success' ? (
            <>
              <Check className="w-3 h-3" />
              ✓
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              BE
            </>
          )}
        </button>
      )}
    </div>
  );
}; 