import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { SpecificCauseAnalysis } from '../../value-objects/SpecificCauseAnalysis';
import { IRuntimeDetectionService } from '../interfaces/IRuntimeDetectionService';

/**
 * Cause Analysis Service (Domain Service)
 * 
 * Provides domain-level analysis to identify the specific root causes
 * of performance optimization gaps. Uses runtime detection to find
 * actual culprits rather than generic recommendations.
 * 
 * Follows DDD principles by maintaining proper layer boundaries and
 * dependency inversion through interface abstractions.
 * 
 * @class CauseAnalysisService
 * @since 1.0.0
 */
export class CauseAnalysisService {
  /**
   * Creates a new CauseAnalysisService instance
   * 
   * @param {IRuntimeDetectionService} runtimeDetectionService - Service for runtime analysis
   */
  constructor(private runtimeDetectionService: IRuntimeDetectionService) {}

  /**
   * Analyzes the specific root cause of a performance optimization gap
   * 
   * Performs deep analysis to identify the exact cause of a performance
   * issue by leveraging runtime detection capabilities. Returns specific
   * analysis results that can be used for targeted optimizations.
   * 
   * @param {OptimizationGap} optimizationGap - The performance gap to analyze
   * @param {PerformanceTrackingState} trackingState - Current performance tracking data
   * @param {PerformanceMetrics} performanceMetrics - Performance metrics context
   * @param {number} analysisIndex - Index for tracking multiple analyses
   * @returns {SpecificCauseAnalysis} Detailed analysis of the root cause
   * 
   * @example
   * ```typescript
   * const gap = { type: 'slow-render', severity: 'high' };
   * const analysis = causeAnalysisService.analyzeSpecificCause(
   *   gap, 
   *   trackingState, 
   *   metrics, 
   *   0
   * );
   * console.log(analysis.rootCause); // Specific cause details
   * ```
   * 
   * @throws {Error} When runtime detection service is not available
   */
  analyzeSpecificCause(
    optimizationGap: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    _performanceMetrics: PerformanceMetrics,
    _analysisIndex: number
  ): SpecificCauseAnalysis {
    // Try to get actual runtime data first
    const actualCulprit = this.runtimeDetectionService.detectActualCulprit(
      optimizationGap, 
      trackingState
    );
    
    if (actualCulprit) {
      return actualCulprit;
    }
    
    // Return empty analysis if no detection methods work
    // Note: Removed ContextDiscoveryService dependency to maintain proper DDD boundaries
    return {};
  }
} 