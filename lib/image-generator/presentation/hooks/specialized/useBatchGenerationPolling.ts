import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { checkMultipleGenerationStatus } from '../../../application/actions/commands/command-actions';
import { IMAGE_GENERATION_QUERY_KEYS } from '../shared/queryKeys';

/**
 * Hook for batch polling of multiple active generations
 * Single responsibility: Efficiently poll multiple generations with smart batching
 */
export function useBatchGenerationPolling(generationIds: string[], enabled: boolean = true) {
  const queryClient = useQueryClient();
  const lastPolledRef = useRef<Set<string>>(new Set());
  const isPageVisibleRef = useRef(true);

  // Filter to only active generations that need polling
  const activeGenerationIds = generationIds.filter(id => {
    const cachedData = queryClient.getQueryData(IMAGE_GENERATION_QUERY_KEYS.detail(id)) as GenerationDto | undefined;
    // Only poll if we don't have cached data or if the status indicates it's still in progress
    return !cachedData || ['pending', 'processing'].includes(cachedData.status);
  });

  // Page visibility tracking for background optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      
      // If page becomes visible and we have active generations, immediately refetch
      if (!document.hidden && activeGenerationIds.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['image-generations', 'batch', ...activeGenerationIds.sort()]
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient, activeGenerationIds]);

  // Adaptive interval based on number of active generations and page visibility
  const getAdaptiveInterval = useCallback(() => {
    if (activeGenerationIds.length === 0) return false;
    
    // Background polling - much slower when tab not visible
    if (!isPageVisibleRef.current) {
      return 20000; // 20 seconds in background
    }

    // Adjust interval based on batch size
    if (activeGenerationIds.length === 1) return 2000;  // 2s for single generation
    if (activeGenerationIds.length <= 3) return 3000;   // 3s for small batch
    if (activeGenerationIds.length <= 5) return 4000;   // 4s for medium batch
    return 5000; // 5s for large batch
  }, [activeGenerationIds.length]);

  const batchQuery = useQuery({
    queryKey: ['image-generations', 'batch', ...activeGenerationIds.sort()],
    queryFn: async (): Promise<GenerationDto[]> => {
      if (activeGenerationIds.length === 0) return [];
      
      const result = await checkMultipleGenerationStatus(activeGenerationIds);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check batch status');
      }

      return result.data || [];
    },
    enabled: enabled && activeGenerationIds.length > 0,
    refetchInterval: getAdaptiveInterval,
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Update individual caches when batch data comes in
  useEffect(() => {
    if (batchQuery.data) {
      batchQuery.data.forEach(generation => {
        // Update individual detail cache
        queryClient.setQueryData(
          IMAGE_GENERATION_QUERY_KEYS.detail(generation.id),
          generation
        );
      });

      // Check if any generations completed and invalidate list cache
      const currentPolled = new Set(batchQuery.data.map(g => g.id));
      const previousPolled = lastPolledRef.current;
      
      const statusChanged = batchQuery.data.some(generation => {
        if (!previousPolled.has(generation.id)) return false;
        const previousData = queryClient.getQueryData(
          IMAGE_GENERATION_QUERY_KEYS.detail(generation.id)
        ) as GenerationDto | undefined;
        return previousData && previousData.status !== generation.status;
      });

      if (statusChanged) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'image-generations' && query.queryKey[1] === 'list';
          },
        });
      }

      lastPolledRef.current = currentPolled;
    }
  }, [batchQuery.data, queryClient]);

  return {
    activeGenerations: batchQuery.data || [],
    isLoading: batchQuery.isLoading,
    error: batchQuery.error,
    activeCount: activeGenerationIds.length,
  };
} 