'use client';

import { useMemo } from 'react';
import { PerformanceCorrelationService } from '../../../domain/cross-domain/services/PerformanceCorrelationService';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';
import { RenderMetrics } from '../../../domain/entities/PerformanceMetrics';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';
import { NetworkIssue } from '../../../domain/network-efficiency/value-objects/NetworkIssue';

/**
 * Cross-Domain Performance Insights Hook (Presentation Layer)
 * 
 * Responsibility: Generate cross-domain performance correlation insights
 * Bounded Context: Performance Correlation Analysis
 * 
 * Single Responsibility: Focus solely on correlating frontend and network performance data
 * 
 * @param {OptimizationGap[]} frontendOptimizations - Detected frontend optimization gaps
 * @param {any[]} networkIssues - Detected network performance issues
 * @param {RenderMetrics} renderMetrics - Current render performance metrics
 * @param {NetworkStats | null} networkStats - Network monitoring statistics
 * @param {boolean} isPaused - Whether monitoring is currently paused
 * @returns {object} Cross-domain performance insights and correlations
 */
export function useCrossDomainInsights(
  frontendOptimizations: OptimizationGap[],
  networkIssues: NetworkIssue[],
  renderMetrics: RenderMetrics,
  networkStats: NetworkStats | null,
  isPaused: boolean
) {
  /**
   * Empty network stats fallback for correlation analysis
   * Prevents errors when network stats are unavailable
   */
  const emptyNetworkStatsPlaceholder = useMemo(() => ({
    totalCalls: 0,
    redundantCalls: 0,
    redundancyRate: 0,
    sessionRedundancyRate: 0,
    persistentRedundantCount: 0,
    recentCalls: [],
    redundantPatterns: [],
    callsByType: {},
    persistentIssues: []
  }), []);

  /**
   * Cross-domain performance insights
   * Correlates frontend and network issues for comprehensive analysis
   * Returns empty array when monitoring is paused
   */
  const insights = useMemo(() => 
    isPaused ? [] : PerformanceCorrelationService.generateInsights(
      frontendOptimizations,
      networkIssues,
      renderMetrics,
      networkStats || emptyNetworkStatsPlaceholder
    ), [
      frontendOptimizations, 
      networkIssues, 
      renderMetrics, 
      networkStats, 
      emptyNetworkStatsPlaceholder, 
      isPaused
    ]
  );

  /**
   * Insight categories for better organization
   * Groups insights by their severity level
   */
  const insightCategories = useMemo(() => {
    const categories = {
      critical: insights.filter(insight => insight.severity === 'high'),
      moderate: insights.filter(insight => insight.severity === 'medium'),
      informational: insights.filter(insight => insight.severity === 'low')
    };

    return {
      ...categories,
      total: insights.length
    };
  }, [insights]);

  /**
   * Priority insights for immediate attention
   * Returns the most actionable insights based on severity
   */
  const priorityInsights = useMemo(() => 
    insights
      .filter(insight => insight.severity === 'high')
      .slice(0, 3), // Limit to top 3 for focus
    [insights]
  );

  return {
    // Core Insights
    insights,
    insightCategories,
    priorityInsights,
    
    // Utility
    emptyNetworkStatsPlaceholder
  };
} 