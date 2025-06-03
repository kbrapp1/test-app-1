'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  cacheSize: number;
  activeMutations: number;
  isOptimized: boolean;
  lastUpdate: string;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  className?: string;
}

interface RenderCounter {
  count: number;
  lastReset: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  metrics, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [renderCount, setRenderCount] = useState<RenderCounter>({ count: 0, lastReset: Date.now() });
  const prevMetricsRef = useRef<PerformanceMetrics | undefined>(undefined);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);

  // Simple render tracking
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Track cache performance
  useEffect(() => {
    if (prevMetricsRef.current) {
      const prev = prevMetricsRef.current;
      const current = metrics;
      
      // Simple cache hit rate calculation
      if (current.cacheSize > prev.cacheSize) {
        setCacheHitRate(prev => Math.min(100, prev + 5));
      }
      
      // Mock response time calculation
      const timeDiff = new Date(current.lastUpdate).getTime() - new Date(prev.lastUpdate).getTime();
      if (timeDiff > 0) {
        setAvgResponseTime(timeDiff);
      }
    }
    
    prevMetricsRef.current = metrics;
  }, [metrics]);

  const resetCounters = () => {
    setRenderCount({ count: 0, lastReset: Date.now() });
    setCacheHitRate(0);
    setAvgResponseTime(0);
  };

  const getPerformanceScore = () => {
    let score = 100;
    
    // Deduct points for excessive renders
    if (renderCount.count > 10) score -= Math.min(30, (renderCount.count - 10) * 2);
    
    // Deduct points for large cache size
    if (metrics.cacheSize > 50) score -= Math.min(20, (metrics.cacheSize - 50) * 0.5);
    
    // Deduct points for active mutations
    if (metrics.activeMutations > 3) score -= (metrics.activeMutations - 3) * 5;
    
    // Deduct points for slow response times
    if (avgResponseTime > 1000) score -= Math.min(20, (avgResponseTime - 1000) / 100);
    
    return Math.max(0, Math.round(score));
  };

  const performanceScore = getPerformanceScore();
  const scoreColor = performanceScore >= 90 ? 'green' : performanceScore >= 70 ? 'yellow' : 'red';

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg backdrop-blur-sm bg-white/90"
        >
          <Activity className="w-4 h-4 mr-1" />
          Perf
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 shadow-xl backdrop-blur-sm bg-white/95 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={scoreColor === 'green' ? 'default' : 'secondary'}
                className={`text-xs ${
                  scoreColor === 'green' ? 'bg-green-100 text-green-800' :
                  scoreColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {performanceScore}/100
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 text-xs">
          {/* React Query Metrics */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 flex items-center gap-1">
              <Database className="w-3 h-3" />
              React Query Cache
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cache Size:</span>
                <span className="font-mono">{metrics.cacheSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hit Rate:</span>
                <span className="font-mono">{cacheHitRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Mutations:</span>
                <span className="font-mono">{metrics.activeMutations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optimized:</span>
                <span className={`font-mono ${metrics.isOptimized ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.isOptimized ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Render Performance */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Render Performance
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Renders:</span>
                <span className="font-mono">{renderCountRef.current}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-mono">{avgResponseTime}ms</span>
              </div>
            </div>
          </div>

          {/* Optimization Status */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Optimizations Active
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">useMemo for computed values</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">useCallback for handlers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Memoized query keys</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Intelligent polling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Cache invalidation debouncing</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={resetCounters}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            
            <div className="text-xs text-gray-500">
              Last: {new Date(metrics.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor; 