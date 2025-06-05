'use client';

import { useState, useEffect } from 'react';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';
import { globalNetworkMonitor } from '../../application/services/GlobalNetworkMonitor';
import { networkInterceptors } from '../../services/NetworkInterceptors';

// No conversion needed - NetworkMonitoringService returns proper NetworkStats

export function useNetworkMonitoring() {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [justReset, setJustReset] = useState(false);
  const [pauseAfterReset, setPauseAfterReset] = useState(false);

  useEffect(() => {
    if (!isEnabled || pauseAfterReset) return;

    // Initialize network interceptors if not already installed
    if (!networkInterceptors['isInstalled']) {
      networkInterceptors.install();
    }

    // Get real network stats from global monitor
    const updateStats = () => {
      setNetworkStats(prev => {
        const newStats = globalNetworkMonitor.getNetworkStats();
        // Only update if there are actual changes to prevent unnecessary re-renders
        if (!prev || 
            prev.totalCalls !== newStats.totalCalls || 
            prev.redundantCalls !== newStats.redundantCalls || 
            prev.persistentRedundantCount !== newStats.persistentRedundantCount) {
          return newStats;
        }
        return prev;
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isEnabled, pauseAfterReset]);

  const clearNetworkData = () => {
    // Clear real network monitor data
    globalNetworkMonitor.clear();
    setJustReset(true);
    setPauseAfterReset(true);
    
    // Set to empty stats immediately
    setNetworkStats({
      totalCalls: 0,
      redundantCalls: 0,
      redundancyRate: 0,
      sessionRedundancyRate: 0,
      persistentRedundantCount: 0,
      recentCalls: [],
      redundantPatterns: [],
      callsByType: {},
      persistentIssues: []
    });

    // Pause monitoring for 3 seconds to show clean reset state
    setTimeout(() => {
      setPauseAfterReset(false);
      setJustReset(false);
    }, 3000); // 3 second pause to show clean state
  };

  return {
    networkStats,
    isEnabled,
    setIsEnabled,
    clearNetworkData,
    justReset,
    isPaused: pauseAfterReset
  };
} 