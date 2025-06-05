import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGenerations } from '../../../application/actions/generation.actions';
import { createListQueryKey } from '../shared/queryKeys';
import { GetGenerationsFilters } from '../shared/types';

/**
 * Hook to get a list of generations with enhanced caching and performance optimization
 * Single responsibility: Querying multiple generations with filters and intelligent caching
 */
export function useGenerations(filters: GetGenerationsFilters = {}) {
  // Memoize query key to prevent unnecessary cache invalidations
  const queryKey = useMemo(() => createListQueryKey(filters), [filters]);
  
  // Memoized query function to prevent recreating on every render
  const queryFn = useCallback(async (): Promise<GenerationDto[]> => {
    const result = await getGenerations(filters);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch generations');
    }

    return result.data;
  }, [filters]);

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30 * 1000, // 30 seconds - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
    refetchOnMount: false, // Prevent POST requests on every page refresh - only fetch if no cached data
    refetchOnReconnect: true, // Refetch when network reconnects
    networkMode: 'online', // Only fetch when online
    select: (data: GenerationDto[]) => {
      // Limit data size in memory for performance
      // Show max 50 generations at once to prevent memory bloat
      const limited = data.slice(0, 50);
      
      // Sort by creation date (newest first) for better UX
      return limited.sort((a: GenerationDto, b: GenerationDto) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    retry: (failureCount, error) => {
      // Stop retrying after 2 failures for list queries
      if (failureCount >= 2) return false;
      
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
  });
} 