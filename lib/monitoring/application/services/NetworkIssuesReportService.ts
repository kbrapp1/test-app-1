import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { ReportTemplateService } from './ReportTemplateService';
import { NetworkAnalysisService } from '../../domain/services/network-analysis/NetworkAnalysisService';

/**
 * Service for generating network issues performance reports
 */
export class NetworkIssuesReportService {
  static async generateReport(
    networkIssues: NetworkIssue[],
    pageContext?: string
  ): Promise<string> {
    const reportLines: string[] = [];

    // Header
    reportLines.push(
      ...ReportTemplateService.generateStandardHeader(
        '🌐 Backend/Network Performance Report - PRODUCTION READY',
        pageContext,
        networkIssues.length
      )
    );

    // Issue details
    if (networkIssues.length > 0) {
      for (let index = 0; index < networkIssues.length; index++) {
        const issue = networkIssues[index];
        const analysis = NetworkAnalysisService.analyzeIssueForProduction(
          issue,
          index,
          pageContext
        );

        // Group issue details for efficient string-building
        const issueBlockLines = [
          '',
          `### 🚨 Issue #${index + 1}: ${analysis.issue}`,
          `**Priority**: ${analysis.priority.toUpperCase()} | **Business Impact**: ${analysis.businessImpact}`,
          `**Type**: ${issue.type} | **Severity**: ${issue.severity}`,
          `**Description**: ${issue.description}`,
          ''
        ];
        reportLines.push(issueBlockLines.join('\n'));
      }
    }

    // Action plan and checklist
    const criticalCount = networkIssues.filter(i => i.severity === 'high').length;
    const redundancyCount = networkIssues.filter(i => i.type === 'redundancy').length;

    reportLines.push(
      ...ReportTemplateService.generateActionPlanSection(
        pageContext || 'Current Page',
        criticalCount,
        redundancyCount
      )
    );
    reportLines.push(...ReportTemplateService.generateStandardChecklist());

    return reportLines.join('\n');
  }
} 