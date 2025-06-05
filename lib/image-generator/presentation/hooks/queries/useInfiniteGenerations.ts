import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGenerations } from '../../../application/actions/generation.actions';
import { createListQueryKey } from '../shared/queryKeys';
import { GetGenerationsFilters } from '../shared/types';

const GENERATIONS_PER_PAGE = 20;

interface UseInfiniteGenerationsOptions {
  enabled?: boolean;
}

/**
 * Hook for infinite scrolling generations list with lazy loading support
 * Single responsibility: Infinite query for generations with pagination and conditional fetching
 */
export function useInfiniteGenerations(
  filters: Omit<GetGenerationsFilters, 'limit' | 'offset'> = {},
  options: UseInfiniteGenerationsOptions = {}
) {
  const { enabled = true } = options;
  
  // Memoize query key to prevent unnecessary cache invalidations
  const queryKey = useMemo(() => [...createListQueryKey(filters), 'infinite'], [filters]);
  
  // Memoized query function
  const queryFn = useCallback(async ({ pageParam = 0 }): Promise<GenerationDto[]> => {
    const result = await getGenerations({
      ...filters,
      limit: GENERATIONS_PER_PAGE,
      offset: pageParam * GENERATIONS_PER_PAGE,
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch generations');
    }

    return result.data;
  }, [filters]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn,
    enabled, // Only fetch when enabled (allows lazy loading)
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the page size, there are no more pages
      if (lastPage.length < GENERATIONS_PER_PAGE) {
        return undefined;
      }
      // Return the next page number
      return allPages.length;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent unnecessary refetches on mount
    refetchOnReconnect: true,
    networkMode: 'online',
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Flatten all pages into a single array
  const generations = useMemo(() => {
    if (!query.data?.pages) return [];
    
    const allGenerations = query.data.pages.flat();
    
    // Sort by creation date (newest first) and remove duplicates
    const uniqueGenerations = allGenerations.reduce((acc, generation) => {
      if (!acc.find(g => g.id === generation.id)) {
        acc.push(generation);
      }
      return acc;
    }, [] as GenerationDto[]);
    
    return uniqueGenerations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [query.data?.pages]);

  return {
    generations,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
} 