'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { withMonitoringErrorBoundary } from '../error/MonitoringErrorBoundary';

import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { GlobalBundleStats } from '../../../application/services/BundleMonitoringService';
import { usePerformanceDashboard } from '../../hooks/performance-analysis/usePerformanceDashboard';
import { PerformanceDashboardHeader } from '../performance-analysis/PerformanceDashboardHeader';
import { PerformanceIssueSummary } from '../business-impact/PerformanceIssueSummary';
import { PerformanceQuickStats } from '../performance-analysis/PerformanceQuickStats';
import { PerformanceExpandableSection } from '../performance-analysis/PerformanceExpandableSection';
import { PerformanceMetricsDisplay } from '../performance-analysis/PerformanceMetricsDisplay';
import { NetworkDetailsContent } from '../network-analysis/NetworkDetailsContent';
import { BundleDetailsContent } from '../bundle-analysis/BundleDetailsContent';
import { PerformanceDashboardActions } from '../performance-analysis/PerformanceDashboardActions';
import { PerformanceCompactView } from '../performance-analysis/PerformanceCompactView';
import { ComponentProfilerService } from '../../../infrastructure/services/ComponentProfilerService';

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  className?: string;
  isOpen: boolean;
  autoRefresh: boolean;
}

const PerformanceMonitorComponent = ({ 
  metrics, 
  className = '',
  isOpen,
  autoRefresh
}: PerformanceMonitorProps) => {
  const dashboard = usePerformanceDashboard(metrics);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('perfMonitorCompact');
      return stored === 'true';
    }
    return true; // Default to compact mode
  });

  // Bundle monitoring state
  const [bundleStats, setBundleStats] = useState<GlobalBundleStats | null>(null);
  const [bundleScore, setBundleScore] = useState(100);

  // Initialize bundle monitoring
  useEffect(() => {
    let bundleInterval: NodeJS.Timeout | null = null;

    if (isOpen && !dashboard.isPaused) {
      const updateBundleStats = async () => {
        try {
          const { BundleMonitoringService } = await import('../../../application/services/BundleMonitoringService');
          const bundleMonitoring = new BundleMonitoringService();
          const stats = bundleMonitoring.getGlobalBundleStats();
          setBundleStats(stats);
          setBundleScore(stats.averagePerformanceScore);
        } catch {
          // Bundle monitoring is optional - fail silently
        }
      };

      updateBundleStats();
      bundleInterval = setInterval(updateBundleStats, 5000);
    }

    return () => {
      if (bundleInterval) clearInterval(bundleInterval);
    };
  }, [isOpen, dashboard.isPaused]);

  // Memoize expensive calculations
  const cardClassName = useMemo(() => {
    return `fixed bottom-20 right-4 z-50 ${className}`;
  }, [className]);

  // Initialize enhanced monitoring when component mounts
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isOpen) {
      // Initialize component profiler when monitoring starts
      try {
        ComponentProfilerService.enable();
      } catch {
        // ComponentProfilerService not available, continue without it
      }
      
      // Start auto-refresh
      if (autoRefresh) {
        intervalId = setInterval(() => {
          if (!dashboard.isPaused) {
            // Dashboard auto-refreshes via its own hook
          }
        }, 3000);
      }
    } else {
      // Disable component profiler when monitoring stops
      try {
        ComponentProfilerService.disable();
      } catch {
        // ComponentProfilerService not available, ignore
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, autoRefresh, dashboard.isPaused]);

  const handleExpandFromCompact = useCallback(() => {
    setIsCompactMode(false);
    localStorage.setItem('perfMonitorCompact', 'false');
  }, []);

  const handleCollapseToCompact = useCallback(() => {
    setIsCompactMode(true);
    localStorage.setItem('perfMonitorCompact', 'true');
  }, []);

  const handleToggleFrontendSection = useCallback(() => {
    dashboard.toggleSection('frontend');
  }, [dashboard]);

  const handleToggleNetworkSection = useCallback(() => {
    dashboard.toggleSection('network');
  }, [dashboard]);

  // Show compact view when in compact mode
  if (isCompactMode) {
    return (
      <PerformanceCompactView
        overallScore={dashboard.overallScore}
        frontendIssues={dashboard.frontendOptimizations}
        networkIssues={dashboard.networkIssues}
        onExpand={handleExpandFromCompact}
      />
    );
  }

  return (
    <div className={cardClassName}>
      <Card className="w-[460px] max-h-[85vh] shadow-xl backdrop-blur-sm bg-white/95 border border-gray-200 flex flex-col">
        <PerformanceDashboardHeader
          overallScore={dashboard.overallScore}
          scoreColor={dashboard.scoreColor}
          onCollapse={handleCollapseToCompact}
        />
        
        {/* Page Context Display */}
        {dashboard.trackingState.pageContext && (
          <div className="px-6 pb-2 flex-shrink-0">
            <div className="flex items-center justify-start">
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                📍 {dashboard.trackingState.pageContext}
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="space-y-4 text-xs overflow-y-auto pb-4 flex-1 min-h-0">
          <PerformanceIssueSummary 
            frontendIssues={dashboard.frontendOptimizations}
            networkIssues={dashboard.networkIssues}
            crossDomainInsights={dashboard.crossDomainInsights}
            metrics={metrics}
            trackingState={dashboard.trackingState}
          />

          <PerformanceQuickStats 
            frontendState={dashboard.trackingState}
            networkStats={dashboard.networkStats}
            isPaused={dashboard.isPaused}
          />

          <PerformanceExpandableSection
            title="Frontend Details"
            icon="⚡"
            score={dashboard.frontendScore.getValue()}
            isExpanded={dashboard.expandedSections.frontend}
            onToggle={handleToggleFrontendSection}
          >
            <PerformanceMetricsDisplay 
              metrics={metrics} 
              trackingState={dashboard.trackingState}
              frontendOptimizations={dashboard.frontendOptimizations}
            />
          </PerformanceExpandableSection>

          <PerformanceExpandableSection
            title="Network Details"
            icon="🌐"
            score={dashboard.networkScore}
            isExpanded={dashboard.expandedSections.network}
            onToggle={handleToggleNetworkSection}
          >
            <NetworkDetailsContent 
              networkStats={dashboard.networkStats}
              networkScore={dashboard.networkScore}
              isPaused={dashboard.isPaused}
            />
          </PerformanceExpandableSection>

          <PerformanceExpandableSection
            title="Bundle Details"
            icon="📦"
            score={bundleScore}
            isExpanded={dashboard.expandedSections.bundle}
            onToggle={() => dashboard.toggleSection('bundle')}
          >
            <BundleDetailsContent 
              bundleStats={bundleStats}
              bundleScore={bundleScore}
              isPaused={dashboard.isPaused}
            />
          </PerformanceExpandableSection>

          <PerformanceDashboardActions
            onReset={dashboard.resetCounters}
            onFullReset={dashboard.handleFullResetClick}
            showFullResetConfirm={dashboard.showFullResetConfirm}
            lastUpdateTime={Date.now()}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Set displayName for debugging
PerformanceMonitorComponent.displayName = 'PerformanceMonitorComponent';

// Wrap with error boundary for enhanced error handling
export const PerformanceMonitor = withMonitoringErrorBoundary(
  React.memo(PerformanceMonitorComponent),
  {
    componentName: 'PerformanceMonitor',
    retryable: true,
    onError: (error, _errorInfo) => {
      // Additional error handling for performance monitoring
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PerformanceMonitor] Error in performance monitoring:', error.message);
      }
    }
  }
); 