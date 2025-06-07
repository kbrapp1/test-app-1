import { PerformanceMetrics, RenderMetrics, WebVitalsMetrics } from '../../entities/PerformanceMetrics';
import { OptimizationGap } from '../../value-objects/OptimizationGap';

export type PageContext = 'image-generator' | 'dam' | 'dashboard' | 'team' | 'settings' | 'other';

export class OptimizationDetectionService {
  static detectMissingOptimizations(
    metrics: PerformanceMetrics,
    renderMetrics: RenderMetrics,
    cacheHitRate: number,
    webVitals: WebVitalsMetrics,
    pageContext: PageContext
  ): OptimizationGap[] {
    const gaps: OptimizationGap[] = [];
    
    // Missing React Query caching (ARCHITECTURAL - persists after reset)
    if (metrics.cacheSize === 0 && pageContext !== 'dashboard') {
      gaps.push(OptimizationGap.createCachingGap());
    }
    
    // Missing memoization (BEHAVIORAL - resets with metrics)
    if (renderMetrics.count > 15 || renderMetrics.rapidCount > 5) {
      gaps.push(OptimizationGap.createMemoizationGap(renderMetrics.count));
    }
    
    // Poor cache efficiency (BEHAVIORAL - resets with metrics)
    if (cacheHitRate > 0 && cacheHitRate < 30) {
      gaps.push(OptimizationGap.createDebouncingGap());
    }
    
    // Poor Web Vitals (BEHAVIORAL - resets with Web Vitals)
    if (webVitals.LCP && webVitals.LCP > 4000) {
      gaps.push(OptimizationGap.createLazyLoadingGap());
    }
    
    // High mutation count (REAL-TIME - persists after reset)
    if (metrics.activeMutations > 3) {
      gaps.push(OptimizationGap.createBatchingGap());
    }
    
    return gaps;
  }
} 