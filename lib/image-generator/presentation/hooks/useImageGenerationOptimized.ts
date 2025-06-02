import { useMemo } from 'react';
import { 
  useGenerations,
  useGenerationStats,
  type GetGenerationsFilters 
} from './index';
import { useGenerationStateComputed } from './shared/useGenerationStateComputed';
import { useGenerationListRefresh } from './shared/useGenerationListRefresh';
import { useOptimizedGenerate } from './shared/useOptimizedGenerate';
import { useGenerationCacheManager } from './shared/useGenerationCacheManager';

/**
 * Performance-optimized hook for image generation with selective re-rendering
 * and intelligent cache management
 * 
 * Single responsibility: Coordinate image generation state and actions
 */
export function useImageGenerationOptimized(filters: GetGenerationsFilters = {}) {
  // Memoize filters to prevent unnecessary re-fetches
  const memoizedFilters = useMemo(() => filters, [
    filters.status,
    filters.limit,
    filters.offset,
    filters.startDate?.getTime(),
    filters.endDate?.getTime(),
  ]);

  // Core data fetching
  const { data: generations = [], refetch: refetchGenerations, isLoading } = useGenerations(memoizedFilters);
  const { data: stats, isLoading: statsLoading } = useGenerationStats();

  // Computed state
  const computedData = useGenerationStateComputed(generations);

  // Generation functionality
  const { generate, isGenerating, error } = useOptimizedGenerate();

  // Auto-refresh when there are active generations
  const { isRefreshing } = useGenerationListRefresh(computedData.activeCount, memoizedFilters);

  // Cache management
  const { invalidateGenerationCache } = useGenerationCacheManager();

  return {
    // Data
    generations,
    stats,
    ...computedData,
    
    // Loading states
    isLoading,
    statsLoading,
    isGenerating,
    isRefreshing,
    
    // Actions
    generate,
    refetch: refetchGenerations,
    invalidateCache: invalidateGenerationCache,
    
    // Error states
    error,
  };
} 