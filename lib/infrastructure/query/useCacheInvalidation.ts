import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Infrastructure Layer - Cache Invalidation Hook
 * Single Responsibility: Query cache management
 */

// Hook for cache invalidation
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateByKey: (queryKey: string[]) => queryClient.invalidateQueries({ queryKey }),
    invalidateByPattern: (pattern: string) => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        ),
      });
    },
    removeQueries: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
    clearAll: () => queryClient.clear(),
  };
}

/**
 * Hook for intelligent cache management and cleanup
 * Prevents memory bloat from React Query cache
 */
export function useCacheCleanup() {
  const queryClient = useQueryClient();
  const lastCleanup = useRef(Date.now());
  
  const cleanupCache = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    
    // Limit total cache size to prevent memory issues
    const maxCacheSize = 100; // Maximum 100 cached queries
    const maxDetailCacheSize = 50; // Maximum 50 detail queries
    
    if (allQueries.length > maxCacheSize) {
      // Sort by last access time and remove oldest unused queries
      const sortedQueries = allQueries
        .filter(query => !query.getObserversCount()) // Only remove unused queries
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0));
      
      const queriesToRemove = sortedQueries.slice(0, allQueries.length - maxCacheSize);
      
      queriesToRemove.forEach(query => {
        queryCache.remove(query);
      });
      
      console.debug(`🧹 Cache cleanup: removed ${queriesToRemove.length} stale queries`);
    }
    
    // Clean up specific query types that can be memory-intensive
    const detailQueries = allQueries.filter(query => 
      query.queryKey.some(key => typeof key === 'string' && key.includes('detail'))
    );
    
    if (detailQueries.length > maxDetailCacheSize) {
      const unusedDetailQueries = detailQueries
        .filter(query => !query.getObserversCount())
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
        .slice(0, detailQueries.length - maxDetailCacheSize);
        
      unusedDetailQueries.forEach(query => {
        queryCache.remove(query);
      });
      
      console.debug(`🧹 Detail cache cleanup: removed ${unusedDetailQueries.length} detail queries`);
    }
    
    lastCleanup.current = Date.now();
  }, [queryClient]);
  
  const getCacheMetrics = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    
    return {
      totalQueries: allQueries.length,
      activeQueries: allQueries.filter(q => q.getObserversCount() > 0).length,
      stalQueries: allQueries.filter(q => q.isStale()).length,
      lastCleanup: lastCleanup.current,
      cacheSize: `${allQueries.length}/${100}`, // current/max
    };
  }, [queryClient]);
  
  // Auto-cleanup every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupCache();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, [cleanupCache]);
  
  return {
    cleanupCache,
    getCacheMetrics,
  };
} 