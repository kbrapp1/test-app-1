'use client';

import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../hooks/usePerformanceTracking';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';

interface OptimizationStatusDisplayProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
  missingOptimizations: OptimizationGap[];
}

export const OptimizationStatusDisplay: React.FC<OptimizationStatusDisplayProps> = ({ 
  metrics, 
  trackingState,
  missingOptimizations 
}) => {
  const { renderMetrics, cacheHitRate, webVitals, pageContext } = trackingState;
  
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
            <div className={`w-2 h-2 rounded-full ${metrics.cacheSize > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-gray-600">
              Query caching {metrics.cacheSize > 0 ? `(${metrics.cacheSize} cached)` : '(none)'}
            </span>
          </div>
          
          {/* Cache Hit Rate Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cacheHitRate > 50 ? 'bg-green-500' : cacheHitRate > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
            <span className="text-gray-600">
              Cache efficiency {cacheHitRate > 0 ? `(${cacheHitRate.toFixed(1)}% hits)` : '(no hits)'}
            </span>
          </div>
          
          {/* Render Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${renderMetrics.count <= 10 ? 'bg-green-500' : renderMetrics.count <= 20 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              Render efficiency {renderMetrics.count <= 10 ? '(optimal)' : renderMetrics.count <= 20 ? '(good)' : '(needs optimization)'}
            </span>
          </div>
          
          {/* Mutation Management */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${metrics.activeMutations === 0 ? 'bg-green-500' : metrics.activeMutations <= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              Mutation control {metrics.activeMutations === 0 ? '(idle)' : `(${metrics.activeMutations} active)`}
            </span>
          </div>
          
          {/* Web Vitals Optimization */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              webVitals.LCP && webVitals.LCP <= 2500 && webVitals.CLS && webVitals.CLS <= 0.1 ? 'bg-green-500' :
              Object.keys(webVitals).length > 0 ? 'bg-yellow-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              Web Vitals {
                webVitals.LCP && webVitals.LCP <= 2500 && webVitals.CLS && webVitals.CLS <= 0.1 ? '(excellent)' :
                Object.keys(webVitals).length > 0 ? '(good)' : '(measuring...)'
              }
            </span>
          </div>
          
          {/* Page-Specific Insights */}
          {renderMetrics.lastReset && Date.now() - renderMetrics.lastReset < 3000 && (
            <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
              🔄 Metrics reset for new page
            </div>
          )}
          {pageContext === 'dashboard' && metrics.cacheSize === 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              💡 Dashboard optimized: Static content, minimal queries
            </div>
          )}
          {pageContext === 'image-generator' && metrics.cacheSize > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
              ✅ Active caching: Generation history efficiently cached
            </div>
          )}
          {pageContext === 'dam' && cacheHitRate > 70 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
              ✅ Excellent cache: Asset metadata highly optimized
            </div>
          )}
          {renderMetrics.count > 20 && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
              ⚠️ High renders: Consider memoization optimizations
            </div>
          )}
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
            {missingOptimizations.map((opt, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-xs border-l-2 ${
                  opt.severity === 'high' 
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-orange-50 border-orange-400 text-orange-700'
                }`}
              >
                <div className="font-medium flex items-center gap-1">
                  {opt.severity === 'high' ? '🚨' : '⚠️'} {opt.title}
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
}; 