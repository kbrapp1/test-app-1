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
  const stableDataRef = useRef<GenerationDto | null>(null);

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

  // STABLE DATA LOGIC: Prevent UI flicker by ensuring consistent data
  // Priority: polled data > new completed data > stable ref > cached data
  let currentGeneration: GenerationDto | null = null;
  
  if (polledGeneration) {
    // Use fresh polled data
    currentGeneration = polledGeneration;
    stableDataRef.current = polledGeneration;
  } else if (latestGeneration?.status === 'completed' && latestGeneration.imageUrl) {
    // CRITICAL: Always use new completed data to ensure onImageComplete fires
    currentGeneration = latestGeneration;
    stableDataRef.current = latestGeneration;
  } else if (stableDataRef.current && stableDataRef.current.id === latestGenerationId) {
    // Use stable cached data for same generation to prevent flicker
    currentGeneration = stableDataRef.current;
  } else {
    // Fallback to list data and update stable ref
    currentGeneration = latestGeneration;
    if (latestGeneration) {
      stableDataRef.current = latestGeneration;
    }
  }
  
  const isLatestGenerating = currentGeneration && 
    ['pending', 'processing'].includes(currentGeneration.status);

  // Reset refs when generation changes
  useEffect(() => {
    if (latestGenerationId && (!stableDataRef.current || stableDataRef.current.id !== latestGenerationId)) {
      stableDataRef.current = latestGeneration;
      previousCompletedImageRef.current = null;
    }
  }, [latestGenerationId, latestGeneration]);

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