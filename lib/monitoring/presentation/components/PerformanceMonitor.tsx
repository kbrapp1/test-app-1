'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { withMonitoringErrorBoundary } from './error/MonitoringErrorBoundary';

import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { usePerformanceDashboard } from '../hooks/usePerformanceDashboard';
import { PerformanceDashboardHeader } from './PerformanceDashboardHeader';
import { PerformanceIssueSummary } from './PerformanceIssueSummary';
import { PerformanceQuickStats } from './PerformanceQuickStats';
import { PerformanceExpandableSection } from './PerformanceExpandableSection';
import { PerformanceMetricsDisplay } from './PerformanceMetricsDisplay';
import { NetworkDetailsContent } from './NetworkDetailsContent';
import { PerformanceDashboardActions } from './PerformanceDashboardActions';
import { PerformanceCompactView } from './PerformanceCompactView';
import { ComponentProfilerService } from '../../infrastructure/services/ComponentProfilerService';

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

  // Memoize expensive calculations
  const lastUpdateTime = useMemo(() => {
    return new Date(metrics.lastUpdate).getTime();
  }, [metrics.lastUpdate]);

  const cardClassName = useMemo(() => {
    return `fixed bottom-20 right-4 z-50 ${className}`;
  }, [className]);

  const cardContentMaxHeight = useMemo(() => {
    return 'calc(85vh - 120px)';
  }, []);

  // Initialize enhanced monitoring when component mounts
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isOpen) {
      // Initialize component profiler when monitoring starts
      try {
        ComponentProfilerService.enable();
      } catch (error) {
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
      } catch (error) {
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

          <PerformanceDashboardActions
            onReset={dashboard.resetCounters}
            onFullReset={dashboard.handleFullResetClick}
            showFullResetConfirm={dashboard.showFullResetConfirm}
            lastUpdateTime={lastUpdateTime}
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
    onError: (error, errorInfo) => {
      // Additional error handling for performance monitoring
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PerformanceMonitor] Error in performance monitoring:', error.message);
      }
    }
  }
); 