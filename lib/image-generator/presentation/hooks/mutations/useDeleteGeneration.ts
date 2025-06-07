import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteGeneration } from '../../../application/actions/generation.actions';
import { IMAGE_GENERATION_QUERY_KEYS, createStatsQueryKey } from '../shared/queryKeys';
import { GenerationDto } from '../../../application/dto';

/**
 * Hook to delete a generation
 * Single responsibility: Generation deletion mutation with cache updates and user feedback
 */
export function useDeleteGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const result = await deleteGeneration(id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete generation');
      }

      return true;
    },
    onSuccess: (_, generationId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: IMAGE_GENERATION_QUERY_KEYS.detail(generationId)
      });

      // Update list cache - remove the deleted generation
      queryClient.setQueryData(
        IMAGE_GENERATION_QUERY_KEYS.list({}),
        (old: GenerationDto[] | undefined) => {
          return old?.filter(g => g.id !== generationId) || [];
        }
      );

      // Invalidate stats to reflect the deletion
      queryClient.invalidateQueries({
        queryKey: createStatsQueryKey()
      });

      // Invalidate all list queries to ensure consistency
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'image-generations' && 
                 query.queryKey[1] === 'list'; // This covers both regular and infinite lists
        },
      });

      // Show success toast
      toast.success('Generation deleted successfully', {
        description: 'The image generation has been removed from your history.'
      });
    },
    onError: (error) => {
      // Show error toast
      toast.error('Failed to delete generation', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the generation.'
      });
    }
  });
} 