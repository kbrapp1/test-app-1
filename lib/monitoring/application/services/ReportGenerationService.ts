import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../presentation/hooks/usePerformanceTracking';
import { CrossDomainAnalysisService } from '../../domain/services/CrossDomainAnalysisService';
import { NetworkAnalysisService } from '../../domain/services/NetworkAnalysisService';
import { PageContextAnalysisService } from '../../domain/services/PageContextAnalysisService';
import { PageContextRepository } from '../../domain/repositories/PageContextRepository';
import { DomainRegistrationBootstrap } from '../../infrastructure/bootstrap/DomainRegistrationBootstrap';

export class ReportGenerationService {
  private static pageContextService: PageContextAnalysisService | null = null;

  private static getPageContextService(): PageContextAnalysisService {
    if (!this.pageContextService) {
      const repository: PageContextRepository = DomainRegistrationBootstrap.getRepository();
      this.pageContextService = new PageContextAnalysisService(repository);
    }
    return this.pageContextService;
  }

  static generateFrontendReport(
    metrics: PerformanceMetrics, 
    trackingState: PerformanceTrackingState, 
    frontendOptimizations: OptimizationGap[]
  ): string {
    const timestamp = new Date().toISOString();
    const reportLines = [
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
      `## 🔧 Frontend Issues (Copy/Paste Ready)`
    ];

    if (frontendOptimizations.length > 0) {
      frontendOptimizations.forEach((issue, index) => {
        reportLines.push(``, `### 🚨 Issue #${index + 1}: ${issue.title}`);
        reportLines.push(`**Priority**: ${issue.severity.toUpperCase()} | **Type**: ${issue.type}`);
        reportLines.push(`**Description**: ${issue.description}`);
        reportLines.push(`**Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
        reportLines.push(`**Page Context**: ${trackingState.pageContext}`);

        reportLines.push(``, `#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):`);
        reportLines.push(`**Problem**: ${issue.title}`);
        reportLines.push(``, `---`);
      });
    } else {
      reportLines.push(``, `✅ **No optimization issues detected** - frontend performance is optimal!`);
    }

    this.addActionPlan(reportLines, frontendOptimizations, trackingState.pageContext);
    this.addImplementationChecklist(reportLines, trackingState.pageContext);

    return reportLines.join('\n');
  }

  static async generateCrossDomainReport(
    crossDomainInsights: CrossDomainInsight[],
    pageContext?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const actualIssues = crossDomainInsights.filter(insight => {
      const isPositiveInsight = insight.title === 'Optimal Performance' || 
                                (insight.type === 'optimization' && insight.severity === 'low' && 
                                 insight.description.includes('well optimized'));
      return !isPositiveInsight;
    });

    const reportLines = [
      `# 🔗 Cross-Domain Performance Report - ${(pageContext || 'unknown').toUpperCase()}`,
      `Generated: ${timestamp}`,
      `**Page**: ${pageContext || 'unknown'} | **Status**: PRODUCTION READY`,
      ``,
      `## 📊 Executive Summary`,
      `- **Domain Interactions**: Frontend ↔ Network performance correlation`,
      `- **Cross-Domain Issues Found**: ${actualIssues.length}`,
      `- **Analysis Type**: Real-time cascade detection and correlation analysis`,
      `- **Business Impact**: ${CrossDomainAnalysisService.calculateBusinessImpact(actualIssues)}`,
      ``,
      `## 🎯 Cross-Domain Performance Analysis`,
      `Cross-domain issues occur when frontend and network performance problems compound each other,`,
      `creating cascading effects that impact user experience more severely than isolated issues.`,
      ``,
      `## 🔧 Cross-Domain Issues (Copy/Paste Ready)`
    ];
    
    if (actualIssues.length > 0) {
      const pageContextService = this.getPageContextService();
      
      for (let index = 0; index < actualIssues.length; index++) {
        const insight = actualIssues[index];
        const analysis = CrossDomainAnalysisService.analyzeIssueForProduction(insight, index, pageContext);
        const pageAnalysis = await pageContextService.analyzeForCrossDomain(pageContext || 'unknown', insight.title);
        
        reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
        reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
        reportLines.push(`**Affected Domains**: ${analysis.domains.join(' + ')}`);
        reportLines.push(`**Page Context**: ${pageContext || 'unknown'}`);
        reportLines.push(``);
        
        await this.addCrossDomainAnalysisDetails(reportLines, insight, analysis, pageAnalysis);
        this.addCodeExample(reportLines, analysis);
        this.addImplementationSteps(reportLines, analysis);
        reportLines.push(``, `---`);
      }
    } else {
      reportLines.push(``, `✅ **No cross-domain issues detected** - frontend and network performance are well coordinated!`);
    }

    await this.addCrossDomainActionPlan(reportLines, actualIssues, pageContext);
    this.addCrossDomainChecklist(reportLines);

    return reportLines.join('\n');
  }

  static async generateNetworkReport(networkIssues: NetworkIssue[], pageContext?: string): Promise<string> {
    const timestamp = new Date().toISOString();
    const reportLines = [
      `# 🌐 Backend/Network Performance Report - PRODUCTION READY`,
      `Generated: ${timestamp}`,
      `**Page Context**: ${pageContext || 'unknown'} | **Status**: PRODUCTION READY`,
      ``,
      `## 📊 Executive Summary`,
      `- **Network Issues Found**: ${networkIssues.length}`,
      `- **Page Context**: ${pageContext || 'unknown'}`,
      `- **Analysis Type**: Real-time network performance monitoring and redundancy detection`,
      `- **Business Impact**: ${NetworkAnalysisService.calculateBusinessImpact(networkIssues)}`,
      ``,
      `## 🎯 Network Performance Analysis`,
      `Network issues impact user experience through slow response times, redundant requests,`,
      `and inefficient API usage patterns that compound frontend performance problems.`,
      ``,
      `## 🔧 Network Issues (Copy/Paste Ready)`
    ];

    if (networkIssues.length > 0) {
      for (let index = 0; index < networkIssues.length; index++) {
        const issue = networkIssues[index];
        const analysis = NetworkAnalysisService.analyzeIssueForProduction(issue, index, pageContext);
        
        reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
        reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
        reportLines.push(`**Occurrence Count**: ${issue.count} times | **First Detected**: ${new Date(issue.timestamp).toLocaleString()}`);
        reportLines.push(`**Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
        reportLines.push(``);
        
        await this.addNetworkAnalysisDetails(reportLines, issue, analysis, pageContext);
        this.addCodeExample(reportLines, analysis);
        this.addImplementationSteps(reportLines, analysis);
        reportLines.push(``, `---`);
      }
    } else {
      reportLines.push(``, `✅ **No network issues detected** - backend performance is optimal!`);
    }

    await this.addNetworkActionPlan(reportLines, networkIssues, pageContext);
    this.addNetworkChecklist(reportLines);

    return reportLines.join('\n');
  }

  private static addActionPlan(reportLines: string[], issues: OptimizationGap[], pageContext: string): void {
    reportLines.push(``, `## 🎯 Production Action Plan`);
    reportLines.push(`### Immediate Actions (This Sprint):`);
    
    const criticalIssues = issues.filter(issue => issue.severity === 'high');

    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Fix ${criticalIssues.length} critical issues immediately`);
      criticalIssues.forEach(issue => {
        reportLines.push(`  - ${issue.title}`);
      });
    }
  }

  private static addImplementationChecklist(reportLines: string[], pageContext: string): void {
    reportLines.push(``, `## ✅ Implementation Checklist`);
    reportLines.push(`- [ ] Review all critical/high priority issues above`);
    reportLines.push(`- [ ] Search codebase for identified components in ${pageContext} pages`);
    reportLines.push(`- [ ] Implement React Query for API calls if cache issues detected`);
    reportLines.push(`- [ ] Add memoization if render issues detected`);
    reportLines.push(`- [ ] Test performance improvements with this monitor`);
    reportLines.push(`- [ ] Monitor Web Vitals in production`);
    reportLines.push(`- [ ] Schedule follow-up performance review`);
  }

  private static async addCrossDomainAnalysisDetails(
    reportLines: string[], 
    insight: CrossDomainInsight, 
    analysis: any, 
    pageAnalysis: any
  ): Promise<void> {
    reportLines.push(`- **Issue Type**: \`${insight.type}\``);
    reportLines.push(`- **Severity**: ${insight.severity}`);
    reportLines.push(`- **Domain Interaction**: ${insight.domains.join(' ↔ ')}`);
    
    if (pageAnalysis.likelyFiles.length > 0) {
      reportLines.push(``, `#### 🔍 Page-Specific Root Cause Analysis:`);
      reportLines.push(`- **Likely Components**: ${pageAnalysis.likelyComponents.map((c: string) => `\`${c}\``).join(', ')}`);
      reportLines.push(`- **Likely Files to Modify:**`);
      pageAnalysis.likelyFiles.forEach((file: string) => {
        reportLines.push(`  - \`${file}\``);
      });
    }
  }

