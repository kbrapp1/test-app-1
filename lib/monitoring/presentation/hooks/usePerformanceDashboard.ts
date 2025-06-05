'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceCalculationService } from '../../domain/services/PerformanceCalculationService';
import { OptimizationDetectionService } from '../../domain/services/OptimizationDetectionService';
import { PerformanceCorrelationService } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { usePerformanceTracking } from './usePerformanceTracking';
import { useNetworkMonitoring } from './useNetworkMonitoring';

interface ExpandableSections {
  frontend: boolean;
  network: boolean;
}

export function usePerformanceDashboard(metrics: PerformanceMetrics) {
  // State management

  const [expandedSections, setExpandedSections] = useState<ExpandableSections>({
    frontend: false,
    network: false
  });

  const [showFullResetConfirm, setShowFullResetConfirm] = useState(false);
  const fullResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Performance tracking hooks
  const { state: trackingState, resetCounters, fullReset } = usePerformanceTracking(metrics);
  const { networkStats, clearNetworkData, justReset, isPaused } = useNetworkMonitoring();

  // Memoized calculations
  const frontendScore = useMemo(() => PerformanceCalculationService.calculateScore(
    metrics,
    trackingState.renderMetrics,
    trackingState.avgResponseTime,
    trackingState.webVitals
  ), [metrics, trackingState.renderMetrics, trackingState.avgResponseTime, trackingState.webVitals]);

  const networkScore = useMemo(() => {
    if (!networkStats || networkStats.totalCalls === 0) return 100;
    return Math.round(100 - networkStats.redundancyRate);
  }, [networkStats]);

  const overallScore = useMemo(() => Math.round((frontendScore.getValue() + networkScore) / 2), [frontendScore, networkScore]);
  const scoreColor = useMemo((): 'green' | 'yellow' | 'red' => overallScore >= 90 ? 'green' : overallScore >= 70 ? 'yellow' : 'red', [overallScore]);

  // Issue detection
  const frontendOptimizations = useMemo(() => isPaused ? [] : OptimizationDetectionService.detectMissingOptimizations(
    metrics,
    trackingState.renderMetrics,
    trackingState.cacheHitRate,
    trackingState.webVitals,
    trackingState.pageContext
  ), [metrics, trackingState.renderMetrics, trackingState.cacheHitRate, trackingState.webVitals, trackingState.pageContext, isPaused]);

  const networkIssues = useMemo(() => {
    if (isPaused) return [];
    return networkStats?.persistentIssues || [];
  }, [networkStats?.persistentIssues, isPaused]);

  const emptyNetworkStats = useMemo(() => ({
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

  const crossDomainInsights = useMemo(() => isPaused ? [] : PerformanceCorrelationService.generateInsights(
    frontendOptimizations,
    networkIssues,
    trackingState.renderMetrics,
    networkStats || emptyNetworkStats
  ), [frontendOptimizations, networkIssues, trackingState.renderMetrics, networkStats, emptyNetworkStats, isPaused]);

  // Event handlers

  const handleFullResetClick = useCallback(() => {
    if (showFullResetConfirm) {
      fullReset();
      clearNetworkData();
      setShowFullResetConfirm(false);
    } else {
      setShowFullResetConfirm(true);
      fullResetTimeoutRef.current = setTimeout(() => {
        setShowFullResetConfirm(false);
      }, 3000);
    }
  }, [showFullResetConfirm, fullReset, clearNetworkData]);

  const toggleSection = useCallback((section: keyof ExpandableSections) => {
    // Use React.startTransition to mark this as a low-priority update
    // This helps differentiate UI interactions from performance-critical renders
    React.startTransition(() => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    });
  }, []);

  return {
    // State
    expandedSections,
    showFullResetConfirm,
    
    // Performance data
    trackingState,
    networkStats,
    frontendScore,
    networkScore,
    overallScore,
    scoreColor,
    isPaused,
    
    // Issues
    frontendOptimizations,
    networkIssues,
    crossDomainInsights,
    
    // Actions
    handleFullResetClick,
    toggleSection,
    resetCounters,
    
    // Cleanup
    fullResetTimeoutRef
  };
} 