'use client';

import { useMemo } from 'react';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { OptimizationDetectionService } from '../../domain/services/OptimizationDetectionService';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

/**
 * Performance Issue Detection Hook (Presentation Layer)
 * 
 * Responsibility: Detect and analyze performance optimization opportunities
 * Bounded Context: Performance Issue Analysis
 * 
 * Single Responsibility: Focus solely on issue detection and gap analysis
 * 
 * @param {PerformanceMetrics} performanceMetrics - Core performance metrics from domain layer
 * @param {PerformanceTrackingState} trackingState - Current performance tracking state
 * @param {NetworkStats | null} networkStats - Network monitoring statistics
 * @param {boolean} isPaused - Whether monitoring is currently paused
 * @returns {object} Detected performance issues and optimization gaps
 */
export function usePerformanceIssueDetection(
  performanceMetrics: PerformanceMetrics,
  trackingState: PerformanceTrackingState,
  networkStats: NetworkStats | null,
  isPaused: boolean
) {
  /**
   * Frontend optimization gaps detection
   * Analyzes performance metrics to identify missing optimizations
   * Paused when monitoring is disabled to prevent stale data analysis
   */
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
  }, [networkStats?.persistentIssues, isPaused]);

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