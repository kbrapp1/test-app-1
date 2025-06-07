'use client';

import React, { useEffect } from 'react';
import { withMonitoringErrorBoundary } from './error/MonitoringErrorBoundary';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { OptimizationStatusDisplay } from './OptimizationStatusDisplay';
import { PerformanceReportHeader } from './PerformanceReportHeader';
import { CacheMetricsSection } from './CacheMetricsSection';
import { RenderMetricsSection } from './RenderMetricsSection';
import { WebVitalsSection } from './WebVitalsSection';
import { PerformanceDetectionInitializer } from '../../infrastructure/services/PerformanceDetectionInitializer';

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
  frontendOptimizations?: OptimizationGap[];
}

const PerformanceMetricsDisplayComponent = React.memo<PerformanceMetricsDisplayProps>(({ 
  metrics, 
  trackingState,
  frontendOptimizations = []
}) => {
  // Initialize automatic detection systems
  useEffect(() => {
    PerformanceDetectionInitializer.initialize();
  }, []);

  return (
    <div className="space-y-4 text-xs pt-3">
      <PerformanceReportHeader 
        metrics={metrics}
        trackingState={trackingState}
        frontendOptimizations={frontendOptimizations}
      />

      <OptimizationStatusDisplay
        metrics={metrics}
        trackingState={trackingState}
        missingOptimizations={frontendOptimizations}
      />

      <CacheMetricsSection 
        metrics={metrics}
        trackingState={trackingState}
      />

      <RenderMetricsSection 
        trackingState={trackingState}
      />

      <WebVitalsSection 
        webVitals={trackingState.webVitals}
      />
    </div>
  );
});

// Set displayName for debugging
PerformanceMetricsDisplayComponent.displayName = 'PerformanceMetricsDisplayComponent';

// Wrap with error boundary for enhanced error handling
export const PerformanceMetricsDisplay = withMonitoringErrorBoundary(
  PerformanceMetricsDisplayComponent,
  {
    componentName: 'PerformanceMetricsDisplay',
    retryable: true,
    onError: (error, errorInfo) => {
      // Additional error handling for performance metrics display
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PerformanceMetricsDisplay] Error in performance metrics display:', error.message);
      }
    }
  }
); 