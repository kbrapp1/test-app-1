import { PerformanceMetrics, RenderMetrics, WebVitalsMetrics, PerformanceScore } from '../entities/PerformanceMetrics';

export class PerformanceCalculationService {
  static calculateScore(
    metrics: PerformanceMetrics,
    renderMetrics: RenderMetrics,
    avgResponseTime: number,
    webVitals: WebVitalsMetrics
  ): PerformanceScore {
    let score = 100;
    
    // Deduct points for excessive renders
    if (renderMetrics.count > 10) {
      score -= Math.min(30, (renderMetrics.count - 10) * 2);
    }
    
    // Deduct points for large cache size
    if (metrics.cacheSize > 50) {
      score -= Math.min(20, (metrics.cacheSize - 50) * 0.5);
    }
    
    // Deduct points for active mutations
    if (metrics.activeMutations > 3) {
      score -= (metrics.activeMutations - 3) * 5;
    }
    
    // Deduct points for slow response times
    if (avgResponseTime > 1000) {
      score -= Math.min(20, (avgResponseTime - 1000) / 100);
    }
    
    // Deduct points for poor Web Vitals
    if (webVitals.LCP && webVitals.LCP > 2500) {
      score -= Math.min(15, (webVitals.LCP - 2500) / 100);
    }
    if (webVitals.CLS && webVitals.CLS > 0.1) {
      score -= Math.min(15, (webVitals.CLS - 0.1) * 100);
    }
    if (webVitals.FCP && webVitals.FCP > 1800) {
      score -= Math.min(10, (webVitals.FCP - 1800) / 100);
    }
    if (webVitals.INP && webVitals.INP > 200) {
      score -= Math.min(10, (webVitals.INP - 200) / 20);
    }
    
    return PerformanceScore.create(score);
  }
} 