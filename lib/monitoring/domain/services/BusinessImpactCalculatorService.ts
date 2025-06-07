import { OptimizationGap } from '../value-objects/OptimizationGap';
import { PerformanceMetrics } from '../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { OptimizationPriority } from './OptimizationPriorityAssessmentService';

/**
 * Domain Service: Business Impact Calculator for Frontend Optimizations
 * Responsibility: Calculate business impact and development time estimates
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Focus solely on impact calculation and time estimation
 */
export class BusinessImpactCalculatorService {
  
  /**
   * Business Rule: Estimate development time based on optimization type and complexity
   */
  estimateTimeToFix(
    issue: OptimizationGap, 
    priority: OptimizationPriority
  ): string {
    const baseTimeEstimates = {
      'caching': '2-3 hours',
      'memoization': '1 hour',
      'lazy-loading': '2-4 hours',
      'debouncing': '1-2 hours',
      'batching': '2-3 hours'
    };
    
    const baseTime = baseTimeEstimates[issue.type as keyof typeof baseTimeEstimates] || '1-2 hours';
    
    // Adjust based on priority (critical issues may need more investigation)
    if (priority === 'critical') {
      return `${baseTime} + investigation time`;
    }
    
    return baseTime;
  }

  /**
   * Business Rule: Calculate business impact based on optimization type and priority
   */
  calculateBusinessImpact(
    issue: OptimizationGap, 
    priority: OptimizationPriority
  ): string {
    const baseImpacts = {
      'caching': 'Faster loading, reduced server load',
      'memoization': 'Reduced CPU usage, smoother UI',
      'lazy-loading': 'Faster initial page load',
      'debouncing': 'Reduced unnecessary API calls',
      'batching': 'Improved mutation efficiency'
    };
    
    const baseImpact = baseImpacts[issue.type as keyof typeof baseImpacts] || 'Performance optimization';
    
    // Enhance impact description based on priority
    if (priority === 'critical') {
      return `CRITICAL: ${baseImpact} - immediate user experience improvement`;
    }
    
    if (priority === 'high') {
      return `HIGH: ${baseImpact} - significant performance gains`;
    }
    
    return baseImpact;
  }

  /**
   * Business Rule: Calculate overall business impact for tracking state
   * Public method for backward compatibility with report generation
   */
  calculateOverallBusinessImpact(
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): string {
    if (trackingState.renderMetrics.count > 20) {
      return `🔴 **Critical Performance Issues**: ${trackingState.renderMetrics.count} renders detected - immediate optimization required`;
    }
    
    if (metrics.cacheSize === 0) {
      return `🟡 **Missing Caching**: No cached queries detected - implement React Query for ${trackingState.pageContext}`;
    }
    
    if (trackingState.cacheHitRate < 50) {
      return `🟡 **Poor Cache Efficiency**: ${trackingState.cacheHitRate.toFixed(1)}% hit rate - optimize cache configuration`;
    }
    
    return `🟢 **Good Performance**: No major issues detected, monitor for optimization opportunities`;
  }
} 