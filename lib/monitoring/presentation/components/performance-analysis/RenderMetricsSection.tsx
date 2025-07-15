'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

interface RenderMetricsSectionProps {
  trackingState: PerformanceTrackingState;
}

const RenderMetricsSectionComponent: React.FC<RenderMetricsSectionProps> = ({
  trackingState
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700 flex items-center gap-1">
        <Zap className="w-3 h-3" />
        Render Performance
      </h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Renders:</span>
          <span className="font-mono">{trackingState.renderMetrics.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Response:</span>
          <span className="font-mono">{trackingState.avgResponseTime}ms</span>
        </div>
      </div>
    </div>
  );
};

RenderMetricsSectionComponent.displayName = 'RenderMetricsSectionComponent';

export const RenderMetricsSection = React.memo(RenderMetricsSectionComponent);
RenderMetricsSection.displayName = 'RenderMetricsSection';