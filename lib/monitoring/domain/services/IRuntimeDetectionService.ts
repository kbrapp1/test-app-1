import { OptimizationGap } from '../value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { SpecificCauseAnalysis } from '../value-objects/SpecificCauseAnalysis';

/**
 * Domain interface for runtime detection operations
 * Abstracts infrastructure-specific runtime analysis mechanisms
 */
export interface IRuntimeDetectionService {
  /**
   * Detect actual culprit causing performance issues
   * @param issue - The optimization gap to analyze
   * @param trackingState - Current performance tracking state
   * @returns Specific cause analysis or null if not detectable
   */
  detectActualCulprit(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState
  ): SpecificCauseAnalysis | null;
} 