import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { GenerationDto } from '../../../application/dto';
import { getGeneration } from '../../../application/actions/generation.actions';
import { createDetailQueryKey } from '../shared/queryKeys';

/**
 * Hook to get a specific generation by ID
 * Single responsibility: Querying single generation by ID
 */
export function useGeneration(id: string) {
  // Memoize query key to prevent unnecessary cache invalidations
  const queryKey = useMemo(() => createDetailQueryKey(id), [id]);
  
  // Memoized query function to prevent recreating on every render
  const queryFn = useCallback(async (): Promise<GenerationDto> => {
    const result = await getGeneration(id);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch generation');
    }

    return result.data;
  }, [id]);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 