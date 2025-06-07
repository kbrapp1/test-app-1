import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

/**
 * Domain Service: Priority Assessment for Frontend Optimizations
 * Responsibility: Determine optimization priority based on performance impact
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Focus solely on priority determination logic
 */
export class OptimizationPriorityAssessmentService {
  
  /**
   * Business Rule: Determine priority based on performance impact
   */
  assessPriority(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): OptimizationPriority {
    if (this.isCriticalIssue(issue, trackingState, metrics)) {
      return 'critical';
    }
    
    if (this.isHighPriorityIssue(issue, trackingState, metrics)) {
      return 'high';
    }
    
    if (this.isMediumPriorityIssue(issue, trackingState, metrics)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Business Rule: Critical issues that require immediate attention
   */
  private isCriticalIssue(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): boolean {
    // Excessive re-renders causing severe performance degradation
    if (issue.type === 'memoization' && trackingState.renderMetrics.count > 20) {
      return true;
    }
    
    // No caching on high-traffic pages
    if (issue.type === 'caching' && metrics.cacheSize === 0 && trackingState.pageContext === 'dashboard') {
      return true;
    }
    
    // LCP over 4 seconds with lazy loading issues
    if (issue.type === 'lazy-loading' && trackingState.webVitals?.LCP && trackingState.webVitals.LCP > 4000) {
      return true;
    }
    
    return false;
  }

  /**
   * Business Rule: High priority issues with significant impact
   */
  private isHighPriorityIssue(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): boolean {
    // Missing caching on any page
    if (issue.type === 'caching' && metrics.cacheSize === 0) {
      return true;
    }
    
    // Moderate re-render issues
    if (issue.type === 'memoization' && trackingState.renderMetrics.count > 10) {
      return true;
    }
    
    // LCP between 2.5-4 seconds
    if (issue.type === 'lazy-loading' && trackingState.webVitals?.LCP && 
        trackingState.webVitals.LCP > 2500 && trackingState.webVitals.LCP <= 4000) {
      return true;
    }
    
    return false;
  }

  /**
   * Business Rule: Medium priority optimization opportunities
   */
  private isMediumPriorityIssue(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): boolean {
    // Any debouncing or batching opportunities
    if (issue.type === 'debouncing' || issue.type === 'batching') {
      return true;
    }
    
    // Minor re-render issues
    if (issue.type === 'memoization' && trackingState.renderMetrics.count > 5) {
      return true;
    }
    
    return true; // Default to medium for other optimization opportunities
  }
}

/**
 * Value Object: Optimization priority levels
 */
export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low'; 