import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { GenerationDto } from '../../../application/dto';
import { checkGenerationStatus } from '../../../application/actions/generation.actions';
import { IMAGE_GENERATION_QUERY_KEYS } from '../shared/queryKeys';

/**
 * Hook for simple polling of generations with fixed intervals
 * Single responsibility: Real-time polling with 2s, 5s, 5s, 10s intervals, fail after 60s
 * Handles app restarts by using generation's actual creation time from database
 */
export function useGenerationPolling(generationId: string, enabled: boolean = true) {
  const previousStatusRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  // Simple interval calculation based on generation's actual age from database
  const getPollingInterval = useCallback((data: GenerationDto | undefined): number | false => {
    if (!data) return false;

    // CRITICAL: Stop polling completed generations
    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
      return false;
    }

    // Calculate actual age from generation's creation time (handles app restarts)
    const now = Date.now();
    const createdAt = new Date(data.createdAt).getTime();
    const elapsedSeconds = (now - createdAt) / 1000;

    // Simple polling strategy based on ACTUAL generation age:
    // 0-2s: Wait for first check
    // 2-7s: Check every 5 seconds (first 5s interval)
    // 7-12s: Check every 5 seconds (second 5s interval)  
    // 12s+: Check every 10 seconds
    // 60s+: Should be failed by server action

    if (elapsedSeconds < 2) {
      return Math.max(100, 2000 - (elapsedSeconds * 1000)); // Wait until 2 seconds (min 100ms)
    } else if (elapsedSeconds < 7) {
      return 5000; // 5 second intervals
    } else if (elapsedSeconds < 12) {
      return 5000; // 5 second intervals
    } else {
      return 10000; // 10 second intervals
    }
  }, []);

  const query = useQuery({
    queryKey: IMAGE_GENERATION_QUERY_KEYS.detail(generationId),
    queryFn: async (): Promise<GenerationDto> => {
      const result = await checkGenerationStatus(generationId);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch generation');
      }

      return result.data;
    },
    enabled: enabled && !!generationId,
    refetchInterval: (query) => getPollingInterval(query.state.data),
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Effect to handle status change notifications and cache invalidation
  useEffect(() => {
    const currentData = query.data;
    if (!currentData) return;

    const currentStatus = currentData.status;
    const previousStatus = previousStatusRef.current;

    // Only show notifications on status changes, not initial load
    if (previousStatus && previousStatus !== currentStatus) {
      // Invalidate list queries when status changes to keep UI in sync
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'image-generations' && query.queryKey[1] === 'list';
        },
      });

      // Status-specific notifications
      switch (currentStatus) {
        case 'completed':
          toast.success('Image Generated!', {
            description: `Your image "${currentData.prompt.slice(0, 50)}..." is ready!`,
            duration: 5000,
            action: currentData.imageUrl ? {
              label: 'View Image',
              onClick: () => window.open(currentData.imageUrl, '_blank')
            } : undefined,
          });
          break;
          
        case 'failed':
          toast.error('Generation Failed', {
            description: currentData.errorMessage || 'Image generation was unsuccessful. Please try again.',
            duration: 5000,
          });
          break;
          
        case 'cancelled':
          toast.info('Generation Cancelled', {
            description: 'Image generation was cancelled.',
            duration: 3000,
          });
          break;
          
        case 'processing':
          if (previousStatus === 'pending') {
            toast.loading('Generation in Progress', {
              description: 'Your image is now being generated. This typically takes 20-30 seconds...',
              duration: 4000,
            });
          }
          break;
      }
    }

    // Update the previous status reference
    previousStatusRef.current = currentStatus;
  }, [query.data, queryClient]);

  // Reset previous status when generationId changes
  useEffect(() => {
    if (generationId) {
      previousStatusRef.current = null;
    }
  }, [generationId]);

  return query;
} 