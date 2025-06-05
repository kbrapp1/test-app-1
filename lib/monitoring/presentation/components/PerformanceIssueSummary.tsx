'use client';

import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../hooks/usePerformanceTracking';
import { CopyButtonStateDto } from '../../application/dto/UnifiedIssueDto';
import { IssueMapper } from '../../application/mappers/IssueMapper';
import { IssueCard } from './IssueCard';
import { CopyReportButtons } from './CopyReportButtons';

interface PerformanceIssueSummaryProps {
  frontendIssues: OptimizationGap[];
  networkIssues: NetworkIssue[];
  crossDomainInsights: CrossDomainInsight[];
  metrics?: PerformanceMetrics;
  trackingState?: PerformanceTrackingState;
}

export const PerformanceIssueSummary: React.FC<PerformanceIssueSummaryProps> = ({
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

  // Transform domain entities to DTOs using mapper
  const allIssues = IssueMapper.mapToUnifiedIssues(
    frontendIssues,
    networkIssues,
    crossDomainInsights
  );

  const positiveInsights = IssueMapper.getPositiveInsights(crossDomainInsights);
  const totalIssues = allIssues.length;
  const highSeverityCount = allIssues.filter(issue => issue.severity === 'high').length;

  // Show positive insight if no issues
  if (totalIssues === 0) {
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
              {totalIssues} total {totalIssues === 1 ? 'issue' : 'issues'}
              {highSeverityCount > 0 && (
                <span className="text-red-600 font-medium">
                  , {highSeverityCount} high severity
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
          onCopyStateChange={setCopyButtonState}
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
}; 