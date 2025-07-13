/**
 * TTS Mutations Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - React Query mutations for TTS CRUD operations with optimistic updates
 * - Intelligent cache management and error handling
 * - Organization-aware caching with proper cache keys
 * - Coordinate with existing TTS history and generation hooks
 * - Follow @golden-rule patterns exactly
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { startSpeechGeneration, saveTtsAudioToDam, markTtsUrlProblematic } from '../actions/tts';
import { TtsPredictionDisplayDto } from '../../application/dto/TtsPredictionDto';

export interface TtsGenerationRequest {
  inputText: string;
  voiceId: string;
  provider: string;
}

export interface TtsSaveRequest {
  audioUrl: string;
  assetName: string;
  predictionId: string;
  linkToPrediction?: boolean;
}

/**
 * React Query mutation for starting TTS generation with optimistic updates
 */
export function useStartGenerationMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: TtsGenerationRequest) => {
      if (!organizationId) {
        throw new Error('Organization context required');
      }
      
      const result = await startSpeechGeneration(
        request.inputText, 
        request.voiceId, 
        request.provider
      );
      
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Failed to start generation';
        throw new Error(errorMessage);
      }
      
      return result;
    },
    onMutate: async (request) => {
      // Cancel any outgoing refetches for generation result
      await queryClient.cancelQueries({ queryKey: ['tts-generation-result'] });
      
      // Return context for rollback
      return { request };
    },
    onError: (error, request, context) => {
      console.error('TTS generation failed:', error);
    },
    onSuccess: (result, request) => {
      // Invalidate history to show new generation in progress
      queryClient.invalidateQueries({ queryKey: ['tts-history', organizationId] });
    }
  });
}

/**
 * React Query mutation for saving TTS audio to DAM with optimistic updates
 */
export function useSaveToDamMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: TtsSaveRequest) => {
      if (!organizationId) {
        throw new Error('Organization context required');
      }
      
      const result = await saveTtsAudioToDam(
        request.audioUrl,
        request.assetName,
        request.predictionId,
        request.linkToPrediction ?? true
      );
      
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Failed to save to DAM';
        throw new Error(errorMessage);
      }
      
      return result;
    },
    onMutate: async (request) => {
      // Optimistic update - mark item as being saved
      const historyQueryKey = ['tts-history', organizationId];
      await queryClient.cancelQueries({ queryKey: historyQueryKey });
      
      const previousHistory = queryClient.getQueryData(historyQueryKey);
      
      // Update history item to show saving state
      queryClient.setQueryData(historyQueryKey, (old: any) => {
        if (old?.success && old.data) {
          return {
            ...old,
            data: old.data.map((item: TtsPredictionDisplayDto) => 
              item.id === request.predictionId
                ? { ...item, isSavingToDam: true }
                : item
            )
          };
        }
        return old;
      });
      
      return { previousHistory };
    },
    onError: (error, request, context) => {
      // Rollback optimistic update
      if (context?.previousHistory) {
        const historyQueryKey = ['tts-history', organizationId];
        queryClient.setQueryData(historyQueryKey, context.previousHistory);
      }
      console.error('Save to DAM failed:', error);
    },
    onSuccess: (result, request) => {
      // Update history to reflect successful save
      const historyQueryKey = ['tts-history', organizationId];
      queryClient.setQueryData(historyQueryKey, (old: any) => {
        if (old?.success && old.data) {
          return {
            ...old,
            data: old.data.map((item: TtsPredictionDisplayDto) => 
              item.id === request.predictionId
                ? { 
                    ...item, 
                    isSavingToDam: false,
                    savedToDamAssetId: result.assetId,
                    savedToDamAt: new Date().toISOString()
                  }
                : item
            )
          };
        }
        return old;
      });
      
      // Also invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: historyQueryKey });
    }
  });
}

/**
 * React Query mutation for marking TTS URLs as problematic with optimistic updates
 */
export function useMarkProblematicMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ predictionId, errorMessage }: { predictionId: string; errorMessage: string }) => {
      if (!organizationId) {
        throw new Error('Organization context required');
      }
      
      const result = await markTtsUrlProblematic(predictionId, errorMessage);
      
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Failed to mark URL as problematic';
        throw new Error(errorMessage);
      }
      
      return result;
    },
    onMutate: async ({ predictionId, errorMessage }) => {
      // Optimistic update - mark item as problematic immediately
      const historyQueryKey = ['tts-history', organizationId];
      await queryClient.cancelQueries({ queryKey: historyQueryKey });
      
      const previousHistory = queryClient.getQueryData(historyQueryKey);
      
      queryClient.setQueryData(historyQueryKey, (old: any) => {
        if (old?.success && old.data) {
          return {
            ...old,
            data: old.data.map((item: TtsPredictionDisplayDto) => 
              item.id === predictionId
                ? { 
                    ...item, 
                    isOutputUrlProblematic: true,
                    outputUrlLastError: errorMessage
                  }
                : item
            )
          };
        }
        return old;
      });
      
      return { previousHistory };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousHistory) {
        const historyQueryKey = ['tts-history', organizationId];
        queryClient.setQueryData(historyQueryKey, context.previousHistory);
      }
      console.error('Mark problematic failed:', error);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tts-history', organizationId] });
    }
  });
}

/**
 * React Query mutation for deleting TTS predictions with optimistic updates
 */
export function useDeletePredictionMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (predictionId: string) => {
      if (!organizationId) {
        throw new Error('Organization context required');
      }
      
      // Note: This would need a deleteTtsPrediction server action to be implemented
      // For now, throwing an error to indicate it's not implemented
      throw new Error('Delete functionality not yet implemented');
    },
    onMutate: async (predictionId) => {
      // Optimistic update - remove item immediately
      const historyQueryKey = ['tts-history', organizationId];
      await queryClient.cancelQueries({ queryKey: historyQueryKey });
      
      const previousHistory = queryClient.getQueryData(historyQueryKey);
      
      queryClient.setQueryData(historyQueryKey, (old: any) => {
        if (old?.success && old.data) {
          return {
            ...old,
            data: old.data.filter((item: TtsPredictionDisplayDto) => item.id !== predictionId)
          };
        }
        return old;
      });
      
      return { previousHistory };
    },
    onError: (error, predictionId, context) => {
      // Rollback optimistic update
      if (context?.previousHistory) {
        const historyQueryKey = ['tts-history', organizationId];
        queryClient.setQueryData(historyQueryKey, context.previousHistory);
      }
      console.error('Delete prediction failed:', error);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tts-history', organizationId] });
    }
  });
} 