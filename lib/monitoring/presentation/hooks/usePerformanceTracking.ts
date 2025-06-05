'use client';

import { useState, useEffect, useRef } from 'react';
import { onCLS, onLCP, onFCP, onINP, onTTFB, type Metric } from 'web-vitals';
import { PerformanceMetrics, RenderMetrics, WebVitalsMetrics } from '../../domain/entities/PerformanceMetrics';
import { PageContext } from '../../domain/services/OptimizationDetectionService';

export interface PerformanceTrackingState {
  renderMetrics: RenderMetrics;
  cacheHitRate: number;
  avgResponseTime: number;
  webVitals: WebVitalsMetrics;
  pageContext: PageContext;
}

export function usePerformanceTracking(metrics: PerformanceMetrics) {
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});
  const [currentPath, setCurrentPath] = useState('');
  
  const prevMetricsRef = useRef<PerformanceMetrics | undefined>(undefined);
  const renderCountRef = useRef(0);
  const rapidRenderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const lastResetRef = useRef(Date.now());
  const lastMetricsUpdate = useRef(metrics.lastUpdate);

  // Only count renders that are caused by actual performance changes, not UI interactions
  const now = Date.now();
  const isMetricsUpdate = metrics.lastUpdate !== lastMetricsUpdate.current;
  
  if (isMetricsUpdate) {
    renderCountRef.current += 1;
    
    // Detect rapid re-renders (only for performance-related renders)
    if (now - lastRenderTime.current < 100) {
      rapidRenderCountRef.current += 1;
    }
    lastRenderTime.current = now;
    lastMetricsUpdate.current = metrics.lastUpdate;
  }

  // Detect page context
  const pageContext: PageContext = (() => {
    if (typeof window === 'undefined') return 'other';
    
    const path = window.location.pathname;
    if (path.includes('/image-generator')) return 'image-generator';
    if (path.includes('/dam')) return 'dam';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/team')) return 'team';
    if (path.includes('/settings')) return 'settings';
    return 'other';
  })();

  // Handle page change reset
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const path = window.location.pathname;
    
    if (currentPath && currentPath !== path) {
      setCacheHitRate(0);
      setAvgResponseTime(0);
      renderCountRef.current = 0;
      rapidRenderCountRef.current = 0;
      lastRenderTime.current = Date.now();
      lastResetRef.current = Date.now();
    }
    
    if (currentPath !== path) {
      setCurrentPath(path);
    }
  }, [currentPath]);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWebVital = (metric: Metric) => {
      setWebVitals(prev => ({
        ...prev,
        [metric.name]: metric.value
      }));
    };

    onCLS(handleWebVital);
    onLCP(handleWebVital);
    onFCP(handleWebVital);
    onINP(handleWebVital);
    onTTFB(handleWebVital);
  }, []);

  // Track cache performance
  useEffect(() => {
    if (prevMetricsRef.current) {
      const prev = prevMetricsRef.current;
      const current = metrics;
      
      if (current.cacheSize > prev.cacheSize) {
        setCacheHitRate(prev => Math.min(100, prev + 5));
      }
      
      const timeDiff = new Date(current.lastUpdate).getTime() - new Date(prev.lastUpdate).getTime();
      if (timeDiff > 0) {
        setAvgResponseTime(timeDiff);
      }
    }
    
    prevMetricsRef.current = metrics;
  }, [metrics]);

  const resetCounters = () => {
    setCacheHitRate(0);
    setAvgResponseTime(0);
    setWebVitals({});
    renderCountRef.current = 0;
    rapidRenderCountRef.current = 0;
    lastRenderTime.current = Date.now();
    lastResetRef.current = Date.now();
  };

  const fullReset = () => {
    setCacheHitRate(0); // Start with 0% - no cache activity yet
    setAvgResponseTime(0);
    setWebVitals({}); // Start with empty web vitals - they'll be measured fresh
    renderCountRef.current = 0;
    rapidRenderCountRef.current = 0;
    lastRenderTime.current = Date.now();
    lastResetRef.current = Date.now();
  };

  return {
    state: {
      renderMetrics: {
        count: renderCountRef.current,
        rapidCount: rapidRenderCountRef.current,
        lastReset: lastResetRef.current
      },
      cacheHitRate,
      avgResponseTime,
      webVitals,
      pageContext
    } as PerformanceTrackingState,
    resetCounters,
    fullReset
  };
} 