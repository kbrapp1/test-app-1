'use client';

import { useState, useEffect } from 'react';
import { globalNetworkMonitor, NetworkStats } from '../../application/services/GlobalNetworkMonitor';
import { networkInterceptors } from '../../services/NetworkInterceptors';

export function useNetworkMonitorState(isOpen: boolean, autoRefresh: boolean = true) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const refreshStats = async () => {
      if (!autoRefresh) return;
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      setStats(globalNetworkMonitor.getNetworkStats());
      setIsRefreshing(false);
    };

    refreshStats();

    if (autoRefresh) {
      const interval = setInterval(refreshStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  const handleClear = () => {
    globalNetworkMonitor.clear();
    setStats(globalNetworkMonitor.getNetworkStats());
  };

  const handleToggleInterceptors = () => {
    if (networkInterceptors['isInstalled']) {
      networkInterceptors.uninstall();
    } else {
      networkInterceptors.install();
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(globalNetworkMonitor.getNetworkStats());
      setIsRefreshing(false);
    }, 300);
  };

  return {
    stats,
    isRefreshing,
    handleClear,
    handleToggleInterceptors,
    handleManualRefresh
  };
} 