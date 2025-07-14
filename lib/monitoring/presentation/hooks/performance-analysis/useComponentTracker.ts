import { useEffect, useRef, useCallback, useMemo } from 'react';

interface ComponentMetrics {
  mountTime: number;
  renderTime: number;
  reRenderCount: number;
}

interface UseComponentTrackerReturn {
  trackRender: () => void;
  metrics: ComponentMetrics;
}

/**
 * Hook to track component performance metrics
 */
export function useComponentTracker(_componentName: string): UseComponentTrackerReturn {
  const metrics = useRef<ComponentMetrics>({
    mountTime: 0,
    renderTime: 0,
    reRenderCount: 0,
  });
  
  const renderStartTime = useRef<number>(0);
  const hasMounted = useRef<boolean>(false);

  // Track mount time on first render
  useEffect(() => {
    if (!hasMounted.current) {
      metrics.current.mountTime = performance.now();
      hasMounted.current = true;
    }
  }, []);

  // Track re-renders
  useEffect(() => {
    if (hasMounted.current) {
      metrics.current.reRenderCount++;
    }
  });

  // Memoize trackRender function to prevent recreation
  const trackRender = useCallback(() => {
    renderStartTime.current = performance.now();
    
    // Use setTimeout to measure render time after React completes
    setTimeout(() => {
      const renderTime = performance.now() - renderStartTime.current;
      metrics.current.renderTime = renderTime;
      
      // Performance data is now tracked via metrics object
      // Removed console.log for production readiness
    }, 0);
  }, []);

  // Memoize return object to prevent recreation
  const returnValue = useMemo(() => ({
    trackRender,
    metrics: metrics.current,
  }), [trackRender]);

  return returnValue;
} 