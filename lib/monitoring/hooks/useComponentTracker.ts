import { useEffect, useRef } from 'react';

interface ComponentPerformanceData {
  name: string;
  renderCount: number;
  apiCalls: string[];
  renderTime: number;
  lastRender: Date;
}

export function useComponentTracker(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());
  
  useEffect(() => {
    renderCountRef.current++;
    const renderTime = performance.now() - startTimeRef.current;
    
    // Track this component's performance
    if (typeof window !== 'undefined') {
      const existing = window.__COMPONENT_PERFORMANCE__ || new Map();
      const current = existing.get(componentName) || {
        name: componentName,
        renderCount: 0,
        apiCalls: [],
        renderTime: 0,
        lastRender: new Date()
      };
      
      current.renderCount = renderCountRef.current;
      current.renderTime += renderTime;
      current.lastRender = new Date();
      
      existing.set(componentName, current);
      window.__COMPONENT_PERFORMANCE__ = existing;
    }
    
    startTimeRef.current = performance.now();
  });
  
  return {
    renderCount: renderCountRef.current,
    trackApiCall: (endpoint: string) => {
      if (typeof window !== 'undefined') {
        const existing = window.__COMPONENT_PERFORMANCE__ || new Map();
        const current = existing.get(componentName);
        if (current) {
          current.apiCalls.push(endpoint);
          existing.set(componentName, current);
        }
      }
    }
  };
}

// Global type declaration
declare global {
  interface Window {
    __COMPONENT_PERFORMANCE__: Map<string, ComponentPerformanceData>;
  }
} 