import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGenerations } from '../../../application/actions/generation.actions';
import { createListQueryKey } from '../shared/queryKeys';

/**
 * Hook for server-side generation search
 * Single responsibility: Search generations across entire database with server-side filtering
 */
export function useGenerationSearch(searchTerm: string, enabled: boolean = true) {
  // Memoize query key to prevent unnecessary cache invalidations
  const queryKey = useMemo(() => [
    ...createListQueryKey({ searchTerm }), 
    'search'
  ], [searchTerm]);
  
  // Memoized query function
  const queryFn = useCallback(async (): Promise<GenerationDto[]> => {
    const result = await getGenerations({
      searchTerm,
      limit: 100, // Limit search results to prevent overwhelming UI
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to search generations');
    }

    return result.data;
  }, [searchTerm]);

  return useQuery({
    queryKey,
    queryFn,
    enabled: enabled && !!searchTerm.trim(),
    staleTime: 60 * 1000, // 1 minute for search results
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount for search
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
} 