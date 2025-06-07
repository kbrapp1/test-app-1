'use client';

import { useMemo } from 'react';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceCalculationService } from '../../domain/services/PerformanceCalculationService';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { IssueAnalysisService } from '../../domain/services/IssueAnalysisService';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

/**
 * Performance Scores Hook (Presentation Layer)
 * 
 * Responsibility: Calculate and memoize performance scores
 * Bounded Context: Performance Monitoring Calculations
 * 
 * Single Responsibility: Focus solely on score calculation logic
 * 
 * @param {PerformanceMetrics} performanceMetrics - Core performance metrics from domain layer
 * @param {PerformanceTrackingState} trackingState - Current performance tracking state
 * @param {NetworkStats | null} networkStats - Network monitoring statistics
 * @returns {object} Calculated performance scores and indicators
 */
export function usePerformanceScores(
  performanceMetrics: PerformanceMetrics,
  trackingState: PerformanceTrackingState,
  networkStats: NetworkStats | null
) {
  /**
   * Filtered network stats that exclude legitimate behavior patterns
   * Uses domain service to filter out false positives
   */
  const filteredNetworkStats = useMemo(() => {
    if (!networkStats) return null;
    
    // Filter out legitimate infinite scroll patterns using domain service
    const issueAnalysisService = IssueAnalysisService.create();
    const actualRedundantPatterns = networkStats.redundantPatterns.filter(pattern => {
      const analysis = issueAnalysisService.analyzeRedundantPattern(pattern);
      return analysis !== null;
    });
    
    // Calculate actual redundant call count
    const actualRedundantCalls = actualRedundantPatterns.reduce((count, pattern) => 
      count + pattern.duplicateCalls.length, 0
    );
    
    // Calculate actual redundancy rate
    const actualRedundancyRate = networkStats.totalCalls > 0 
      ? (actualRedundantCalls / networkStats.totalCalls) * 100 
      : 0;
    
    return {
      ...networkStats,
      redundantPatterns: actualRedundantPatterns,
      redundantCalls: actualRedundantCalls,
      redundancyRate: actualRedundancyRate
    };
  }, [networkStats]);

  /**
   * Frontend performance score calculation
   * Memoized to prevent recalculation on every render
   */
  const frontendScore = useMemo(() => PerformanceCalculationService.calculateScore(
    performanceMetrics,
    trackingState.renderMetrics,
    trackingState.avgResponseTime,
    trackingState.webVitals
  ), [
    performanceMetrics, 
    trackingState.renderMetrics, 
    trackingState.avgResponseTime, 
    trackingState.webVitals
  ]);

  /**
   * Network performance score calculation
   * Based on actual redundancy rate (excluding legitimate patterns)
   * Lower redundancy = higher score
   */
  const networkScore = useMemo(() => {
    if (!filteredNetworkStats || filteredNetworkStats.totalCalls === 0) return 100;
    return Math.round(100 - filteredNetworkStats.redundancyRate);
  }, [filteredNetworkStats]);

  /**
   * Overall combined performance score
   * Average of frontend and network scores
   */
  const overallScore = useMemo(() => 
    Math.round((frontendScore.getValue() + networkScore) / 2), 
    [frontendScore, networkScore]
  );

  /**
   * Score color indicator for UI visualization
   * Green (90+), Yellow (70+), Red (<70)
   */
  const scoreColor = useMemo((): 'green' | 'yellow' | 'red' => 
    overallScore >= 90 ? 'green' : 
    overallScore >= 70 ? 'yellow' : 'red', 
    [overallScore]
  );

  return {
    // Filtered Data
    filteredNetworkStats,
    
    // Performance Scores
    frontendScore,
    networkScore,
    overallScore,
    scoreColor
  };
} 