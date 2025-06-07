import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

/**
 * Domain Service: Web Vitals Impact Assessor for Frontend Performance
 * Responsibility: Assess Web Vitals impact for performance optimizations
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Focus solely on Web Vitals impact assessment
 */
export class WebVitalsImpactAssessorService {
  
  /**
   * Business Rule: Assess Web Vitals impact for performance metrics
   */
  assessWebVitalImpact(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState
  ): string | null {
    // Memoization issues affect Interaction to Next Paint (INP)
    if (issue.type === 'memoization' && trackingState.renderMetrics.count > 10) {
      const severity = trackingState.renderMetrics.count > 20 ? 'significantly' : 'moderately';
      return `Improves INP and reduces jank ${severity}`;
    }
    
    // Lazy loading issues affect Largest Contentful Paint (LCP)
    if (issue.type === 'lazy-loading' && trackingState.webVitals?.LCP) {
      if (trackingState.webVitals.LCP > 4000) {
        return 'Improves LCP and FCP significantly (4s+ → <2.5s target)';
      } else if (trackingState.webVitals.LCP > 2500) {
        return 'Improves LCP moderately (2.5-4s → <2.5s target)';
      }
    }
    
    // Caching affects overall page speed
    if (issue.type === 'caching') {
      return 'Improves all Web Vitals through faster data loading';
    }
    
    return null;
  }
} 