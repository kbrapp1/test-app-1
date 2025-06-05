import { useMemo } from 'react';
import { useGenerations } from '../queries/useGenerations';
import { GetGenerationsFilters } from './types';

/**
 * Shared generations hook that provides optimized data for both main view and history panel
 * Single responsibility: Centralize generation data to prevent duplicate API calls
 */
export function useSharedGenerations(filters: GetGenerationsFilters = {}) {
  // Fetch a larger set of generations to serve both main view and history
  const { data: allGenerations = [], ...queryState } = useGenerations({
    ...filters,
    limit: 100, // Fetch more to serve both main view and history
  });

  // Memoize derived data to prevent unnecessary re-computations
  const derivedData = useMemo(() => {
    // Recent generations for main display (limit to 20)
    const recentGenerations = allGenerations.slice(0, 20);
    
    // All generations for history panel
    const historyGenerations = allGenerations;
    
    // Computed statistics
    const totalCount = allGenerations.length;
    const pendingCount = allGenerations.filter(g => g.status === 'pending').length;
    const processingCount = allGenerations.filter(g => g.status === 'processing').length;
    const completedCount = allGenerations.filter(g => g.status === 'completed').length;
    const failedCount = allGenerations.filter(g => g.status === 'failed').length;
    
    const activeCount = pendingCount + processingCount;
    const hasActiveGenerations = activeCount > 0;
    
    return {
      recentGenerations,
      historyGenerations,
      statistics: {
        totalCount,
        pendingCount,
        processingCount,
        completedCount,
        failedCount,
        activeCount,
        hasActiveGenerations,
      },
    };
  }, [allGenerations]);

  return {
    ...derivedData,
    ...queryState,
    allGenerations, // Expose raw data if needed
  };
} 