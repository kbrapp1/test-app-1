'use client';

import { useCallback } from 'react';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { usePerformanceTracking } from './usePerformanceTracking';
import { useNetworkMonitoring } from './useNetworkMonitoring';
import { usePerformanceDashboardUI } from './usePerformanceDashboardUI';
import { usePerformanceScores } from './usePerformanceScores';
import { usePerformanceIssueDetection } from './usePerformanceIssueDetection';
import { useCrossDomainInsights } from './useCrossDomainInsights';

/**
 * Performance Dashboard Hook (Presentation Layer)
 * 
 * Responsibility: Orchestrate specialized performance monitoring hooks
 * Bounded Context: Performance Monitoring Dashboard
 * 
 * Single Responsibility: Focus solely on coordinating specialized hooks
 * Following DDD principles with clear separation of concerns
 * 
 * Key Features:
 * - Orchestrates UI state management via usePerformanceDashboardUI
 * - Delegates score calculations to usePerformanceScores
 * - Handles issue detection through usePerformanceIssueDetection
 * - Manages cross-domain insights via useCrossDomainInsights
 * - Maintains backward compatibility with existing components
 * 
 * @param {PerformanceMetrics} performanceMetrics - Core performance metrics from domain layer
 * @returns {object} Comprehensive dashboard state and operations
 * 
 * @example
 * ```typescript
 * function PerformanceMonitor({ metrics }: { metrics: PerformanceMetrics }) {
 *   const dashboard = usePerformanceDashboard(metrics);
 *   
 *   return (
 *     <div>
 *       <h2>Overall Score: {dashboard.overallScore}</h2>
 *       <button onClick={() => dashboard.toggleSection('frontend')}>
 *         Toggle Frontend Details
 *       </button>
 *       {dashboard.frontendOptimizations.map(optimization => (
 *         <div key={optimization.type}>{optimization.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @since 2.0.0 - Refactored following DDD principles
 */
export function usePerformanceDashboard(performanceMetrics: PerformanceMetrics) {
  
  // Core Performance Tracking Integration
  const { 
    state: performanceTrackingState, 
    resetCounters: resetPerformanceCounters, 
    fullReset: performFullReset 
  } = usePerformanceTracking(performanceMetrics);
  
  const { 
    networkStats: networkMonitoringStats, 
    clearNetworkData: clearAllNetworkData, 
    justReset: networkJustReset, 
    isPaused: isMonitoringPaused 
  } = useNetworkMonitoring();

  // Specialized Hook Delegation
  const uiState = usePerformanceDashboardUI();
  
  const scores = usePerformanceScores(
    performanceMetrics,
    performanceTrackingState,
    networkMonitoringStats
  );
  
  const issues = usePerformanceIssueDetection(
    performanceMetrics,
    performanceTrackingState,
    networkMonitoringStats,
    isMonitoringPaused
  );
  
  const insights = useCrossDomainInsights(
    issues.frontendOptimizations,
    issues.networkIssues,
    performanceTrackingState.renderMetrics,
    scores.filteredNetworkStats,
    isMonitoringPaused
  );

  // Orchestrated Reset Handler
  const handleFullDashboardReset = useCallback(() => {
    uiState.handleResetConfirmation(() => {
      performFullReset();
      clearAllNetworkData();
    });
  }, [uiState.handleResetConfirmation, performFullReset, clearAllNetworkData]);

  // Unified Dashboard Interface (Backward Compatibility)
  return {
    // UI State Management (from usePerformanceDashboardUI)
    expandedSections: uiState.expandedSections,
    showFullResetConfirm: uiState.showFullResetConfirm,
    
    // Performance Tracking Data
    trackingState: performanceTrackingState,
    networkStats: scores.filteredNetworkStats,
    frontendScore: scores.frontendScore,
    networkScore: scores.networkScore,
    overallScore: scores.overallScore,
    scoreColor: scores.scoreColor,
    isPaused: isMonitoringPaused,
    
    // Detected Performance Issues (from usePerformanceIssueDetection)
    frontendOptimizations: issues.frontendOptimizations,
    networkIssues: issues.networkIssues,
    crossDomainInsights: insights.insights,
    
    // User Actions
    handleFullResetClick: handleFullDashboardReset,
    toggleSection: uiState.toggleSection,
    resetCounters: resetPerformanceCounters,
    
    // Cleanup References (backward compatibility)
    fullResetTimeoutRef: uiState.fullResetTimeoutRef
  };
} 