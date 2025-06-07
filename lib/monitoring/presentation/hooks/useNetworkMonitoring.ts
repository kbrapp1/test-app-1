'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';
import type { NetworkMonitoringService } from '../../application/services/NetworkMonitoringService';
// Note: network interceptors will be lazy-loaded when monitoring is enabled

// No conversion needed - NetworkMonitoringService returns proper NetworkStats

export function useNetworkMonitoring() {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [justReset, setJustReset] = useState(false);
  const [pauseAfterReset, setPauseAfterReset] = useState(false);
  const monitorRef = useRef<NetworkMonitoringService | null>(null);

  useEffect(() => {
    import('../../application/services/GlobalNetworkMonitor')
      .then(module => { monitorRef.current = module.globalNetworkMonitor; });
  }, []);

  const updateStats = useCallback(() => {
    setNetworkStats(prev => {
      const monitor = monitorRef.current;
      if (!monitor) return prev;
      const newStats = monitor.getNetworkStats();
      if (!prev || 
          prev.totalCalls !== newStats.totalCalls || 
          prev.redundantCalls !== newStats.redundantCalls || 
          prev.persistentRedundantCount !== newStats.persistentRedundantCount) {
        return newStats;
      }
      return prev;
    });
  }, []);

  // Adaptive polling: use faster polling when visible, slower when hidden
  const getInterval = useCallback(() => document.hidden ? 10000 : 2000, []);
  useEffect(() => {
    if (!isEnabled || pauseAfterReset) return;

    // Lazy-load network interceptors for request tracking
    (async () => {
      try {
        const mod = await import('../../infrastructure/services/NetworkInterceptors');
        const { networkInterceptors } = mod;
        if (!networkInterceptors['isInstalled']) {
          networkInterceptors.install();
        }
      } catch {
        // Silent fail if interceptors module not available
      }
    })();

    updateStats();
    let intervalId = setInterval(updateStats, getInterval());

    // Handle visibility changes to adjust polling interval
    const handleVisibilityChange = () => {
      clearInterval(intervalId);
      intervalId = setInterval(updateStats, getInterval());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, pauseAfterReset, updateStats, getInterval]);

  // Memoize empty stats object to prevent recreation
  const emptyNetworkStats = useMemo((): NetworkStats => ({
    totalCalls: 0,
    redundantCalls: 0,
    redundancyRate: 0,
    sessionRedundancyRate: 0,
    persistentRedundantCount: 0,
    recentCalls: [],
    redundantPatterns: [],
    callsByType: {},
    persistentIssues: []
  }), []);

  const clearNetworkData = useCallback(() => {
    monitorRef.current?.clear();
    setJustReset(true);
    setPauseAfterReset(true);
    
    setNetworkStats(emptyNetworkStats);

    setTimeout(() => {
      setPauseAfterReset(false);
      setJustReset(false);
    }, 3000);
  }, [emptyNetworkStats]);

  return {
    networkStats,
    isEnabled,
    setIsEnabled,
    clearNetworkData,
    justReset,
    isPaused: pauseAfterReset
  };
} 