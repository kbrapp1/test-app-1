'use client';

import { useState, useEffect, useCallback } from 'react';
import { globalNetworkMonitor, NetworkStats } from '../../../application/services/GlobalNetworkMonitor';
import { networkInterceptors } from '../../../infrastructure/services/NetworkInterceptors';

export function useNetworkMonitorState(isOpen: boolean, autoRefresh: boolean = true) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize refreshStats function
  const refreshStats = useCallback(async () => {
    if (!autoRefresh) return;
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setStats(globalNetworkMonitor.getNetworkStats());
    setIsRefreshing(false);
  }, [autoRefresh]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    refreshStats();

    if (autoRefresh) {
      const interval = setInterval(refreshStats, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isOpen, autoRefresh, refreshStats]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleClear = useCallback(() => {
    globalNetworkMonitor.clear();
    setStats(globalNetworkMonitor.getNetworkStats());
  }, []);

  const handleToggleInterceptors = useCallback(() => {
    if (networkInterceptors['isInstalled']) {
      networkInterceptors.uninstall();
    } else {
      networkInterceptors.install();
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(globalNetworkMonitor.getNetworkStats());
      setIsRefreshing(false);
    }, 300);
  }, []);

  return {
    stats,
    isRefreshing,
    handleClear,
    handleToggleInterceptors,
    handleManualRefresh
  };
} 