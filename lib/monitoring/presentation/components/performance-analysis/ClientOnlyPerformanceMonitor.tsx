'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient, Mutation } from '@tanstack/react-query';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';

interface ClientOnlyPerformanceMonitorProps {
  isEnabled: boolean;
}

export function ClientOnlyPerformanceMonitor({ isEnabled }: ClientOnlyPerformanceMonitorProps) {
  const [isClient, setIsClient] = useState(false);
  const [PerformanceMonitor, setPerformanceMonitor] = useState<React.ComponentType<{ 
    metrics: PerformanceMetrics; 
    className?: string; 
    isOpen: boolean; 
    autoRefresh: boolean; 
  }> | null>(null);
  const queryClient = useQueryClient();

  // Only render on client after hydration
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import the PerformanceMonitor only on client
    if (isEnabled && process.env.NODE_ENV === 'development') {
      import('./PerformanceMonitor')
        .then(module => {
          setPerformanceMonitor(() => module.PerformanceMonitor);
        })
        .catch(() => {
          // Silent fail for development tool
        });
    }
  }, [isEnabled]);

  if (!isClient || !isEnabled || !PerformanceMonitor || process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Generate metrics based on current React Query state
  const metrics = {
    cacheSize: queryClient.getQueryCache().getAll().length,
    activeMutations: queryClient.getMutationCache().getAll().filter(
      (mutation: Mutation) => mutation.state.status === 'pending'
    ).length,
    isOptimized: true,
    lastUpdate: new Date().toISOString(),
  };

  return (
    <PerformanceMonitor 
      metrics={metrics} 
      className="global-performance-monitor"
      isOpen={true}
      autoRefresh={true}
    />
  );
} 