  private static async addNetworkAnalysisDetails(
    reportLines: string[], 
    issue: NetworkIssue, 
    analysis: any, 
    pageContext?: string
  ): Promise<void> {
    reportLines.push(`- **Issue Type**: \`${issue.type}\``);
    reportLines.push(`- **Severity**: ${issue.severity}`);
    reportLines.push(`- **Impact**: ${issue.description}`);

    reportLines.push(``, `#### 🔍 Root Cause Analysis:`);
    reportLines.push(`- **Primary Cause**: ${analysis.rootCause}`);
    reportLines.push(`- **Network Pattern**: ${analysis.networkPattern}`);
    
    if (pageContext) {
      const pageContextService = this.getPageContextService();
      const pageAnalysis = await pageContextService.analyzeForNetwork(pageContext);
      reportLines.push(``, `#### 🔍 Page-Specific Network Analysis:`);
      reportLines.push(`- **Likely API Endpoints**: ${pageAnalysis.likelyEndpoints.map((e: string) => `\`${e}\``).join(', ')}`);
      reportLines.push(`- **Optimization Targets**: ${pageAnalysis.optimizationTargets.join(', ')}`);
    }
  }

  private static addCodeExample(reportLines: string[], analysis: any): void {
    if (analysis.codeExample) {
      reportLines.push(``, `#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):`);
      reportLines.push(`**Problem**: ${analysis.issue}`);
      reportLines.push(`**Solution**: ${analysis.suggestedFix}`);
      reportLines.push(``, `**Code Example:**`);
      reportLines.push('```typescript');
      reportLines.push(analysis.codeExample);
      reportLines.push('```');
    }
  }

  private static addImplementationSteps(reportLines: string[], analysis: any): void {
    reportLines.push(``, `#### 📋 Implementation Steps:`);
    analysis.implementationSteps.forEach((step: string, i: number) => {
      reportLines.push(`${i + 1}. ${step}`);
    });
  }

  private static async addCrossDomainActionPlan(reportLines: string[], issues: CrossDomainInsight[], pageContext?: string): Promise<void> {
    reportLines.push(``, `## 🎯 Production Action Plan`);
    reportLines.push(`### Cross-Domain Optimization Strategy for ${pageContext || 'Current Page'}:`);
    
    const criticalIssues = issues.filter((insight, i) => 
      CrossDomainAnalysisService.analyzeIssueForProduction(insight, i, pageContext).priority === 'critical'
    );

    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Address ${criticalIssues.length} critical cross-domain issues immediately`);
    }

    const pageContextService = this.getPageContextService();
    const pageImplementationSteps = await pageContextService.getImplementationSteps(pageContext || 'unknown');
    reportLines.push(``, `### 📚 ${pageContext || 'Page'}-Specific Implementation Guide:`);
    pageImplementationSteps.forEach((step: string, i: number) => {
      reportLines.push(`${i + 1}. ${step}`);
    });
  }

  private static async addNetworkActionPlan(reportLines: string[], issues: NetworkIssue[], pageContext?: string): Promise<void> {
    reportLines.push(``, `## 🎯 Production Action Plan`);
    reportLines.push(`### Network Optimization Strategy for ${pageContext || 'Current Page'}:`);
    
    const criticalIssues = issues.filter(issue => issue.severity === 'high');
    const redundancyIssues = issues.filter(issue => issue.type === 'redundancy');
    
    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Address ${criticalIssues.length} critical network issues immediately`);
    }

    if (redundancyIssues.length > 0) {
      reportLines.push(`- **REDUNDANCY**: Eliminate ${redundancyIssues.length} redundant request patterns`);
      reportLines.push(`  - Implement request deduplication`);
      reportLines.push(`  - Add React Query for automatic caching`);
    }
  }

  private static addCrossDomainChecklist(reportLines: string[]): void {
    reportLines.push(``, `## ✅ Cross-Domain Implementation Checklist`);
    reportLines.push(`- [ ] Review all critical/high priority cross-domain issues above`);
    reportLines.push(`- [ ] Identify primary domain causing cascade effects`);
    reportLines.push(`- [ ] Implement frontend optimizations (React Query, memoization)`);
    reportLines.push(`- [ ] Implement network optimizations (caching, deduplication)`);
    reportLines.push(`- [ ] Test performance improvements across both domains`);
    reportLines.push(`- [ ] Monitor for new cross-domain correlations`);
    reportLines.push(`- [ ] Schedule follow-up cross-domain performance review`);
  }

  private static addNetworkChecklist(reportLines: string[]): void {
    reportLines.push(``, `## ✅ Network Implementation Checklist`);
    reportLines.push(`- [ ] Review all critical/high priority network issues above`);
    reportLines.push(`- [ ] Implement React Query for redundant API calls`);
    reportLines.push(`- [ ] Add request deduplication middleware`);
    reportLines.push(`- [ ] Optimize slow database queries and API endpoints`);
    reportLines.push(`- [ ] Add proper caching headers and strategies`);
    reportLines.push(`- [ ] Monitor network performance metrics in production`);
    reportLines.push(`- [ ] Schedule follow-up network performance review`);
  }
} 