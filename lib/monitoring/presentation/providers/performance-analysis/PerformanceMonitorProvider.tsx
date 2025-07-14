'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PerformanceMonitorContextType {
  isEnabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const PerformanceMonitorContext = createContext<PerformanceMonitorContextType | null>(null);

export function PerformanceMonitorProvider({ children }: { children: React.ReactNode }) {
  // Always start with false to prevent hydration mismatch
  const [isEnabled, setIsEnabled] = useState(false);
  const [_isHydrated, setIsHydrated] = useState(false);

  // Update state after hydration to avoid SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
    
    // Check localStorage for persisted state
    const stored = localStorage.getItem('perfMonitorEnabled');
    if (stored !== null) {
      setIsEnabled(stored === 'true');
      return;
    }
    
    // Fallback to URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('perf') === 'true') {
      setIsEnabled(true);
      localStorage.setItem('perfMonitorEnabled', 'true');
    }
  }, []);

  const toggle = () => setIsEnabled(prev => {
    const newValue = !prev;
    localStorage.setItem('perfMonitorEnabled', String(newValue));
    return newValue;
  });
  
  const enable = () => {
    setIsEnabled(true);
    localStorage.setItem('perfMonitorEnabled', 'true');
  };
  
  const disable = () => {
    setIsEnabled(false);
    localStorage.setItem('perfMonitorEnabled', 'false');
  };

  // Expose to window for console access
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as Window & { togglePerfMonitor?: () => void; enablePerfMonitor?: () => void; disablePerfMonitor?: () => void }).togglePerfMonitor = toggle;
      (window as Window & { togglePerfMonitor?: () => void; enablePerfMonitor?: () => void; disablePerfMonitor?: () => void }).enablePerfMonitor = enable;
      (window as Window & { togglePerfMonitor?: () => void; enablePerfMonitor?: () => void; disablePerfMonitor?: () => void }).disablePerfMonitor = disable;
    }
  }, []);

  const value = {
    isEnabled,
    toggle,
    enable,
    disable,
  };

  return (
    <PerformanceMonitorContext.Provider value={value}>
      {children}
    </PerformanceMonitorContext.Provider>
  );
}

export function usePerformanceMonitor() {
  const context = useContext(PerformanceMonitorContext);
  if (!context) {
    throw new Error('usePerformanceMonitor must be used within a PerformanceMonitorProvider');
  }
  return context;
} 