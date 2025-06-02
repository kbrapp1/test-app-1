import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GenerationDto } from '../../../application/dto';
import { saveGenerationToDAM } from '../../../application/actions/generation.actions';
import { IMAGE_GENERATION_QUERY_KEYS, createStatsQueryKey } from '../shared/queryKeys';

/**
 * Hook to save a generation to DAM
 * Single responsibility: DAM saving mutation with cache updates
 */
export function useSaveGenerationToDAM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<GenerationDto> => {
      const result = await saveGenerationToDAM(id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save generation to DAM');
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