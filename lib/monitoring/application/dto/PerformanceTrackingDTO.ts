// Application-level types for performance tracking
export interface WebVitalsMetrics {
  CLS?: number;
  LCP?: number;
  FCP?: number;
  INP?: number;
  TTFB?: number;
}

export interface RenderMetrics {
  count: number;
  rapidCount: number;
  lastReset: number;
}

export type PageContext = 'image-generator' | 'dam' | 'dashboard' | 'team' | 'settings' | 'other';

/**
 * Data Transfer Object for Performance Tracking State
 * Used to transfer performance tracking data between layers
 * without creating dependencies on presentation layer
 */
export interface PerformanceTrackingState {
  renderMetrics: RenderMetrics;
  cacheHitRate: number;
  avgResponseTime: number;
  webVitals: WebVitalsMetrics;
  pageContext: PageContext;
}

// Input metrics for hook, replacing domain PerformanceMetrics
export interface InputPerformanceMetrics {
  cacheSize: number;
  activeMutations: number;
  lastUpdate: string;
} 