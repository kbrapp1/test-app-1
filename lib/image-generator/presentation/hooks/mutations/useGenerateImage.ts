import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { GenerationDto } from '../../../application/dto';
import { generateImage, GenerateImageRequest } from '../../../application/actions/generation.actions';
import { createListQueryKey, createDetailQueryKey, createStatsQueryKey } from '../shared/queryKeys';
import { prependGenerationToPages, InfiniteData } from './utils/prependGenerationToPages';

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
    // Add to detail cache
    queryClient.setQueryData(
      createDetailQueryKey(generation.id),
      generation
    );

    // Optimistically update the infinite generations cache
    const infiniteQueryKey = [...createListQueryKey({}), 'infinite'];
    queryClient.setQueryData<InfiniteData>(infiniteQueryKey, (oldData) => {
      const PAGE_SIZE = 20;
      return prependGenerationToPages(oldData, generation, PAGE_SIZE);
    });

    // Invalidate stats
    queryClient.invalidateQueries({
      queryKey: createStatsQueryKey()
    });

    // Show initial generation queued toast
    toast.success('Generation Started!', {
      description: `Your image "${generation.prompt.slice(0, 50)}..." is being processed.`,
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