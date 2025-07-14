'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { onCLS, onLCP, onFCP, onINP, onTTFB, type Metric } from 'web-vitals';
import type { InputPerformanceMetrics, WebVitalsMetrics, PageContext, PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

export function usePerformanceTracking(metrics: InputPerformanceMetrics) {
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});
  const [currentPath, setCurrentPath] = useState('');
  
  const prevMetricsRef = useRef<InputPerformanceMetrics | undefined>(undefined);
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

  // Detect page context with memoization
  const pageContext: PageContext = useMemo(() => {
    if (typeof window === 'undefined') return 'other';
    
    const path = window.location.pathname;
    if (path.includes('/image-generator')) return 'image-generator';
    if (path.includes('/dam')) return 'dam';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/team')) return 'team';
    if (path.includes('/settings')) return 'settings';
    return 'other';
  }, []);

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

  // Throttle Web Vitals handler to prevent rapid updates
  const lastVitalTimeRef = useRef<number>(0);
  const handleWebVital = useCallback((metric: Metric) => {
    const now = Date.now();
    // Only update if at least 200ms have passed since last update
    if (now - lastVitalTimeRef.current > 200) {
      setWebVitals(prev => ({ ...prev, [metric.name]: metric.value }));
      lastVitalTimeRef.current = now;
    }
  }, []);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    onCLS(handleWebVital);
    onLCP(handleWebVital);
    onFCP(handleWebVital);
    onINP(handleWebVital);
    onTTFB(handleWebVital);
  }, [handleWebVital]);

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

  // Memoize reset functions
  const resetCounters = useCallback(() => {
    setCacheHitRate(0);
    setAvgResponseTime(0);
    setWebVitals({});
    renderCountRef.current = 0;
    rapidRenderCountRef.current = 0;
    lastRenderTime.current = Date.now();
    lastResetRef.current = Date.now();
  }, []);

  const fullReset = useCallback(() => {
    setCacheHitRate(0); // Start with 0% - no cache activity yet
    setAvgResponseTime(0);
    setWebVitals({}); // Start with empty web vitals - they'll be measured fresh
    renderCountRef.current = 0;
    rapidRenderCountRef.current = 0;
    lastRenderTime.current = Date.now();
    lastResetRef.current = Date.now();
  }, []);

  // Memoize the tracking state
  const trackingState = useMemo((): PerformanceTrackingState => ({
    renderMetrics: {
      count: renderCountRef.current,
      rapidCount: rapidRenderCountRef.current,
      lastReset: lastResetRef.current
    },
    cacheHitRate,
    avgResponseTime,
    webVitals,
    pageContext
  }), [cacheHitRate, avgResponseTime, webVitals, pageContext]);

  return {
    state: trackingState,
    resetCounters,
    fullReset
  };
} 