'use client';

import React, { useMemo, useCallback } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../../domain/cross-domain/services/PerformanceCorrelationService';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { CopyButtonStateDto } from '../../../application/dto/UnifiedIssueDto';
import { IssueMapper } from '../../../application/mappers/IssueMapper';
import { IssueCard } from './IssueCard';
import { CopyReportButtons } from '../optimization/CopyReportButtons';

interface PerformanceIssueSummaryProps {
  frontendIssues: OptimizationGap[];
  networkIssues: NetworkIssue[];
  crossDomainInsights: CrossDomainInsight[];
  metrics?: PerformanceMetrics;
  trackingState?: PerformanceTrackingState;
}

export const PerformanceIssueSummary = React.memo<PerformanceIssueSummaryProps>(({
  frontendIssues,
  networkIssues,
  crossDomainInsights,
  metrics,
  trackingState
}) => {
  const [copyButtonState, setCopyButtonState] = React.useState<CopyButtonStateDto>({
    frontend: 'default',
    crossDomain: 'default',
    backend: 'default'
  });

  // Transform domain entities to DTOs using mapper - memoized for performance
  const allIssues = useMemo(() => {
    return IssueMapper.mapToUnifiedIssues(
      frontendIssues,
      networkIssues,
      crossDomainInsights
    );
  }, [frontendIssues, networkIssues, crossDomainInsights]);

  const positiveInsights = useMemo(() => {
    return IssueMapper.getPositiveInsights(crossDomainInsights);
  }, [crossDomainInsights]);

  const issueMetrics = useMemo(() => {
    const totalIssues = allIssues.length;
    const highSeverityCount = allIssues.filter(issue => issue.severity === 'high').length;
    return { totalIssues, highSeverityCount };
  }, [allIssues]);

  const handleCopyStateChange = useCallback((state: CopyButtonStateDto) => {
    setCopyButtonState(state);
  }, []);

  // Show positive insight if no issues
  if (issueMetrics.totalIssues === 0) {
    const positiveInsight = positiveInsights[0];
    
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="font-semibold text-green-800">
            {positiveInsight ? positiveInsight.title : 'All Systems Optimal'}
          </h3>
          <p className="text-sm text-green-700">
            {positiveInsight ? positiveInsight.description : 'No performance issues detected'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Performance Issues Header with Copy Report Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-gray-800">
              Performance Issues Detected
            </h3>
            <p className="text-sm text-gray-600">
              {issueMetrics.totalIssues} total {issueMetrics.totalIssues === 1 ? 'issue' : 'issues'}
              {issueMetrics.highSeverityCount > 0 && (
                <span className="text-red-600 font-medium">
                  , {issueMetrics.highSeverityCount} high severity
                </span>
              )}
            </p>
          </div>
        </div>
        
        <CopyReportButtons
          frontendIssues={frontendIssues}
          networkIssues={networkIssues}
          crossDomainInsights={crossDomainInsights}
          metrics={metrics}
          trackingState={trackingState}
          copyButtonState={copyButtonState}
          onCopyStateChange={handleCopyStateChange}
        />
      </div>

      {/* Issues List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {allIssues.map((issue, index) => (
          <IssueCard 
            key={`${issue.category}-${index}-${issue.timestamp}`}
            issue={issue}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

PerformanceIssueSummary.displayName = 'PerformanceIssueSummary'; 