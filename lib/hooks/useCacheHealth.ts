import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

/**
 * Cache Health Hook
 * 
 * AI INSTRUCTIONS:
 * - Provide real-time cache health monitoring
 * - Support automatic refresh intervals
 * - Include performance recommendations
 * - Handle error states gracefully
 * - Enable/disable monitoring based on user preferences
 */

export interface CacheHealthData {
  timestamp: string;
  overall: {
    status: 'healthy' | 'degraded' | 'error';
    infrastructure: boolean;
    knowledge: string;
    domain: boolean;
    flow: boolean;
  };
  caches: {
    knowledge: {
      size: number;
      maxSize: number;
      utilizationPercent: number;
      memoryUsage: string;
      ttlMs: number;
      oldestEntry?: { key: string; ageMs: number };
      newestEntry?: { key: string; ageMs: number };
    };
    vector: {
      isReady: boolean;
      stats?: {
        totalVectors: number;
        memoryUsageKB: number;
        cacheHitRate: number;
        memoryUtilization: number;
        searchCount: number;
        evictionsPerformed: number;
      };
      healthStatus?: {
        status: 'healthy' | 'degraded' | 'error';
        score: number;
        lastChecked: string;
      };
      error?: string;
    } | null;
  };
  recommendations: Array<{
    type: 'memory' | 'performance' | 'capacity' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action: string;
  }>;
}

export interface UseCacheHealthOptions {
  organizationId?: string;
  chatbotConfigId?: string;
  includeDetails?: boolean;
  refreshInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useCacheHealth(options: UseCacheHealthOptions = {}) {
  const {
    organizationId,
    chatbotConfigId,
    includeDetails = false,
    refreshInterval = 30000, // 30 seconds default
    enabled = true
  } = options;

  const [healthHistory, setHealthHistory] = useState<CacheHealthData[]>([]);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>>([]);

  const query = useQuery({
    queryKey: ['cache-health', organizationId, chatbotConfigId, includeDetails],
    queryFn: async (): Promise<CacheHealthData> => {
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId);
      if (chatbotConfigId) params.set('chatbotConfigId', chatbotConfigId);
      if (includeDetails) params.set('details', 'true');

      const response = await fetch(`/api/health/cache?${params}`);
      if (!response.ok) {
        throw new Error(`Cache health check failed: ${response.statusText}`);
      }
      return response.json();
    },
    enabled,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Track health history for trend analysis
  useEffect(() => {
    if (query.data) {
      setHealthHistory(prev => {
        const newHistory = [...prev, query.data!];
        // Keep only last 100 entries (about 50 minutes at 30s intervals)
        return newHistory.slice(-100);
      });
    }
  }, [query.data]);

  // Generate alerts for critical issues
  useEffect(() => {
    if (query.data?.recommendations) {
      const criticalRecommendations = query.data.recommendations.filter(
        rec => rec.severity === 'critical' || rec.severity === 'high'
      );

      if (criticalRecommendations.length > 0) {
        const newAlerts = criticalRecommendations.map(rec => ({
          id: `${rec.type}-${Date.now()}`,
          type: rec.type,
          severity: rec.severity,
          message: rec.message,
          timestamp: new Date().toISOString()
        }));

        setAlerts(prev => {
          // Avoid duplicate alerts
          const existingMessages = new Set(prev.map(a => a.message));
          const uniqueAlerts = newAlerts.filter(a => !existingMessages.has(a.message));
          
          if (uniqueAlerts.length > 0) {
            return [...prev, ...uniqueAlerts].slice(-20); // Keep last 20 alerts
          }
          return prev;
        });
      }
    }
  }, [query.data?.recommendations]);

  // Calculate health trends
  const healthTrend = healthHistory.length >= 2 ? (() => {
    const recent = healthHistory.slice(-5); // Last 5 readings
    const older = healthHistory.slice(-10, -5); // Previous 5 readings
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentHealthy = recent.filter(h => h.overall.status === 'healthy').length;
    const olderHealthy = older.filter(h => h.overall.status === 'healthy').length;
    
    const recentRate = recentHealthy / recent.length;
    const olderRate = olderHealthy / older.length;
    
    if (recentRate > olderRate + 0.2) return 'improving';
    if (recentRate < olderRate - 0.2) return 'degrading';
    return 'stable';
  })() : 'stable';

  // Calculate cache efficiency metrics
  const cacheEfficiency = query.data ? {
    knowledgeCacheUtilization: query.data.caches.knowledge.utilizationPercent,
    vectorCacheHitRate: query.data.caches.vector?.stats?.cacheHitRate ? 
      query.data.caches.vector.stats.cacheHitRate * 100 : 0,
    overallEfficiency: query.data.caches.vector?.stats?.cacheHitRate ? 
      (query.data.caches.knowledge.utilizationPercent + 
       query.data.caches.vector.stats.cacheHitRate * 100) / 2 : 
      query.data.caches.knowledge.utilizationPercent
  } : null;

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Clear all alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Get health status summary
  const getHealthSummary = () => {
    if (!query.data) return null;
    
    const { overall, recommendations } = query.data;
    const criticalIssues = recommendations.filter(r => r.severity === 'critical').length;
    const highIssues = recommendations.filter(r => r.severity === 'high').length;
    
    return {
      status: overall.status,
      criticalIssues,
      highIssues,
      totalRecommendations: recommendations.length,
      trend: healthTrend
    };
  };

  return {
    // Data
    data: query.data,
    healthHistory,
    alerts,
    cacheEfficiency,
    healthTrend,
    
    // Status
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
    dismissAlert,
    clearAlerts,
    getHealthSummary,
    
    // Utilities
    isHealthy: query.data?.overall.status === 'healthy',
    hasAlerts: alerts.length > 0,
    hasCriticalIssues: alerts.some(a => a.severity === 'critical'),
    lastUpdated: query.data?.timestamp
  };
} 