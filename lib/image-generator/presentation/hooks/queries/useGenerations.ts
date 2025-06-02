import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGenerations } from '../../../application/actions/generation.actions';
import { createListQueryKey } from '../shared/queryKeys';
import { GetGenerationsFilters } from '../shared/types';

/**
 * Hook to get a list of generations
 * Single responsibility: Querying multiple generations with filters
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
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
} 