import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../dto/PerformanceTrackingDTO';
import { FrontendOptimizationAnalysisService } from '../../domain/services/FrontendOptimizationAnalysisService';
import { WebVitalsAnalysisService } from '../../domain/services/WebVitalsAnalysisService';

export class FrontendReportGenerationService {
  static generateReport(
    metrics: PerformanceMetrics, 
    trackingState: PerformanceTrackingState, 
    frontendOptimizations: OptimizationGap[]
  ): string {
    const reportLines: string[] = [];
    
    reportLines.push(...this.generateHeader(trackingState, metrics, frontendOptimizations));
    reportLines.push(...this.generateWebVitalsSection(trackingState));
    reportLines.push(...this.generateIssuesSection(frontendOptimizations, trackingState, metrics));
    reportLines.push(...this.generateActionPlan(frontendOptimizations, trackingState.pageContext));
    reportLines.push(...this.generateImplementationChecklist(trackingState.pageContext));

    return reportLines.join('\n');
  }

  private static generateHeader(
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics, 
    frontendOptimizations: OptimizationGap[]
  ): string[] {
    const timestamp = new Date().toISOString();
    return [
      `# 🚀 Frontend Performance Report - PRODUCTION READY`,
      `Generated: ${timestamp}`,
      ``,
      `## 📊 Executive Summary`,
      `- **Page Context**: ${trackingState.pageContext}`,
      `- **Total Renders**: ${trackingState.renderMetrics.count}`,
      `- **Cache Performance**: ${trackingState.cacheHitRate.toFixed(1)}% hit rate`,
      `- **Cache Size**: ${metrics.cacheSize} queries cached`,
      `- **Active Mutations**: ${metrics.activeMutations}`,
      `- **Avg Response Time**: ${trackingState.avgResponseTime}ms`,
      `- **Issues Found**: ${frontendOptimizations.length}`,
      ``,
      `## 🎯 Business Impact`,
      FrontendOptimizationAnalysisService.calculateBusinessImpact(trackingState, metrics),
      ``
    ];
  }

  private static generateWebVitalsSection(trackingState: PerformanceTrackingState): string[] {
    const reportLines = [`## 📈 Web Vitals Performance`];

    if (Object.keys(trackingState.webVitals).length > 0) {
      Object.entries(trackingState.webVitals).forEach(([metric, value]) => {
        const typedMetric = metric as keyof typeof trackingState.webVitals;
        const rating = WebVitalsAnalysisService.getWebVitalRating(typedMetric, value);
        const displayValue = WebVitalsAnalysisService.formatWebVitalValue(typedMetric, value);
        
        reportLines.push(`- **${metric}**: ${displayValue} (${rating.toUpperCase()})`);
      });
    } else {
      reportLines.push(`- 📊 Collecting Web Vitals metrics...`);
    }

    return reportLines;
  }

  private static generateIssuesSection(
    frontendOptimizations: OptimizationGap[], 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): string[] {
    const reportLines = [``, `## 🔧 Frontend Issues (Copy/Paste Ready)`];

    if (frontendOptimizations.length > 0) {
      frontendOptimizations.forEach((issue, index) => {
        const analysis = FrontendOptimizationAnalysisService.analyzeIssueForProduction(issue, trackingState, metrics, index);
        
        reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
        reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
        if (analysis.webVitalImpact) {
          reportLines.push(`**Web Vital Impact**: ${analysis.webVitalImpact}`);
        }
        reportLines.push(``);
        
        reportLines.push(`- **Issue Type**: \`${issue.type}\``);
        reportLines.push(`- **Severity**: ${issue.severity}`);
        reportLines.push(`- **Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
        reportLines.push(`- **Page Context**: ${trackingState.pageContext}`);

        reportLines.push(...this.generateRootCauseAnalysis(issue, trackingState, metrics, index));
        reportLines.push(...this.generateFixSection(analysis));

        reportLines.push(``, `---`);
      });
    } else {
      reportLines.push(``, `✅ **No optimization issues detected** - frontend performance is optimal!`);
    }

    return reportLines;
  }

  private static generateRootCauseAnalysis(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics, 
    index: number
  ): string[] {
    const reportLines = [``, `#### 🔍 Root Cause Analysis:`];
    const specificAnalysis = FrontendOptimizationAnalysisService.analyzeSpecificCause(issue, trackingState, metrics, index);
    
    if (specificAnalysis.primaryComponent) {
      reportLines.push(`- **Primary Culprit**: \`${specificAnalysis.primaryComponent}\``);
      reportLines.push(`  - **File**: \`${specificAnalysis.primaryComponentPath}\``);
      reportLines.push(`  - **Issue**: ${specificAnalysis.componentIssue}`);
    }
    
    if (specificAnalysis.primaryHook) {
      reportLines.push(`- **Problem Hook**: \`${specificAnalysis.primaryHook}\``);
      reportLines.push(`  - **File**: \`${specificAnalysis.primaryHookPath}\``);
      reportLines.push(`  - **Issue**: ${specificAnalysis.hookIssue}`);
    }
    
    if (specificAnalysis.problemQuery) {
      reportLines.push(`- **Problematic Query**: \`${specificAnalysis.problemQuery}\``);
      reportLines.push(`  - **Missing Cache**: ${specificAnalysis.cacheIssue}`);
      reportLines.push(`  - **Called From**: \`${specificAnalysis.querySource}\``);
    }

    return reportLines;
  }

  private static generateFixSection(analysis: any): string[] {
    const reportLines = [``, `#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):`];
    reportLines.push(`**Problem**: ${analysis.issue}`);
    reportLines.push(`**Solution**: ${analysis.suggestedFix}`);
    
    if (analysis.codeExample) {
      reportLines.push(``, `**Code Example:**`);
      reportLines.push('```typescript');
      reportLines.push(analysis.codeExample);
      reportLines.push('```');
    }

    return reportLines;
  }

  private static generateActionPlan(issues: OptimizationGap[], pageContext: string): string[] {
    const reportLines = [``, `## 🎯 Production Action Plan`, `### Immediate Actions (This Sprint):`];
    
    const criticalIssues = issues.filter(issue => issue.severity === 'high');

    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Fix ${criticalIssues.length} critical issues immediately`);
      criticalIssues.forEach(issue => {
        reportLines.push(`  - ${issue.title}`);
      });
    }

    return reportLines;
  }

  private static generateImplementationChecklist(pageContext: string): string[] {
    return [
      ``,
      `## ✅ Implementation Checklist`,
      `- [ ] Review all critical/high priority issues above`,
      `- [ ] Search codebase for identified components in ${pageContext} pages`,
      `- [ ] Implement React Query for API calls if cache issues detected`,
      `- [ ] Add memoization if render issues detected`,
      `- [ ] Test performance improvements with this monitor`,
      `- [ ] Monitor Web Vitals in production`,
      `- [ ] Schedule follow-up performance review`
    ];
  }
} 