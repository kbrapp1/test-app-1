'use client';

import React, { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { WebVitalsMetrics } from '../../../domain/entities/PerformanceMetrics';
import { WebVitalsAnalysisService } from '../../../domain/services/performance-analysis/WebVitalsAnalysisService';

interface WebVitalsSectionProps {
  webVitals: WebVitalsMetrics;
}

export const WebVitalsSection: React.FC<WebVitalsSectionProps> = React.memo(({
  webVitals
}) => {
  // Memoize expensive web vitals calculations
  const processedMetrics = useMemo(() => 
    Object.entries(webVitals).map(([metric, value]) => {
      const typedMetric = metric as keyof WebVitalsMetrics;
      const numericValue = typeof value === 'number' ? value : 0;
      const rating = WebVitalsAnalysisService.getWebVitalRating(typedMetric, numericValue);
      const ratingColor = WebVitalsAnalysisService.getRatingColor(rating);
      const displayValue = WebVitalsAnalysisService.formatWebVitalValue(typedMetric, numericValue);
      
      return {
        metric,
        value,
        rating,
        ratingColor,
        displayValue
      };
    }),
    [webVitals]
  );

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700 flex items-center gap-1">
        <Gauge className="w-3 h-3" />
        Web Vitals
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {processedMetrics.map(({ metric, ratingColor, displayValue }) => (
          <div key={metric} className="flex justify-between">
            <span className="text-gray-600">{metric}:</span>
            <span className={`font-mono ${ratingColor}`}>
              {displayValue}
            </span>
          </div>
        ))}
        {processedMetrics.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 text-xs">
            Collecting metrics...
          </div>
        )}
      </div>
    </div>
  );
}); 