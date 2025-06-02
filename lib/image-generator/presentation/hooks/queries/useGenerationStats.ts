import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationStatsDto } from '../../../application/dto';
import { getGenerationStats } from '../../../application/actions/generation.actions';
import { createStatsQueryKey } from '../shared/queryKeys';

/**
 * Hook to get generation statistics
 * Single responsibility: Querying generation statistics
 */
export function useGenerationStats() {
  const queryKey = useMemo(() => createStatsQueryKey(), []);
  
  const queryFn = useCallback(async (): Promise<GenerationStatsDto> => {
    const result = await getGenerationStats();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch generation stats');
    }

    return result.data;
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
} 