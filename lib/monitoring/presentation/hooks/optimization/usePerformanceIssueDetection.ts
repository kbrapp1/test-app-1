'use client';

import { useMemo } from 'react';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { OptimizationDetectionService } from '../../../domain/services/optimization/OptimizationDetectionService';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';

// Performance Issue Detection Hook - detects optimization opportunities
export function usePerformanceIssueDetection(
  performanceMetrics: PerformanceMetrics,
  trackingState: PerformanceTrackingState,
  networkStats: NetworkStats | null,
  isPaused: boolean
) {
  // Frontend optimization gaps detection - paused when monitoring disabled
  const frontendOptimizations = useMemo(() => 
    isPaused ? [] : OptimizationDetectionService.detectMissingOptimizations(
      performanceMetrics,
      trackingState.renderMetrics,
      trackingState.cacheHitRate,
      trackingState.webVitals,
      trackingState.pageContext
    ), [
      performanceMetrics, 
      trackingState.renderMetrics, 
      trackingState.cacheHitRate, 
      trackingState.webVitals, 
      trackingState.pageContext, 
      isPaused
    ]
  );

  /**
   * Network performance issues detection
   * Identifies persistent network inefficiencies
   * Returns empty array when monitoring is paused or no data available
   */
  const networkIssues = useMemo(() => {
    if (isPaused || !networkStats) return [];
    return networkStats.persistentIssues || [];
  }, [networkStats, isPaused]);

  /**
   * Total issue count for dashboard summary
   */
  const totalIssueCount = useMemo(() => 
    frontendOptimizations.length + networkIssues.length,
    [frontendOptimizations.length, networkIssues.length]
  );

  /**
   * Issue severity classification
   * Categorizes issues by their severity property
   */
  const issueSeverity = useMemo(() => {
    const criticalIssues = frontendOptimizations.filter(opt => 
      opt.severity === 'high'
    ).length;
    
    const moderateIssues = frontendOptimizations.filter(opt => 
      opt.severity === 'medium'
    ).length;

    return {
      critical: criticalIssues,
      moderate: moderateIssues,
      low: totalIssueCount - criticalIssues - moderateIssues
    };
  }, [frontendOptimizations, totalIssueCount]);

  return {
    // Detected Issues
    frontendOptimizations,
    networkIssues,
    
    // Issue Metrics
    totalIssueCount,
    issueSeverity
  };
} 