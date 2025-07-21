// Application-level types for performance tracking
// Re-export domain types for application layer use
export type {
  WebVitalsMetrics,
  PerformanceTrackingState,
  RenderMetrics,
  PageContext
} from '../../domain/value-objects';

/**
 * Data Transfer Object for Performance Tracking State
 * Used to transfer performance tracking data between layers
 * without creating dependencies on presentation layer
 * 
 * Note: Now imports from domain layer (correct DDD direction)
 */

// Input metrics for hook, replacing domain PerformanceMetrics
export interface InputPerformanceMetrics {
  cacheSize: number;
  activeMutations: number;
  lastUpdate: string;
} 