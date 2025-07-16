import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGenerations } from '../../../application/actions/generation.actions';
import { createListQueryKey } from '../shared/queryKeys';
import { GetGenerationsFilters } from '../shared/types';
import { withInfiniteQueryDefaults } from '../shared/queryConfig';

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
  
  // Simple query key for infinite generations
  const queryKey = useMemo(() => [...createListQueryKey(filters), 'infinite'], [filters]);
  
  // Simple query function with standard pagination
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

  const query = useInfiniteQuery<GenerationDto[], unknown, InfiniteData<GenerationDto[]>, typeof queryKey, number>(
    withInfiniteQueryDefaults({
      queryKey,
      queryFn,
      enabled,
      initialPageParam: 0,
      getNextPageParam: (lastPage: GenerationDto[], allPages: GenerationDto[][]) => {
        const hasMore = lastPage.length === GENERATIONS_PER_PAGE;
        return hasMore ? allPages.length : undefined;
      }
    })
  );

  // Flatten all pages into a single array with stable reference
  const generations = useMemo(() => {
    if (!query.data?.pages) return [];
    
    const allGenerations = query.data.pages.flat();
    
    // Sort by creation date (newest first) and remove duplicates
    const uniqueGenerations = allGenerations.reduce(
      (acc: GenerationDto[], generation: GenerationDto): GenerationDto[] => {
        if (!acc.find((g: GenerationDto) => g.id === generation.id)) {
          acc.push(generation);
        }
        return acc;
      },
      [] as GenerationDto[]
    );
    
    const sorted = uniqueGenerations.sort((a: GenerationDto, b: GenerationDto) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Return stable reference if content hasn't actually changed
    return sorted;
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