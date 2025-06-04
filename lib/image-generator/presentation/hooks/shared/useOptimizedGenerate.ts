import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GenerationDto } from '../../../application/dto';
import { useGenerateImage } from '../mutations/useGenerateImage';
import { IMAGE_GENERATION_QUERY_KEYS } from './queryKeys';

/**
 * Hook for optimized image generation with cache pre-loading
 * Single responsibility: Handle image generation with cache optimization
 */
export function useOptimizedGenerate() {
  const queryClient = useQueryClient();
  const generateImage = useGenerateImage();

  // Optimized generate function with cache pre-loading
  const optimizedGenerate = useCallback(async (
    prompt: string,
    width?: number,
    height?: number,
    safetyTolerance?: number,
    providerId?: string,
    modelId?: string,
    aspectRatio?: string,
    baseImageUrl?: string
  ) => {
    try {
      const result = await generateImage.mutateAsync({
        prompt,
        width,
        height,
        aspectRatio,
        safetyTolerance,
        providerId,
        modelId,
        baseImageUrl,
      });

      // Pre-load the generation details in cache
      queryClient.setQueryData(
        IMAGE_GENERATION_QUERY_KEYS.detail(result.id),
        result
      );

      // Invalidate the generations list to include the new generation
      queryClient.invalidateQueries({
        queryKey: IMAGE_GENERATION_QUERY_KEYS.list({}),
      });

      return result;
    } catch (error) {
      throw error;
    }
  }, [generateImage, queryClient]);

  return {
    generate: optimizedGenerate,
    isGenerating: generateImage.isPending,
    error: generateImage.error,
  };
} 