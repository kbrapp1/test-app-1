import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { CrossDomainAnalysisService } from '../../domain/services/context-analysis/CrossDomainAnalysisService';
import { PageContextAnalysisService } from '../../domain/services/context-analysis/PageContextAnalysisService';
import { PageContextRepository } from '../../domain/repositories/PageContextRepository';
import { DomainRegistrationBootstrap } from '../../infrastructure/bootstrap/DomainRegistrationBootstrap';

/**
 * CrossDomainReportGenerationService coordinates performance reports that span multiple domains.
 * It intentionally imports from:
 *  - domain/cross-domain/services (CrossDomainInsight for correlated insights)
 *  - domain/services (CrossDomainAnalysisService, PageContextAnalysisService) to apply domain logic
 *  - infrastructure/bootstrap (DomainRegistrationBootstrap) to resolve repositories
 * 
 * These cross-domain imports are by design for correlating frontend and network metrics.
 */
export class CrossDomainReportGenerationService {
  private static pageContextService: PageContextAnalysisService | null = null;

  private static getPageContextService(): PageContextAnalysisService {
    if (!this.pageContextService) {
      const repository: PageContextRepository = DomainRegistrationBootstrap.getRepository();
      this.pageContextService = new PageContextAnalysisService(repository);
    }
    return this.pageContextService;
  }

  static async generateReport(
    crossDomainInsights: CrossDomainInsight[],
    pageContext?: string
  ): Promise<string> {
    const reportLines: string[] = [];
    const actualIssues = this.filterActualIssues(crossDomainInsights);
    
    reportLines.push(...this.generateHeader(actualIssues, pageContext));
    reportLines.push(...await this.generateIssuesSection(actualIssues, pageContext));
    reportLines.push(...await this.generateActionPlan(actualIssues, pageContext));
    reportLines.push(...this.generateImplementationChecklist());

    return reportLines.join('\n');
  }

  private static filterActualIssues(crossDomainInsights: CrossDomainInsight[]): CrossDomainInsight[] {
    return crossDomainInsights.filter(insight => {
      const isPositiveInsight = insight.title === 'Optimal Performance' || 
                                (insight.type === 'optimization' && insight.severity === 'low' && 
                                 insight.description.includes('well optimized'));
      return !isPositiveInsight;
    });
  }

  private static generateHeader(actualIssues: CrossDomainInsight[], pageContext?: string): string[] {
    const timestamp = new Date().toISOString();
    return [
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
  }

  private static async generateIssuesSection(
    actualIssues: CrossDomainInsight[], 
    pageContext?: string
  ): Promise<string[]> {
    const reportLines: string[] = [];
    
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
        
        await this.addAnalysisDetails(reportLines, insight, analysis, pageAnalysis);
        this.addCodeExample(reportLines, analysis);
        this.addImplementationSteps(reportLines, analysis);
        reportLines.push(``, `---`);
      }
    } else {
      reportLines.push(``, `✅ **No cross-domain issues detected** - frontend and network performance are well coordinated!`);
    }

    return reportLines;
  }

  private static async addAnalysisDetails(
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

  private static async generateActionPlan(
    issues: CrossDomainInsight[], 
    pageContext?: string
  ): Promise<string[]> {
    const reportLines = [
      ``,
      `## 🎯 Production Action Plan`,
      `### Cross-Domain Optimization Strategy for ${pageContext || 'Current Page'}:`
    ];
    
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

    return reportLines;
  }

  private static generateImplementationChecklist(): string[] {
    return [
      ``,
      `## ✅ Cross-Domain Implementation Checklist`,
      `- [ ] Review all critical/high priority cross-domain issues above`,
      `- [ ] Identify primary domain causing cascade effects`,
      `- [ ] Implement frontend optimizations (React Query, memoization)`,
      `- [ ] Implement network optimizations (caching, deduplication)`,
      `- [ ] Test performance improvements across both domains`,
      `- [ ] Monitor for new cross-domain correlations`,
      `- [ ] Schedule follow-up cross-domain performance review`
    ];
  }
} 