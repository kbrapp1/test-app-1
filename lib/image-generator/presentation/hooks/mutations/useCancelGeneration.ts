import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GenerationDto } from '../../../application/dto';
import { cancelGeneration } from '../../../application/actions/generation.actions';
import { IMAGE_GENERATION_QUERY_KEYS, createStatsQueryKey } from '../shared/queryKeys';

/**
 * Hook to cancel a generation
 * Single responsibility: Generation cancellation mutation with cache updates
 */
export function useCancelGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<GenerationDto> => {
      const result = await cancelGeneration(id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to cancel generation');
      }

      return result.data;
    },
    onSuccess: (generation) => {
      // Update detail cache
      queryClient.setQueryData(
        IMAGE_GENERATION_QUERY_KEYS.detail(generation.id),
        generation
      );

      // Update list cache
      queryClient.setQueryData(
        IMAGE_GENERATION_QUERY_KEYS.list({}),
        (old: GenerationDto[] | undefined) => {
          return old?.map(g => 
            g.id === generation.id ? generation : g
          );
        }
      );

      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: createStatsQueryKey()
      });
    }
  });
} 