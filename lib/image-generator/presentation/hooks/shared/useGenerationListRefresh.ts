import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IMAGE_GENERATION_QUERY_KEYS } from './queryKeys';
import { type GetGenerationsFilters } from './types';

/**
 * Hook for automatic list refresh when there are active generations
 * Single responsibility: Manage list refresh intervals for active generations with optimized frequency
 */
export function useGenerationListRefresh(
  activeCount: number,
  filters: GetGenerationsFilters
) {
  const queryClient = useQueryClient();

  // Auto-refresh the main list when there are active generations
  useEffect(() => {
    if (activeCount === 0) return;

    // Use longer intervals to reduce API load
    const refreshInterval = activeCount > 5 ? 3000 : 5000; // More frequent if many active generations

    const intervalId = setInterval(async () => {
      try {
        // Only refetch if there are still active generations
        const currentData = queryClient.getQueryData(IMAGE_GENERATION_QUERY_KEYS.list(filters));
        if (!currentData) return;

        await queryClient.refetchQueries({
          queryKey: IMAGE_GENERATION_QUERY_KEYS.list(filters),
          type: 'active', // Only refetch active queries
        });
      } catch (error) {
        // Silent error handling for list refresh failures
        console.debug('Generation list refresh failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [activeCount, queryClient, filters]);

  return {
    isRefreshing: activeCount > 0,
    refreshInterval: activeCount > 5 ? 3000 : 5000,
  };
} 