import { useEffect, useRef } from 'react';
import { GenerationDto } from '../../application/dto';
import { useGenerationPolling } from './specialized/useGenerationPolling';

export interface UseLatestGenerationProps {
  generations: GenerationDto[];
  onImageComplete?: (imageUrl: string) => void;
}

export interface UseLatestGenerationReturn {
  latestGeneration: GenerationDto | null;
  isLatestGenerating: boolean;
}

/**
 * Hook for monitoring the latest generation and handling completion events
 * Single responsibility: Track latest generation status and notify on completion
 */
export const useLatestGeneration = ({ 
  generations, 
  onImageComplete 
}: UseLatestGenerationProps): UseLatestGenerationReturn => {
  const previousCompletedImageRef = useRef<string | null>(null);

  // Get the most recent generation
  const latestGeneration = generations[0] || null;
  const latestGenerationId = latestGeneration?.id;
  
  // Only poll if the latest generation is active
  const shouldPoll = latestGeneration && 
    ['pending', 'processing'].includes(latestGeneration.status);

  // Poll the latest generation for updates
  const { data: polledGeneration } = useGenerationPolling(
    latestGenerationId || '',
    !!shouldPoll
  );

  // Use polled data if available and has more recent data, otherwise use cached data
  const currentGeneration = polledGeneration || latestGeneration;
  
  const isLatestGenerating = currentGeneration && 
    ['pending', 'processing'].includes(currentGeneration.status);

  // Reset ref when a new generation starts to prevent stale state
  useEffect(() => {
    if (currentGeneration && ['pending', 'processing'].includes(currentGeneration.status)) {
      previousCompletedImageRef.current = null;
    }
  }, [currentGeneration?.id]);

  // Handle completion callback
  useEffect(() => {
    if (!currentGeneration || !onImageComplete) return;

    const { status, imageUrl } = currentGeneration;
    
    // If generation just completed and we have a new image
    if (status === 'completed' && imageUrl && 
        imageUrl !== previousCompletedImageRef.current) {
      
      previousCompletedImageRef.current = imageUrl;
      onImageComplete(imageUrl);
    }
  }, [currentGeneration, onImageComplete]);

  return {
    latestGeneration: currentGeneration,
    isLatestGenerating: !!isLatestGenerating,
  };
}; 