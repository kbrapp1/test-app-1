import { DetailedPerformanceMetrics } from '../../domain/entities/DetailedPerformanceMetrics';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../dto/PerformanceTrackingDTO';
import { DetailedPerformanceDataCollector } from './detailed-performance/DetailedPerformanceDataCollector';
import { PerformanceIssueAnalyzer } from './detailed-performance/PerformanceIssueAnalyzer';
import { OptimizationOpportunityGenerator } from './detailed-performance/OptimizationOpportunityGenerator';
import { DetailedPerformanceReportFormatter } from './detailed-performance/DetailedPerformanceReportFormatter';

/**
 * Service responsible for orchestrating detailed performance analysis and reporting
 * 
 * Coordinates specialized services to collect performance data, analyze issues,
 * generate optimization opportunities, and format comprehensive reports.
 */
export class DetailedPerformanceService {
  /**
   * Generates a detailed performance analysis report
   * 
   * Orchestrates data collection, analysis, and reporting to provide
   * comprehensive performance insights with actionable recommendations.
   * 
   * @param {PerformanceMetrics} basicMetrics - Basic performance metrics
   * @param {OptimizationGap[]} optimizations - Existing optimization gaps
   * @param {string} pageContext - Current page context
   * @param {PerformanceTrackingState} trackingState - Performance tracking state
   * @returns {Promise<DetailedPerformanceMetrics>} Detailed performance analysis
   */
  static async generateDetailedReport(
    basicMetrics: PerformanceMetrics,
    optimizations: OptimizationGap[],
    pageContext: string,
    trackingState?: PerformanceTrackingState | undefined
  ): Promise<DetailedPerformanceMetrics> {
    const performanceData = await DetailedPerformanceDataCollector.collectPerformanceData();
    
    const criticalIssues = PerformanceIssueAnalyzer.analyzeCriticalIssues(
      basicMetrics,
      performanceData.bundleAnalysis,
      performanceData.componentPerformance,
      performanceData.resourceTiming,
      optimizations
    );

    const optimizationOpportunities = OptimizationOpportunityGenerator.generateOpportunities(
      performanceData.bundleAnalysis,
      performanceData.componentPerformance,
      performanceData.resourceTiming
    );

    return {
      pageContext,
      timestamp: new Date().toISOString(),
      
      // Basic metrics
      renders: trackingState?.renderMetrics?.count || 0,
      cacheHitRate: trackingState?.cacheHitRate || 0,
      cacheSize: basicMetrics.cacheSize,
      activeMutations: basicMetrics.activeMutations,
      avgResponseTime: trackingState?.avgResponseTime || 0,
      
      // Enhanced metrics
      bundleAnalysis: performanceData.bundleAnalysis,
      componentPerformance: performanceData.componentPerformance,
      resourceTiming: performanceData.resourceTiming,
      
      // Analysis results
      criticalIssues,
      optimizationOpportunities
    };
  }

  /**
   * Formats detailed performance metrics into a human-readable enhanced report
   * 
   * Delegates to the report formatter service to generate comprehensive
   * markdown reports with analysis and recommendations.
   * 
   * @param {DetailedPerformanceMetrics} detailedMetrics - Detailed performance data
   * @returns {string} Formatted markdown report
   */
  static formatEnhancedReport(detailedMetrics: DetailedPerformanceMetrics): string {
    return DetailedPerformanceReportFormatter.formatEnhancedReport(detailedMetrics);
  }
}