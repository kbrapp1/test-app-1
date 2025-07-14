import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { NetworkCall, RedundantCall } from '../../domain/network-efficiency/entities/NetworkCall';
import { IssueAnalysisService, IssueAnalysisResult } from '../../domain/services/business-impact/IssueAnalysisService';
import { CacheFixRecommendationService } from './CacheFixRecommendationService';
import { ReportTemplateService } from './ReportTemplateService';
import { NetworkIssuesReportService } from './NetworkIssuesReportService';

/**
 * Application Service: Orchestrates report generation using domain services
 * Responsibility: Coordinate issue analysis and report formatting
 */
export class ReportGenerationService {
  constructor(
    private readonly issueAnalysisService: IssueAnalysisService,
    private readonly fixRecommendationService: CacheFixRecommendationService
  ) {}

  /**
   * Application Use Case: Generate comprehensive report from network issues
   */
  async generateFromNetworkIssues(
    networkIssues: NetworkIssue[],
    pageContext?: string
  ): Promise<string> {
    // Delegate to specialized service
    return NetworkIssuesReportService.generateReport(
      networkIssues,
      pageContext
    );
  }

  /**
   * Application Use Case: Generate report from redundant patterns (main use case)
   */
  async generateFromRedundantPatterns(
    patterns: RedundantCall[], 
    pageContext?: string
  ): Promise<string> {
    // Use case step 1: Analyze patterns using domain service
    const analysisResults = this.analyzePatterns(patterns);
    
    // Use case step 2: Filter out legitimate patterns
    const legitimateIssues = analysisResults.filter(result => result !== null) as IssueAnalysisResult[];
    
    // Use case step 3: Classify issues by urgency
    const classification = this.issueAnalysisService.classifyIssuesByUrgency(legitimateIssues);
    
    // Use case step 4: Generate report structure
    const reportLines: string[] = [];
    
    // Header
    reportLines.push(...ReportTemplateService.generateStandardHeader(
      '🚨 Network Performance Issues Report',
      pageContext,
      classification.total
    ));
    
    // Issues sections
    if (legitimateIssues.length > 0) {
      for (let index = 0; index < legitimateIssues.length; index++) {
        const issueSection = this.generateIssueSection(legitimateIssues[index], index);
        reportLines.push(...issueSection);
      }
    }
    
    // Action plan
    const redundancyCount = classification.categories.get('redundancy-elimination')?.length || 0;
    reportLines.push(...ReportTemplateService.generateActionPlanSection(
      pageContext || 'unknown',
      classification.critical,
      redundancyCount
    ));
    
    return reportLines.join('\n');
  }

  /**
   * Private: Analyze patterns using domain service
   */
  private analyzePatterns(patterns: RedundantCall[]): (IssueAnalysisResult | null)[] {
    return patterns.map(pattern => 
      this.issueAnalysisService.analyzeRedundantPattern(pattern)
    );
  }

  /**
   * Public: Generate detailed issue section (used by legacy services)
   */
  public generateIssueSection(analysis: IssueAnalysisResult, index: number): string[] {
    const reportLines: string[] = [];
    const pattern = analysis.originalPattern;
    
    // Issue header
    reportLines.push(`### 🚨 Issue #${index + 1}: ${analysis.classification.issue}`);
    reportLines.push(
      `**Priority**: ${analysis.classification.severity.toUpperCase()} | ` +
      `**Time to Fix**: ${analysis.solution.estimatedImpact} | ` +
      `**Business Impact**: ${analysis.solution.businessImpact}`
    );
    reportLines.push('');
    
    // Technical details
    const urlDisplay = this.formatEndpointDisplay(pattern.originalCall);
    reportLines.push(`- **Endpoint**: \`${urlDisplay}\``);
    reportLines.push(`- **HTTP Method**: ${pattern.originalCall.method}`);
    reportLines.push(`- **Call Type**: ${pattern.originalCall.type || 'unknown'}`);
    reportLines.push(`- **Duplicate Count**: ${analysis.performance.duplicateCount} redundant call${analysis.performance.duplicateCount === 1 ? '' : 's'}`);
    reportLines.push(`- **Time Window**: ${analysis.performance.timeWindow}ms burst`);
    
    // Root cause and fix
    this.addRootCauseSection(reportLines, analysis);
    this.addFixSection(reportLines, analysis);
    this.addPerformanceTimeline(reportLines, pattern);
    
    reportLines.push('', '---');
    return reportLines;
  }

  /**
   * Public: Format endpoint display for readability
   */
  public formatEndpointDisplay(call: NetworkCall): string {
    if (call.url) return call.url;
    
    if (call.type === 'server-action') {
      return `[Server Action: ${(call.payload?.actionId as string)?.substring(0, 8) || 'unknown'}...]`;
    }
    
    return '[Unknown Endpoint]';
  }

  /**
   * Public: Add root cause analysis section
   */
  public addRootCauseSection(reportLines: string[], analysis: IssueAnalysisResult): void {
    reportLines.push('', '#### 🔍 Root Cause Analysis:');
    
    if (analysis.source.trigger) {
      reportLines.push(`- **Trigger Type**: \`${analysis.source.trigger}\``);
    }
    
    const stack = analysis.originalPattern.originalCall.source?.stack;
    if (stack) {
      reportLines.push('', '#### 📋 Call Stack (Top 5):');
      reportLines.push('```typescript');
      const stackLines = stack.split('\n').slice(0, 5);
      stackLines.forEach((line: string) => reportLines.push(line));
      reportLines.push('```');
    }
  }

  /**
   * Public: Add fix recommendation section
   */
  public addFixSection(reportLines: string[], analysis: IssueAnalysisResult): void {
    reportLines.push('', '#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):');
    reportLines.push(`**Problem**: ${analysis.classification.issue}`);
    reportLines.push(`**Solution**: ${analysis.solution.suggestedFix}`);
    
    // Generate code example for React Query issues
    if (analysis.classification.isReactQueryRelated && analysis.analysisSource === 'cache-analysis' && analysis.cacheAnalysis) {
      const codeExample = this.fixRecommendationService.generateSpecificFix(analysis.cacheAnalysis);
      if (codeExample) {
        reportLines.push('', '**Code Example:**');
        reportLines.push('```typescript');
        reportLines.push(codeExample);
        reportLines.push('```');
      }
    }
  }

  /**
   * Public: Add performance timeline
   */
  public addPerformanceTimeline(reportLines: string[], pattern: RedundantCall): void {
    if (pattern.duplicateCalls.length > 0) {
      reportLines.push('', '#### ⏱️ Performance Timeline:');
      pattern.duplicateCalls.forEach((call: NetworkCall, i: number) => {
        const timeFromOriginal = call.timestamp - pattern.originalCall.timestamp;
        reportLines.push(`- **Call ${i + 1}**: +${timeFromOriginal}ms after original`);
      });
    }
  }

  /**
   * Factory method for dependency injection
   */
  static create(): ReportGenerationService {
    return new ReportGenerationService(
      IssueAnalysisService.create(),
      CacheFixRecommendationService.create()
    );
  }
} 