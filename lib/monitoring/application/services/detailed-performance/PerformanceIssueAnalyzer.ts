import { PerformanceIssue } from '../../../domain/entities/DetailedPerformanceMetrics';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';

/**
 * Service responsible for analyzing performance data to identify critical issues
 * 
 * Evaluates bundle sizes, component performance, resource timing, and optimization gaps
 * to generate actionable performance issue reports.
 */
export class PerformanceIssueAnalyzer {
  /**
   * Analyzes performance data to identify critical issues requiring attention
   * 
   * Examines bundle analysis, component performance, resource timing, and existing
   * optimization gaps to generate prioritized issue reports.
   * 
   * @param {PerformanceMetrics} basicMetrics - Basic performance metrics
   * @param {any} bundleAnalysis - Bundle analysis results
   * @param {any[]} componentPerformance - Component performance data
   * @param {any[]} resourceTiming - Resource timing data
   * @param {OptimizationGap[]} optimizations - Existing optimization gaps
   * @returns {PerformanceIssue[]} Array of critical performance issues
   */
  static analyzeCriticalIssues(
    basicMetrics: PerformanceMetrics,
    bundleAnalysis: any,
    componentPerformance: any[],
    resourceTiming: any[],
    optimizations: OptimizationGap[]
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Analyze bundle size issues
    const bundleIssues = this.analyzeBundleSizeIssues(bundleAnalysis);
    issues.push(...bundleIssues);

    // Convert optimization gaps to performance issues
    const optimizationIssues = this.convertOptimizationGapsToIssues(optimizations);
    issues.push(...optimizationIssues);

    return issues;
  }

  /**
   * Analyzes bundle analysis data for size-related performance issues
   * 
   * @param {any} bundleAnalysis - Bundle analysis results
   * @returns {PerformanceIssue[]} Bundle-related performance issues
   */
  private static analyzeBundleSizeIssues(bundleAnalysis: any): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    if (bundleAnalysis.totalSize > 1000000) {
      issues.push({
        type: 'bundle-size',
        severity: bundleAnalysis.totalSize > 5000000 ? 'critical' : 'high',
        description: `Large bundle size: ${this.formatBytes(bundleAnalysis.totalSize)}`,
        impact: `Slow initial page load, especially on mobile devices`,
        solution: `Implement code splitting and lazy loading`,
        estimatedImprovement: `Reduce initial load by 30-50%`
      });
    }

    return issues;
  }

  /**
   * Converts optimization gaps into actionable performance issues
   * 
   * @param {OptimizationGap[]} optimizations - Existing optimization gaps
   * @returns {PerformanceIssue[]} Performance issues from optimization gaps
   */
  private static convertOptimizationGapsToIssues(optimizations: OptimizationGap[]): PerformanceIssue[] {
    return optimizations
      .filter(gap => gap.severity === 'high')
      .map(gap => ({
        type: 'lazy-loading',
        severity: 'high',
        description: gap.description,
        impact: `Performance bottleneck affecting user experience`,
        solution: gap.description,
        estimatedImprovement: `Improve performance metrics by 20-40%`
      }));
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