import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IMAGE_GENERATION_QUERY_KEYS } from './queryKeys';

/**
 * Hook for cache management and optimization
 * Single responsibility: Cache lifecycle management for image generations
 */
export function useGenerationCacheManager() {
  const queryClient = useQueryClient();

  // Cache cleanup for old data
  const cleanupOldCache = useCallback(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    queryClient.getQueryCache().getAll().forEach(query => {
      if (query.queryKey[0] === 'image-generations') {
        if (query.state.dataUpdatedAt < oneHourAgo) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      }
    });
  }, [queryClient]);

  // Prefetch related data
  const prefetchGenerationDetails = useCallback((generationIds: string[]) => {
    generationIds.forEach(id => {
      queryClient.prefetchQuery({
        queryKey: IMAGE_GENERATION_QUERY_KEYS.detail(id),
        staleTime: 30 * 1000, // 30 seconds
      });
    });
  }, [queryClient]);

  // Cache warming for common queries
  const warmCache = useCallback(() => {
    // Prefetch recent generations
    queryClient.prefetchQuery({
      queryKey: IMAGE_GENERATION_QUERY_KEYS.list({}),
      staleTime: 60 * 1000, // 1 minute
    });

    // Prefetch stats
    queryClient.prefetchQuery({
      queryKey: IMAGE_GENERATION_QUERY_KEYS.stats(),
      staleTime: 60 * 1000, // 1 minute
    });
  }, [queryClient]);

  // Debounced cache invalidation
  const invalidateGenerationCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: IMAGE_GENERATION_QUERY_KEYS.all
    });
  }, [queryClient]);

  return {
    cleanupOldCache,
    prefetchGenerationDetails,
    warmCache,
    invalidateGenerationCache,
  };
} 