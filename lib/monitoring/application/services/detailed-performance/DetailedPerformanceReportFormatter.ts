import { DetailedPerformanceMetrics } from '../../../domain/entities/DetailedPerformanceMetrics';

/**
 * Service responsible for formatting detailed performance metrics into human-readable reports
 * 
 * Converts structured performance data into formatted markdown reports
 * with sections for bundle analysis, component performance, and optimization recommendations.
 */
export class DetailedPerformanceReportFormatter {
  /**
   * Formats detailed performance metrics into an enhanced markdown report
   * 
   * Generates a comprehensive report with bundle analysis, component performance,
   * resource timing, critical issues, and prioritized action recommendations.
   * 
   * @param {DetailedPerformanceMetrics} detailedMetrics - Detailed performance data
   * @returns {string} Formatted markdown report
   */
  static formatEnhancedReport(detailedMetrics: DetailedPerformanceMetrics): string {
    const report = [
      `# Enhanced Frontend Performance Report`,
      `Generated: ${detailedMetrics.timestamp}`,
      ``,
      `## Summary`,
      `- Page Context: ${detailedMetrics.pageContext}`,
      `- Renders: ${detailedMetrics.renders}`,
      `- Cache Hit Rate: ${detailedMetrics.cacheHitRate.toFixed(1)}%`,
      `- Cache Size: ${detailedMetrics.cacheSize}`,
      `- Active Mutations: ${detailedMetrics.activeMutations}`,
      `- Avg Response Time: ${detailedMetrics.avgResponseTime}ms`,
      ``
    ];

    // Add detailed sections
    this.addBundleAnalysisSection(report, detailedMetrics);
    this.addComponentPerformanceSection(report, detailedMetrics);
    this.addResourceTimingSection(report, detailedMetrics);
    this.addCriticalIssuesSection(report, detailedMetrics);
    this.addRecommendedActionsSection(report, detailedMetrics);

    return report.filter(line => line !== '').join('\n');
  }

  /**
   * Adds bundle analysis section to the report
   */
  private static addBundleAnalysisSection(report: string[], metrics: DetailedPerformanceMetrics): void {
    if (metrics.bundleAnalysis.totalSize > 0) {
      report.push(
        `## Bundle Analysis`,
        `- **Total Bundle Size**: ${this.formatBytes(metrics.bundleAnalysis.totalSize)}`,
        `- **Chunks**: ${metrics.bundleAnalysis.chunks.length}`,
        ``
      );

      this.addRouteSizesSubsection(report, metrics);
      this.addLargestImportsSubsection(report, metrics);
    }
  }

  /**
   * Adds route sizes subsection
   */
  private static addRouteSizesSubsection(report: string[], metrics: DetailedPerformanceMetrics): void {
    if (Object.keys(metrics.bundleAnalysis.routeSizes).length > 0) {
      report.push(`### Route Sizes`);
      Object.entries(metrics.bundleAnalysis.routeSizes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([route, size]) => {
          report.push(`- **${route}**: ${this.formatBytes(size)}`);
        });
      report.push(``);
    }
  }

  /**
   * Adds largest imports subsection
   */
  private static addLargestImportsSubsection(report: string[], metrics: DetailedPerformanceMetrics): void {
    if (metrics.bundleAnalysis.largestImports.length > 0) {
      report.push(`### Largest Imports`);
      metrics.bundleAnalysis.largestImports.slice(0, 5).forEach(imp => {
        const lazyNote = imp.isLazyLoadable ? ' (⚡ Lazy loadable)' : '';
        report.push(`- **${imp.module}**: ${this.formatBytes(imp.size)}${lazyNote}`);
      });
      report.push(``);
    }
  }

  /**
   * Adds component performance section to the report
   */
  private static addComponentPerformanceSection(report: string[], metrics: DetailedPerformanceMetrics): void {
    if (metrics.componentPerformance.length > 0) {
      report.push(`## Component Performance`, ``);

      const slowComponents = metrics.componentPerformance
        .filter(c => c.mountTime > 50 || c.renderTime > 16 || c.reRenderCount > 5)
        .slice(0, 10);

      if (slowComponents.length > 0) {
        report.push(`### Performance Issues`);
        slowComponents.forEach(comp => {
          const issues = [];
          if (comp.mountTime > 50) issues.push(`Mount: ${comp.mountTime.toFixed(1)}ms`);
          if (comp.renderTime > 16) issues.push(`Render: ${comp.renderTime.toFixed(1)}ms`);
          if (comp.reRenderCount > 5) issues.push(`Re-renders: ${comp.reRenderCount}`);
          
          report.push(`- **${comp.name}**: ${issues.join(', ')}`);
        });
        report.push(``);
      }
    }
  }

