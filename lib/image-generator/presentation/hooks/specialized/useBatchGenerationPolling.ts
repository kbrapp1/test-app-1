import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { GenerationDto } from '../../../application/dto';
import { checkMultipleGenerationStatus } from '../../../application/actions/commands/command-actions';
import { IMAGE_GENERATION_QUERY_KEYS } from '../shared/queryKeys';

/**
 * Hook for batch polling of multiple active generations
 * Single responsibility: Efficiently poll multiple generations with smart batching
 * Updated to fix invalidationTimeoutRef error
 */
export function useBatchGenerationPolling(generationIds: string[], enabled: boolean = true) {
  const queryClient = useQueryClient();
  const lastPolledRef = useRef<Set<string>>(new Set());
  const isPageVisibleRef = useRef(true);
  const _startTimeRef = useRef<number>(Date.now());
  const skipFirstPollRef = useRef(true);
  
  // Memoize the sorted generation IDs to prevent unnecessary re-renders
  const stableGenerationIds = useMemo(() => [...generationIds].sort(), [generationIds]);
  
  // Memoize query key to prevent React Query from treating it as a new query
  const queryKey = useMemo(() => ['image-generations', 'batch', ...stableGenerationIds], [stableGenerationIds]);

  // Reset skipFirstPoll when generationIds change to avoid immediate polling on new generations
  useEffect(() => {
    skipFirstPollRef.current = true;
  }, [queryKey]);

  // Optimized cache lookup with hit ratio monitoring
  const { activeGenerationIds, cacheHitRatio } = useMemo(() => {
    let cacheHits = 0;
    let totalLookups = 0;
    
    const activeIds = stableGenerationIds.filter(id => {
      totalLookups++;
      const cachedData = queryClient.getQueryData(IMAGE_GENERATION_QUERY_KEYS.detail(id)) as GenerationDto | undefined;
      
      if (cachedData) {
        cacheHits++;
        // Only poll if the status indicates it's still in progress
        return ['pending', 'processing'].includes(cachedData.status);
      }
      
      // Poll if we don't have cached data
      return true;
    });

    const hitRatio = totalLookups > 0 ? (cacheHits / totalLookups) * 100 : 0;

    return {
      activeGenerationIds: activeIds,
      cacheHitRatio: hitRatio
    };
  }, [stableGenerationIds, queryClient]);

  // Determine if polling should be enabled
  const shouldEnablePolling = enabled && activeGenerationIds.length > 0;

  // Page visibility tracking for background optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      
      // If page becomes visible and we have active generations, immediately refetch
      if (!document.hidden && shouldEnablePolling) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient, queryKey, shouldEnablePolling]);

  // Adaptive interval based on number of active generations - memoized
  const getAdaptiveInterval = useCallback(() => {
    if (activeGenerationIds.length === 0) {
      return false; // No logging here to prevent spam
    }
    
    // Background polling - much slower when tab not visible
    if (!isPageVisibleRef.current) {
      return 20000; // 20 seconds in background
    }

    // INCREASED INTERVALS: More reasonable polling to prevent spam
    if (activeGenerationIds.length === 1) return 3000;  // 3s for single generation
    if (activeGenerationIds.length <= 3) return 4000;   // 4s for small batch
    if (activeGenerationIds.length <= 5) return 5000;   // 5s for medium batch
    return 6000; // 6s for large batch
  }, [activeGenerationIds.length]);

  const batchQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<GenerationDto[]> => {
      // Skip the initial polling fetch
      if (skipFirstPollRef.current) {
        skipFirstPollRef.current = false;
        return [];
      }

      if (activeGenerationIds.length === 0) {
        return [];
      }
      
      const result = await checkMultipleGenerationStatus(activeGenerationIds);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check batch status');
      }

      return result.data || [];
    },
    enabled: shouldEnablePolling,
    refetchInterval: shouldEnablePolling ? getAdaptiveInterval() : false,
    staleTime: 2000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  // Update individual caches when batch data comes in
  useEffect(() => {
    if (batchQuery.data && batchQuery.data.length > 0) {
      // Batch all updates to prevent multiple re-renders
      const updatedGenerations = batchQuery.data.filter(generation => {
        const previousData = queryClient.getQueryData(
          IMAGE_GENERATION_QUERY_KEYS.detail(generation.id)
        ) as GenerationDto | undefined;

        // Only include if the data actually changed
        return !previousData || previousData.status !== generation.status || previousData.imageUrl !== generation.imageUrl;
      });

      if (updatedGenerations.length > 0) {
        // Update all detail caches
        updatedGenerations.forEach(generation => {
          queryClient.setQueryData(
            IMAGE_GENERATION_QUERY_KEYS.detail(generation.id),
            generation
          );
        });
        
        // Single update to the infinite cache for all changed generations
        const infiniteQueryKey = ['image-generations', 'list', { filters: {} }, 'infinite'];
        queryClient.setQueryData(infiniteQueryKey, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          // Update all generations in the cache pages in one operation
          const newPages = oldData.pages.map((page: any[]) => 
            page.map((g: any) => {
              const updated = updatedGenerations.find(ug => ug.id === g.id);
              return updated || g;
            })
          );
          
          return {
            ...oldData,
            pages: newPages
          };
        });
      }

      // Track polled generations for debugging (no cache invalidation)
      const currentPolled = new Set(batchQuery.data.map(g => g.id));
      lastPolledRef.current = currentPolled;
    }
  }, [batchQuery.data, queryClient]);

  return {
    activeGenerations: batchQuery.data || [],
    isLoading: batchQuery.isLoading,
    error: batchQuery.error,
    activeCount: batchQuery.data?.length || 0,
    cacheHitRatio, // For performance monitoring
  };
} 