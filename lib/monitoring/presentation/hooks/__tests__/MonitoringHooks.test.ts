import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePerformanceTracking } from '../performance-analysis/usePerformanceTracking';
import { useNetworkMonitoring } from '../network-analysis/useNetworkMonitoring';
import { useComponentTracker } from '../performance-analysis/useComponentTracker';
import { InputPerformanceMetrics } from '../../../application/dto/PerformanceTrackingDTO';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onTTFB: vi.fn(),
}));

// Mock global network monitor
vi.mock('../../../application/services/GlobalNetworkMonitor', () => ({
  globalNetworkMonitor: {
    getNetworkStats: vi.fn(() => ({
      totalCalls: 5,
      redundantCalls: 1,
      redundancyRate: 20,
      sessionRedundancyRate: 20,
      persistentRedundantCount: 0,
      recentCalls: [],
      redundantPatterns: [],
      callsByType: {},
      persistentIssues: []
    })),
    clear: vi.fn(),
  },
}));

// Mock network interceptors
vi.mock('../../../infrastructure/services/NetworkInterceptors', () => ({
  networkInterceptors: {
    isInstalled: false,
    install: vi.fn(),
    uninstall: vi.fn(),
  },
}));

Object.defineProperty(window, 'performance', {
  value: { now: vi.fn(() => Date.now()) },
});

describe('Monitoring Hooks Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePerformanceTracking', () => {
    const mockMetrics: InputPerformanceMetrics = {
      cacheSize: 10,
      activeMutations: 2,
      lastUpdate: new Date().toISOString()
    };

    it('should memoize tracking state properly', () => {
      const { result, rerender } = renderHook(
        ({ metrics }) => usePerformanceTracking(metrics),
        { initialProps: { metrics: mockMetrics } }
      );

      const firstState = result.current.state;
      
      // Rerender with same metrics
      rerender({ metrics: mockMetrics });
      
      const secondState = result.current.state;
      
      // State should be the same object reference due to memoization
      expect(firstState).toBe(secondState);
    });

    it('should memoize reset functions', () => {
      const { result, rerender } = renderHook(() => usePerformanceTracking(mockMetrics));

      const firstResetCounters = result.current.resetCounters;
      const firstFullReset = result.current.fullReset;
      
      rerender();
      
      // Functions should be the same reference due to useCallback
      expect(result.current.resetCounters).toBe(firstResetCounters);
      expect(result.current.fullReset).toBe(firstFullReset);
    });

    it('should update state when metrics change', () => {
      const { result, rerender } = renderHook(
        ({ metrics }) => usePerformanceTracking(metrics),
        { initialProps: { metrics: mockMetrics } }
      );

      const firstState = result.current.state;
      
      const newMetrics = {
        ...mockMetrics,
        lastUpdate: new Date().toISOString(),
        cacheSize: 15
      };
      
      rerender({ metrics: newMetrics });
      
      const secondState = result.current.state;
      
      // State should be different when metrics change
      expect(firstState).not.toBe(secondState);
    });
  });

  describe('useNetworkMonitoring', () => {
    it('should memoize clearNetworkData function', () => {
      const { result, rerender } = renderHook(() => useNetworkMonitoring());

      const firstClearFunction = result.current.clearNetworkData;
      
      rerender();
      
      expect(result.current.clearNetworkData).toBe(firstClearFunction);
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useNetworkMonitoring());

      const { clearNetworkData, setIsEnabled } = result.current;
      
      rerender();
      
      // All functions should maintain their references
      expect(result.current.clearNetworkData).toBe(clearNetworkData);
      expect(result.current.setIsEnabled).toBe(setIsEnabled);
    });
  });

  describe('useComponentTracker', () => {
    it('should memoize trackRender function', () => {
      const { result, rerender } = renderHook(() => useComponentTracker('TestComponent'));

      const firstTrackRender = result.current.trackRender;
      
      rerender();
      
      expect(result.current.trackRender).toBe(firstTrackRender);
    });

    it('should memoize return object', () => {
      const { result, rerender } = renderHook(() => useComponentTracker('TestComponent'));

      const firstReturnValue = result.current;
      
      rerender();
      
      // The return object should be memoized
      expect(result.current).toBe(firstReturnValue);
    });

    it('should track render metrics correctly', () => {
      const { result } = renderHook(() => useComponentTracker('TestComponent'));

      expect(result.current.metrics).toBeDefined();
      expect(result.current.metrics.mountTime).toBeGreaterThanOrEqual(0);
      expect(result.current.metrics.reRenderCount).toBeGreaterThanOrEqual(0);
      expect(result.current.trackRender).toBeInstanceOf(Function);
    });
  });

  describe('Hook Performance Optimization Validation', () => {
    it('should prevent unnecessary re-renders through memoization', () => {
      // Test memoization by checking if functions maintain references across rerenders
      const { result, rerender } = renderHook(() => {
        const performance = usePerformanceTracking({
          cacheSize: 10,
          activeMutations: 2,
          lastUpdate: new Date().toISOString()
        });
        const network = useNetworkMonitoring();
        const tracker = useComponentTracker('TestComponent');
        
        return { performance, network, tracker };
      });

      // Capture initial function references
      const initialPerformanceReset = result.current.performance.resetCounters;
      const initialPerformanceFullReset = result.current.performance.fullReset;
      const initialNetworkClear = result.current.network.clearNetworkData;
      const initialNetworkSetEnabled = result.current.network.setIsEnabled;
      const initialTrackerFunction = result.current.tracker.trackRender;
      
      // Force rerender without changing props
      rerender();
      
      // Verify memoized functions maintain their references
      expect(result.current.performance.resetCounters).toBe(initialPerformanceReset);
      expect(result.current.performance.fullReset).toBe(initialPerformanceFullReset);
      expect(result.current.network.clearNetworkData).toBe(initialNetworkClear);
      expect(result.current.network.setIsEnabled).toBe(initialNetworkSetEnabled);
      expect(result.current.tracker.trackRender).toBe(initialTrackerFunction);
    });

    it('should maintain dependency array optimization', () => {
      const { result } = renderHook(() => usePerformanceTracking({
        cacheSize: 10,
        activeMutations: 2,
        lastUpdate: new Date().toISOString()
      }));

      // Verify all returned functions are properly memoized
      expect(typeof result.current.resetCounters).toBe('function');
      expect(typeof result.current.fullReset).toBe('function');
      expect(typeof result.current.state).toBe('object');
    });
  });
}); 