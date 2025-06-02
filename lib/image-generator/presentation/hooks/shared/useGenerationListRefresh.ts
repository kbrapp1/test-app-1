import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IMAGE_GENERATION_QUERY_KEYS } from './queryKeys';
import { type GetGenerationsFilters } from './types';

/**
 * Hook for automatic list refresh when there are active generations
 * Single responsibility: Manage list refresh intervals for active generations
 */
export function useGenerationListRefresh(
  activeCount: number,
  filters: GetGenerationsFilters
) {
  const queryClient = useQueryClient();

  // Auto-refresh the main list when there are active generations
  useEffect(() => {
    if (activeCount === 0) return;

    const intervalId = setInterval(async () => {
      try {
        await queryClient.refetchQueries({
          queryKey: IMAGE_GENERATION_QUERY_KEYS.list(filters),
        });
      } catch (error) {
        // Silent error handling for list refresh failures
      }
    }, 5000); // Refresh list every 5 seconds when there are active generations

    return () => clearInterval(intervalId);
  }, [activeCount, queryClient, filters]);

  return {
    isRefreshing: activeCount > 0,
  };
} 