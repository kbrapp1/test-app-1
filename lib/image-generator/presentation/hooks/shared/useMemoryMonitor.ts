'use client';

import { useEffect, useRef, useCallback } from 'react';
import React from 'react';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
  usage: number; // Percentage
}

interface MemoryMonitorOptions {
  enabled?: boolean;
  interval?: number; // Monitoring interval in ms
  maxSamples?: number; // Maximum memory samples to keep
  warningThreshold?: number; // Warning threshold in MB
  criticalThreshold?: number; // Critical threshold in MB
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
}

/**
 * Memory Monitor Hook
 * Tracks memory usage patterns and detects potential memory leaks
 * Only active in development mode
 */
export const useMemoryMonitor = (options: MemoryMonitorOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    interval = 10000, // Check every 10 seconds
    maxSamples = 50,
    warningThreshold = 100, // 100MB
    criticalThreshold = 200, // 200MB
    onWarning,
    onCritical
  } = options;

  const samplesRef = useRef<MemoryStats[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastWarningRef = useRef<number>(0);
  const lastCriticalRef = useRef<number>(0);

  // Check if Performance Memory API is available
  const isMemoryAPIAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           'performance' in window && 
           'memory' in performance &&
           performance.memory !== undefined;
  }, []);

  // Get current memory stats
  const getCurrentMemoryStats = useCallback((): MemoryStats | null => {
    if (!isMemoryAPIAvailable()) return null;

    const memory = (performance as any).memory;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 * 100) / 100
    };
  }, [isMemoryAPIAvailable]);

  // Check for memory growth patterns
  const analyzeMemoryTrend = useCallback((samples: MemoryStats[]) => {
    if (samples.length < 5) return null;

    const recent = samples.slice(-5);
    const growth = recent[recent.length - 1].usedMB - recent[0].usedMB;
    const trend = growth > 10 ? 'increasing' : growth < -10 ? 'decreasing' : 'stable';
    
    return {
      trend,
      growthMB: Math.round(growth * 100) / 100,
      avgUsageMB: Math.round(recent.reduce((sum, s) => sum + s.usedMB, 0) / recent.length * 100) / 100,
      peakUsageMB: Math.max(...recent.map(s => s.usedMB)),
      samples: recent.length
    };
  }, []);

  // Monitor memory usage
  const monitorMemory = useCallback(() => {
    const stats = getCurrentMemoryStats();
    if (!stats) return;

    // Add to samples
    samplesRef.current.push(stats);
    
    // Keep only recent samples
    if (samplesRef.current.length > maxSamples) {
      samplesRef.current = samplesRef.current.slice(-maxSamples);
    }

    // Check thresholds (throttle warnings to avoid spam)
    const now = Date.now();
    
    if (stats.usedMB > criticalThreshold && now - lastCriticalRef.current > 30000) {
      lastCriticalRef.current = now;
      onCritical?.(stats);
      console.warn('🚨 Critical memory usage detected:', {
        used: `${stats.usedMB}MB`,
        percentage: `${stats.usage}%`,
        threshold: `${criticalThreshold}MB`
      });
    } else if (stats.usedMB > warningThreshold && now - lastWarningRef.current > 60000) {
      lastWarningRef.current = now;
      onWarning?.(stats);
      console.warn('⚠️ High memory usage detected:', {
        used: `${stats.usedMB}MB`,
        percentage: `${stats.usage}%`,
        threshold: `${warningThreshold}MB`
      });
    }

    // Log trends in development
    if (process.env.NODE_ENV === 'development' && samplesRef.current.length % 5 === 0) {
      const trend = analyzeMemoryTrend(samplesRef.current);
      if (trend) {
        console.info('📊 Memory trend analysis:', trend);
      }
    }
  }, [
    getCurrentMemoryStats,
    maxSamples,
    warningThreshold,
    criticalThreshold,
    onWarning,
    onCritical,
    analyzeMemoryTrend
  ]);

  // Force garbage collection (development only)
  const forceGC = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // @ts-ignore - gc is only available in development with --expose-gc flag
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
      console.info('🗑️ Forced garbage collection');
    } else {
      console.info('💡 To enable manual GC, run with --expose-gc flag');
    }
  }, []);

  // Get memory summary
  const getMemorySummary = useCallback(() => {
    const current = getCurrentMemoryStats();
    const trend = analyzeMemoryTrend(samplesRef.current);
    
    return {
      current,
      trend,
      samples: samplesRef.current.length,
      isAPIAvailable: isMemoryAPIAvailable()
    };
  }, [getCurrentMemoryStats, analyzeMemoryTrend, isMemoryAPIAvailable]);

  // Start/stop monitoring
  useEffect(() => {
    if (!enabled || !isMemoryAPIAvailable()) {
      return;
    }

    // Initial measurement
    monitorMemory();

    // Set up interval
    intervalRef.current = setInterval(monitorMemory, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isMemoryAPIAvailable, monitorMemory, interval]);

  // Development logging
  useEffect(() => {
    if (enabled && process.env.NODE_ENV === 'development') {
      console.info('🔍 Memory monitor started', {
        interval: `${interval / 1000}s`,
        warning: `${warningThreshold}MB`,
        critical: `${criticalThreshold}MB`,
        apiAvailable: isMemoryAPIAvailable()
      });
    }
  }, [enabled, interval, warningThreshold, criticalThreshold, isMemoryAPIAvailable]);

  return {
    isEnabled: enabled && isMemoryAPIAvailable(),
    getCurrentMemoryStats,
    getMemorySummary,
    analyzeMemoryTrend,
    forceGC,
    samples: samplesRef.current
  };
};

/**
 * Enhanced useEffect with abort controller cleanup
 * Prevents memory leaks from unfinished async operations
 */
export const useAbortableEffect = (
  effect: (signal: AbortSignal) => void | (() => void),
  deps: unknown[]
) => {
  useEffect(() => {
    const controller = new AbortController();
    
    const cleanup = effect(controller.signal);
    
    return () => {
      controller.abort();
      cleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * Hook for monitoring component render cycles
 * Helps detect unnecessary re-renders
 */
export const useRenderMonitor = (componentName: string, enabled = process.env.NODE_ENV === 'development') => {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef<any>(undefined);
  
  useEffect(() => {
    if (!enabled) return;
    
    renderCountRef.current++;
    
    if (renderCountRef.current > 1) {
      console.info(`🔄 ${componentName} rendered ${renderCountRef.current} times`);
    }
  }, [enabled, componentName]);

  const logPropsChange = useCallback((props: any) => {
    if (!enabled) return;
    
    if (lastPropsRef.current) {
      const changedProps = Object.keys(props).filter(
        key => props[key] !== lastPropsRef.current[key]
      );
      
      if (changedProps.length > 0) {
        console.info(`📝 ${componentName} props changed:`, changedProps);
      }
    }
    
    lastPropsRef.current = props;
  }, [componentName, enabled]);

  return {
    renderCount: renderCountRef.current,
    logPropsChange
  };
}; 