import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';
import { ReportTemplateService } from '../../../application/services/ReportTemplateService';
import { ReportGenerationService } from '../../../application/services/ReportGenerationService';
import { IssueAnalysisService } from '../../../domain/services/business-impact/IssueAnalysisService';

/**
 * Presentation Layer Service - Handles UI-specific report formatting
 * Single Responsibility: Format reports for user interaction (copy/paste, display)
 */
export class NetworkReportFormattingService {
  /**
   * Format redundancy report for UI copy/paste functionality
   */
  static formatForClipboard(stats: NetworkStats): string {
    const reportLines: string[] = [];
    
    // Filter out legitimate behavior patterns for accurate count
    const issueAnalysisService = IssueAnalysisService.create();
    const actualIssues = stats.redundantPatterns.filter(pattern => {
      const analysis = issueAnalysisService.analyzeRedundantPattern(pattern);
      return analysis !== null;
    });
    
    // Use shared templating service with actual issue count
    reportLines.push(...ReportTemplateService.generateStandardHeader(
      '🚨 Network Performance Issues Report',
      'User Report',
      actualIssues.length
    ));
    
    // Generate issue sections (only for actual issues)
    const reportGenerationService = ReportGenerationService.create();
    actualIssues.forEach((pattern, index) => {
      const analysisResult = issueAnalysisService.analyzeRedundantPattern(pattern);
      if (analysisResult) {
        reportLines.push(...reportGenerationService.generateIssueSection(analysisResult, index));
      }
    });

    // Generate action plan (only if there are actual issues)
    if (actualIssues.length > 0) {
      const criticalCount = actualIssues.filter(p => p.duplicateCalls.length > 2).length;
      reportLines.push(...ReportTemplateService.generateActionPlanSection(
        'Current Page', 
        criticalCount, 
        actualIssues.length
      ));
    }

    // Implementation checklist (only if there are actual issues)
    if (actualIssues.length > 0) {
      reportLines.push(...ReportTemplateService.generateStandardChecklist());
    }

    return reportLines.join('\n');
  }

  /**
   * Format condensed report for UI display
   */
  static formatForDisplay(stats: NetworkStats): {
    summary: string;
    issues: Array<{
      title: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  } {
    // Filter out legitimate behavior patterns
    const issueAnalysisService = IssueAnalysisService.create();
    const actualIssues = stats.redundantPatterns.filter(pattern => {
      const analysis = issueAnalysisService.analyzeRedundantPattern(pattern);
      return analysis !== null;
    });

    const issues = actualIssues.map(pattern => ({
      title: `${pattern.pattern} Pattern`,
      description: `${pattern.duplicateCalls.length + 1} calls to ${pattern.originalCall.url}`,
      severity: pattern.duplicateCalls.length > 2 ? 'high' as const : 'medium' as const
    }));

    const actualRedundantCallCount = actualIssues.reduce((count, pattern) => 
      count + pattern.duplicateCalls.length, 0
    );

    return {
      summary: actualIssues.length > 0 
        ? `${actualRedundantCallCount} redundant calls affecting ${actualIssues.length} patterns`
        : 'No performance issues detected',
      issues
    };
  }
} 