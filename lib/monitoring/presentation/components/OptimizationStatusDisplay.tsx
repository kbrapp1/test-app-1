'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';

interface OptimizationStatusDisplayProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
  missingOptimizations: OptimizationGap[];
}

export const OptimizationStatusDisplay = React.memo<OptimizationStatusDisplayProps>(({ 
  metrics, 
  trackingState,
  missingOptimizations 
}) => {
  const { renderMetrics, cacheHitRate, webVitals, pageContext } = trackingState;
  
  // Memoize expensive status calculations
  const optimizationStatuses = useMemo(() => {
    return {
      queryCache: {
        indicator: metrics.cacheSize > 0 ? 'bg-green-500' : 'bg-gray-300',
        text: `Query caching ${metrics.cacheSize > 0 ? `(${metrics.cacheSize} cached)` : '(none)'}`
      },
      cacheHitRate: {
        indicator: cacheHitRate > 50 ? 'bg-green-500' : cacheHitRate > 0 ? 'bg-yellow-500' : 'bg-gray-300',
        text: `Cache efficiency ${cacheHitRate > 0 ? `(${cacheHitRate.toFixed(1)}% hits)` : '(no hits)'}`
      },
      renderOptimization: {
        indicator: renderMetrics.count <= 10 ? 'bg-green-500' : renderMetrics.count <= 20 ? 'bg-yellow-500' : 'bg-red-500',
        text: `Render efficiency ${renderMetrics.count <= 10 ? '(optimal)' : renderMetrics.count <= 20 ? '(good)' : '(needs optimization)'}`
      },
      mutationControl: {
        indicator: metrics.activeMutations === 0 ? 'bg-green-500' : metrics.activeMutations <= 2 ? 'bg-yellow-500' : 'bg-red-500',
        text: `Mutation control ${metrics.activeMutations === 0 ? '(idle)' : `(${metrics.activeMutations} active)`}`
      },
      webVitals: {
        indicator: webVitals.LCP && webVitals.LCP <= 2500 && webVitals.CLS && webVitals.CLS <= 0.1 ? 'bg-green-500' :
          Object.keys(webVitals).length > 0 ? 'bg-yellow-500' : 'bg-gray-300',
        text: `Web Vitals ${
          webVitals.LCP && webVitals.LCP <= 2500 && webVitals.CLS && webVitals.CLS <= 0.1 ? '(excellent)' :
          Object.keys(webVitals).length > 0 ? '(good)' : '(measuring...)'
        }`
      }
    };
  }, [metrics.cacheSize, metrics.activeMutations, cacheHitRate, renderMetrics.count, webVitals]);

  // Memoize page-specific insights
  const pageInsights = useMemo(() => {
    const insights = [];
    
    if (renderMetrics.lastReset && Date.now() - renderMetrics.lastReset < 3000) {
      insights.push({
        type: 'reset',
        message: '🔄 Metrics reset for new page',
        className: 'mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700'
      });
    }
    
    if (pageContext === 'dashboard' && metrics.cacheSize === 0) {
      insights.push({
        type: 'dashboard',
        message: '💡 Dashboard optimized: Static content, minimal queries',
        className: 'mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700'
      });
    }
    
    if (pageContext === 'image-generator' && metrics.cacheSize > 0) {
      insights.push({
        type: 'image-generator',
        message: '✅ Active caching: Generation history efficiently cached',
        className: 'mt-2 p-2 bg-green-50 rounded text-xs text-green-700'
      });
    }
    
    if (pageContext === 'dam' && cacheHitRate > 70) {
      insights.push({
        type: 'dam',
        message: '✅ Excellent cache: Asset metadata highly optimized',
        className: 'mt-2 p-2 bg-green-50 rounded text-xs text-green-700'
      });
    }
    
    if (renderMetrics.count > 20) {
      insights.push({
        type: 'renders',
        message: '⚠️ High renders: Consider memoization optimizations',
        className: 'mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700'
      });
    }
    
    return insights;
  }, [renderMetrics.lastReset, renderMetrics.count, pageContext, metrics.cacheSize, cacheHitRate]);

  // Memoize missing optimizations display data
  const optimizationsDisplay = useMemo(() => {
    return missingOptimizations.map((opt, index) => ({
      key: index,
      optimization: opt,
      className: `p-2 rounded text-xs border-l-2 ${
        opt.severity === 'high' 
          ? 'bg-red-50 border-red-400 text-red-700'
          : 'bg-orange-50 border-orange-400 text-orange-700'
      }`,
      icon: opt.severity === 'high' ? '🚨' : '⚠️'
    }));
  }, [missingOptimizations]);
  
  return (
    <div className="space-y-4 text-xs">
      {/* Dynamic Optimization Status */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Page Optimizations
          <span className="text-xs text-gray-500 ml-1">({pageContext})</span>
        </h4>
        <div className="space-y-1">
          {/* React Query Cache Optimizations */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${optimizationStatuses.queryCache.indicator}`}></div>
            <span className="text-gray-600">{optimizationStatuses.queryCache.text}</span>
          </div>
          
          {/* Cache Hit Rate Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${optimizationStatuses.cacheHitRate.indicator}`}></div>
            <span className="text-gray-600">{optimizationStatuses.cacheHitRate.text}</span>
          </div>
          
          {/* Render Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${optimizationStatuses.renderOptimization.indicator}`}></div>
            <span className="text-gray-600">{optimizationStatuses.renderOptimization.text}</span>
          </div>
          
          {/* Mutation Management */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${optimizationStatuses.mutationControl.indicator}`}></div>
            <span className="text-gray-600">{optimizationStatuses.mutationControl.text}</span>
          </div>
          
          {/* Web Vitals Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${optimizationStatuses.webVitals.indicator}`}></div>
            <span className="text-gray-600">{optimizationStatuses.webVitals.text}</span>
          </div>
          
          {/* Page-Specific Insights */}
          {pageInsights.map((insight) => (
            <div key={insight.type} className={insight.className}>
              {insight.message}
            </div>
          ))}
        </div>
      </div>

      {/* Missing Optimizations Detection */}
      {missingOptimizations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Missing Optimizations
            <Badge variant="destructive" className="text-xs ml-1">
              {missingOptimizations.length}
            </Badge>
          </h4>
          <div className="space-y-1">
            {optimizationsDisplay.map(({ key, optimization: opt, className, icon }) => (
              <div key={key} className={className}>
                <div className="font-medium flex items-center gap-1">
                  {icon} {opt.title}
                  {opt.persistent && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded ml-1" title="Persists after reset">
                      ARCH
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-90">
                  {opt.description}
                  {!opt.persistent && (
                    <span className="text-xs opacity-75 ml-1">(resets with metrics)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

OptimizationStatusDisplay.displayName = 'OptimizationStatusDisplay'; 