  /**
   * Adds resource timing section to the report
   */
  private static addResourceTimingSection(report: string[], metrics: DetailedPerformanceMetrics): void {
    const slowResources = metrics.resourceTiming
      .filter(r => r.duration > 500)
      .slice(0, 10);

    if (slowResources.length > 0) {
      report.push(`## Slow Resources`, ``);

      slowResources.forEach(resource => {
        const breakdown = [];
        if (resource.dnsLookup > 50) breakdown.push(`DNS: ${resource.dnsLookup.toFixed(0)}ms`);
        if (resource.tcpConnect > 50) breakdown.push(`Connect: ${resource.tcpConnect.toFixed(0)}ms`);
        if (resource.ttfb > 200) breakdown.push(`TTFB: ${resource.ttfb.toFixed(0)}ms`);
        if (resource.download > 100) breakdown.push(`Download: ${resource.download.toFixed(0)}ms`);

        const details = breakdown.length > 0 ? ` (${breakdown.join(', ')})` : '';
        report.push(`- **${resource.name}**: ${resource.duration.toFixed(0)}ms${details}`);
      });
      report.push(``);
    }
  }

  /**
   * Adds critical issues section to the report
   */
  private static addCriticalIssuesSection(report: string[], metrics: DetailedPerformanceMetrics): void {
    if (metrics.criticalIssues.length > 0) {
      report.push(`## Critical Issues`, ``);
      
      metrics.criticalIssues.forEach((issue, index) => {
        const issueLines = [
          `### Issue ${index + 1}: ${issue.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          `- **Type**: ${issue.type}`,
          `- **Severity**: ${issue.severity}`,
          issue.component ? `- **Component**: ${issue.component}` : '',
          `- **Description**: ${issue.description}`,
          `- **Impact**: ${issue.impact}`,
          `- **Solution**: ${issue.solution}`,
          `- **Estimated Improvement**: ${issue.estimatedImprovement}`,
          ``
        ].filter(Boolean);
        report.push(...issueLines);
      });
    }
  }

  /**
   * Adds recommended actions section to the report
   */
  private static addRecommendedActionsSection(report: string[], metrics: DetailedPerformanceMetrics): void {
    report.push(`## Recommended Actions (Priority Order)`, ``);
    
    const actions = this.generatePrioritizedActions(metrics);
    actions.forEach((action, index) => {
      report.push(`${index + 1}. **${action.title}**: ${action.description}`);
    });
  }

  /**
   * Generates prioritized action recommendations
   */
  private static generatePrioritizedActions(metrics: DetailedPerformanceMetrics): Array<{title: string, description: string}> {
    const actions = [];

    // Add optimization opportunity actions
    metrics.optimizationOpportunities.slice(0, 3).forEach(opportunity => {
      actions.push({
        title: `${opportunity.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: opportunity.implementation
      });
    });

    // Fallback actions
    if (actions.length === 0) {
      actions.push(
        {
          title: 'Enhanced Monitoring Active',
          description: 'Detailed performance analysis now available with bundle analysis, component profiling, and resource timing'
        },
        {
          title: 'Monitor Performance',
          description: 'Continue monitoring for performance regressions and optimization opportunities'
        },
        {
          title: 'Review Bundle Size',
          description: 'Check for new large dependencies that could benefit from code splitting'
        }
      );
    }

    return actions;
  }

  /**
   * Formats byte values into human-readable file size strings
   * 
   * @param {number} bytes - Raw byte count to format
   * @returns {string} Formatted string with appropriate unit
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const bytesPerUnit = 1024;
    const sizeUnits = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(bytesPerUnit));
    
    return parseFloat((bytes / Math.pow(bytesPerUnit, unitIndex)).toFixed(1)) + ' ' + sizeUnits[unitIndex];
  }
} 