import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { GenerationDto } from '../../../application/dto';
import { generateImage, GenerateImageRequest } from '../../../application/actions/generation.actions';
import { createListQueryKey, createDetailQueryKey, createStatsQueryKey } from '../shared/queryKeys';

/**
 * Hook to generate a new image
 * Single responsibility: Image generation mutation with cache updates
 */
export function useGenerateImage() {
  const queryClient = useQueryClient();

  // Memoized mutation function to prevent unnecessary re-renders
  const mutationFn = useCallback(async (request: GenerateImageRequest): Promise<GenerationDto> => {
    const result = await generateImage(request);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate image');
    }

    return result.data;
  }, []);

  // Memoized success handler
  const onSuccess = useCallback((generation: GenerationDto) => {
    // Add to the list cache
    queryClient.setQueryData(
      createListQueryKey({}),
      (old: GenerationDto[] | undefined) => {
        return old ? [generation, ...old] : [generation];
      }
    );

    // Add to detail cache
    queryClient.setQueryData(
      createDetailQueryKey(generation.id),
      generation
    );

    // Invalidate stats
    queryClient.invalidateQueries({
      queryKey: createStatsQueryKey()
    });

    // Show initial toast only - completion toast will be handled by polling hook
    toast.info('Generation Queued', {
      description: 'Your image generation has been queued. Processing will begin shortly...',
      duration: 3000,
    });
  }, [queryClient]);

  // Memoized error handler
  const onError = useCallback((error: Error) => {
    console.error('Failed to generate image:', error);
    
    // Show error toast
    toast.error('Generation Failed', {
      description: error.message || 'Unable to start image generation. Please try again.',
      duration: 5000,
    });
  }, []);

  return useMutation({
    mutationFn,
    onSuccess,
    onError,
  });
} 