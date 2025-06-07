import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

export class BusinessImpactCalculationService {
  static calculateFrontendBusinessImpact(
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): string {
    const renderCount = trackingState.renderMetrics.count;
    const cacheHitRate = trackingState.cacheHitRate;
    const webVitals = trackingState.webVitals;
    
    const impactLevel = this.determineImpactLevel(renderCount, cacheHitRate, webVitals, metrics, trackingState);
    const description = this.getImpactDescription(impactLevel);
    const icon = this.getImpactIcon(impactLevel);
    
    return `${icon} **${impactLevel.toUpperCase()}**: ${description}`;
  }

  private static determineImpactLevel(
    renderCount: number,
    cacheHitRate: number,
    webVitals: any,
    metrics: PerformanceMetrics,
    trackingState: PerformanceTrackingState
  ): string {
    if (renderCount > 20 || (webVitals?.LCP && webVitals.LCP > 4000) || cacheHitRate < 30) {
      return 'critical';
    }
    
    if (renderCount > 15 || (webVitals?.LCP && webVitals.LCP > 2500) || 
        (metrics.cacheSize === 0 && trackingState.pageContext !== 'dashboard')) {
      return 'high';
    }
    
    if (renderCount > 10 || cacheHitRate < 70) {
      return 'medium';
    }
    
    return 'low';
  }

  private static getImpactDescription(impactLevel: string): string {
    const descriptions = {
      'critical': 'Significant user experience degradation affecting conversions',
      'high': 'Performance issues impacting user satisfaction',
      'medium': 'Optimization opportunities for better performance',
      'low': 'Performance is acceptable'
    };
    
    return descriptions[impactLevel as keyof typeof descriptions] || 'Unknown impact level';
  }

  private static getImpactIcon(impactLevel: string): string {
    const icons = {
      'critical': '🔴',
      'high': '🟡',
      'medium': '🟢',
      'low': '✅'
    };
    
    return icons[impactLevel as keyof typeof icons] || '❓';
  }
} 