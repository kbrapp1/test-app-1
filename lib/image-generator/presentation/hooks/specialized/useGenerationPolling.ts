import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { GenerationDto } from '../../../application/dto';
import { checkGenerationStatus } from '../../../application/actions/generation.actions';
import { IMAGE_GENERATION_QUERY_KEYS } from '../shared/queryKeys';

/**
 * Hook for intelligent polling of generations with network/focus awareness
 * Single responsibility: Real-time polling with adaptive intervals and smart pause/resume
 * Handles app restarts, network issues, and background tab optimization
 */
export function useGenerationPolling(generationId: string, enabled: boolean = true) {
  const previousStatusRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  // Enhanced interval calculation with network and focus awareness
  const getPollingInterval = useCallback((query: any): number | false => {
    const data = query.state.data as GenerationDto | undefined;
    
    if (!data) return false;

    // CRITICAL: Stop polling completed generations
    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
      return false;
    }

    // Stop polling if offline
    if (!navigator.onLine) {
      return false;
    }

    // Reduce polling frequency when tab is hidden/inactive
    if (document.hidden) {
      return 30000; // 30 seconds when tab inactive
    }

    // Stop polling on errors to prevent cascading failures
    if (query.state.error) {
      return false;
    }

    // Calculate actual age from generation's creation time (handles app restarts)
    const now = Date.now();
    const createdAt = new Date(data.createdAt).getTime();
    const elapsedSeconds = (now - createdAt) / 1000;

    // HARD STOP: Stop polling after 60 seconds - generation is likely stuck
    if (elapsedSeconds > 60) {
      console.warn(`Generation ${generationId} has been polling for ${Math.round(elapsedSeconds)}s - stopping polling`);
      return false; // ❌ ABSOLUTE HARD STOP after 60 seconds
    }

    // Enhanced polling strategy based on ACTUAL generation age:
    // 0-2s: Wait for first check
    // 2-7s: Check every 3 seconds (faster initial polling)
    // 7-12s: Check every 5 seconds
    // 12-30s: Check every 8 seconds
    // 30s+: Check every 15 seconds (likely stuck, slower polling)
    // 60s+: HARD STOP (should never reach here due to above check)

    if (elapsedSeconds < 2) {
      return Math.max(100, 2000 - (elapsedSeconds * 1000)); // Wait until 2 seconds (min 100ms)
    } else if (elapsedSeconds < 7) {
      return 3000; // 3 second intervals for early stage
    } else if (elapsedSeconds < 12) {
      return 5000; // 5 second intervals
    } else if (elapsedSeconds < 30) {
      return 8000; // 8 second intervals
    } else {
      return 15000; // 15 second intervals for likely stuck generations
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
    refetchInterval: getPollingInterval,
    refetchIntervalInBackground: false, // No background polling
    staleTime: 5000, // Increase stale time to reduce aggressive refetching and prevent interruptions
    refetchOnWindowFocus: 'always', // Check on focus return
    refetchOnMount: true,
    refetchOnReconnect: true, // Resume polling on network reconnect
    networkMode: 'online', // Only fetch when online
    // CRITICAL: Prevent query interruptions during loading states
    notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not loading states
    retry: (failureCount, error) => {
      // Stop retrying after 3 failures to prevent spam
      if (failureCount >= 3) return false;
      
      // Don't retry on 404 (generation not found)
      if (error?.message?.includes('404')) return false;
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Effect to handle status change notifications and cache invalidation
  useEffect(() => {
    const currentData = query.data;
    if (!currentData) return;

    const currentStatus = currentData.status;
    const previousStatus = previousStatusRef.current;

    // Only show notifications on status changes, not initial load
    if (previousStatus && previousStatus !== currentStatus) {
      // Minimize cache invalidations during generation to prevent UI interruption
      // Only invalidate on completion to keep final UI state consistent
      if (currentStatus === 'completed') {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'image-generations' && query.queryKey[1] === 'list';
          },
        });
      }

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

        case 'pending':
          // Show subtle pending notification (only once when status changes)
          if (previousStatus !== 'pending') {
            toast.info('Generation Queued', {
              description: 'Your image has been added to the processing queue.',
              duration: 2000,
            });
          }
          break;
          
        case 'processing':
          // Show subtle processing notification (only once when status changes)
          if (previousStatus !== 'processing') {
            toast.info('Generation Started', {
              description: 'Your image is now being generated...',
              duration: 2000,
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

  // Enhanced error recovery: Resume polling when network comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (query.data && 
          (query.data.status === 'pending' || query.data.status === 'processing') && 
          !query.isFetching) {
        queryClient.invalidateQueries({
          queryKey: IMAGE_GENERATION_QUERY_KEYS.detail(generationId)
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [generationId, query.data, query.isFetching, queryClient]);

  // Enhanced visibility change handling: Resume polling when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && 
          query.data && 
          (query.data.status === 'pending' || query.data.status === 'processing') && 
          !query.isFetching) {
        queryClient.invalidateQueries({
          queryKey: IMAGE_GENERATION_QUERY_KEYS.detail(generationId)
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [generationId, query.data, query.isFetching, queryClient]);

  return query;
} 