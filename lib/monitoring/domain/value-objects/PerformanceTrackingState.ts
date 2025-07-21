import { WebVitalsMetrics } from './WebVitalsMetrics';

export interface RenderMetrics {
  count: number;
  rapidCount: number;
  lastReset: number;
}

export type PageContext = 'image-generator' | 'dam' | 'dashboard' | 'team' | 'settings' | 'other';

/**
 * Domain value object for Performance Tracking State
 * Represents the state of performance tracking within the monitoring domain
 */
export interface PerformanceTrackingState {
  renderMetrics: RenderMetrics;
  cacheHitRate: number;
  avgResponseTime: number;
  webVitals: WebVitalsMetrics;
  pageContext: PageContext;
}