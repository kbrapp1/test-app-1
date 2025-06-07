import { PerformanceMetrics } from '../entities/PerformanceMetrics';

/**
 * Repository interface for performance data operations
 * Defines contracts for accessing performance-related data
 * without coupling to specific infrastructure implementations
 */
export interface PerformanceDataRepository {
  /**
   * Retrieve current performance metrics
   */
  getPerformanceData(): Promise<PerformanceMetrics>;

  /**
   * Store performance metrics for historical analysis
   */
  storePerformanceData(metrics: PerformanceMetrics): Promise<void>;

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics[]>;

  /**
   * Clear performance data for reset operations
   */
  clearPerformanceData(): Promise<void>;
} 