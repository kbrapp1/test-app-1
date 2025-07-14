/**
 * TTS Operations Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - UNIFIED OPERATIONS: Combines all TTS operations in one convenient hook
 * - Works with unified context for security + React Query for data management
 * - Provides consistent interface for all TTS CRUD operations
 * - Intelligent cache coordination between history, generation, and mutations
 * - Follow @golden-rule patterns exactly
 */

import { useCallback } from 'react';
import { useTtsHistory } from './useTtsHistory';
import { useTtsGeneration } from './useTtsGeneration';
import { 
  useStartGenerationMutation, 
  useSaveToDamMutation, 
  useMarkProblematicMutation,
  useDeletePredictionMutation,
  type TtsGenerationRequest,
  type TtsSaveRequest
} from './useTtsMutations';
import { TtsPredictionDisplayDto } from '../../application/dto/TtsPredictionDto';
import { useQueryClient } from '@tanstack/react-query';

export interface UseTtsOperationsProps {
  organizationId: string | null;
  isHistoryOpen?: boolean;
  headlessPlayerError?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  shouldRefreshHistory?: boolean;
  onRefreshComplete?: () => void;
  onGenerationComplete?: () => void;
}

/**
 * Unified hook that provides all TTS operations in one place
 * Combines: history management, generation, mutations with optimistic updates
 */
export function useTtsOperations({
  organizationId,
  isHistoryOpen = false,
  headlessPlayerError,
  headlessPlayerCurrentlyPlayingUrl,
  shouldRefreshHistory = false,
  onRefreshComplete,
  onGenerationComplete
}: UseTtsOperationsProps) {
  
  const _queryClient = useQueryClient();
  
  // React Query mutations for CRUD operations
  const startGenerationMutation = useStartGenerationMutation(organizationId);
  const saveToDamMutation = useSaveToDamMutation(organizationId);
  const markProblematicMutation = useMarkProblematicMutation(organizationId);
  const deletePredictionMutation = useDeletePredictionMutation(organizationId);
  
  // TTS Generation with React Query polling
  const {
    isGenerating,
    predictionStatus,
    audioUrl,
    ttsErrorMessage,
    ttsPredictionDbId,
    startGeneration: startGenerationDirect,
    resetTtsState,
    loadPrediction
  } = useTtsGeneration({ onGenerationComplete });
  
  // TTS History with React Query
  const {
    historyItems,
    isLoading: isHistoryLoading,
    error: historyError,
    searchQuery,
    setSearchQuery,
    clearSearch,
    handleLoadMore,
    allItemsLoaded,
    isLoadingMore,
    isSearching
  } = useTtsHistory({
    isOpen: isHistoryOpen,
    headlessPlayerError,
    headlessPlayerCurrentlyPlayingUrl,
    shouldRefresh: shouldRefreshHistory,
    onRefreshComplete,
    onSaveToDam: async (item: TtsPredictionDisplayDto) => {
      // Use React Query mutation instead of direct call
      if (!item.outputUrl) return false;
      
      try {
        await saveToDamMutation.mutateAsync({
          audioUrl: item.outputUrl,
          assetName: `${item.inputText?.substring(0, 30) || 'tts_audio'}_${Date.now()}`,
          predictionId: item.id,
          linkToPrediction: true
        });
        return true;
      } catch (error) {
        console.error('Save to DAM failed:', error);
        return false;
      }
    },
    onSaveAsToDam: async (item: TtsPredictionDisplayDto) => {
      // Use React Query mutation for save as
      if (!item.outputUrl) return false;
      
      try {
        await saveToDamMutation.mutateAsync({
          audioUrl: item.outputUrl,
          assetName: `${item.inputText?.substring(0, 30) || 'tts_audio'}_copy_${Date.now()}`,
          predictionId: item.id,
          linkToPrediction: false // Save As doesn't link to original
        });
        return true;
      } catch (error) {
        console.error('Save As to DAM failed:', error);
        return false;
      }
    }
  });
  
  // Unified operation wrappers with React Query mutations
  const startGeneration = useCallback(async (request: TtsGenerationRequest) => {
    try {
      const result = await startGenerationMutation.mutateAsync(request);
      
      // Also start the direct generation polling
      const formData = new FormData();
      formData.append('inputText', request.inputText);
      formData.append('voiceId', request.voiceId);
      formData.append('provider', request.provider);
      startGenerationDirect(formData);
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [startGenerationMutation, startGenerationDirect]);
  
  const saveToDam = useCallback(async (request: TtsSaveRequest) => {
    try {
      return await saveToDamMutation.mutateAsync(request);
    } catch (error) {
      throw error;
    }
  }, [saveToDamMutation]);
  
  const saveAudioToDam = useCallback(async (audioUrl: string, predictionId: string | null) => {
    if (!audioUrl || !predictionId) {
      throw new Error('Missing audio URL or prediction ID');
    }
    
    const assetName = `Generated Speech - ${new Date().toISOString().split('T')[0]}.mp3`;
    
    return await saveToDamMutation.mutateAsync({
      audioUrl,
      assetName,
      predictionId,
      linkToPrediction: true
    });
  }, [saveToDamMutation]);
  
  const markProblematic = useCallback(async (predictionId: string, errorMessage: string) => {
    try {
      return await markProblematicMutation.mutateAsync({ predictionId, errorMessage });
    } catch (error) {
      throw error;
    }
  }, [markProblematicMutation]);
  
  const deletePrediction = useCallback(async (predictionId: string) => {
    try {
      return await deletePredictionMutation.mutateAsync(predictionId);
    } catch (error) {
      throw error;
    }
  }, [deletePredictionMutation]);
  
  // Derived state combining all operations
  const isAnyLoading = isHistoryLoading || isGenerating || 
    startGenerationMutation.isPending || saveToDamMutation.isPending || 
    markProblematicMutation.isPending || deletePredictionMutation.isPending;
    
  const hasAnyError = historyError || ttsErrorMessage || 
    startGenerationMutation.error?.message || saveToDamMutation.error?.message ||
    markProblematicMutation.error?.message || deletePredictionMutation.error?.message;
  
  return {
    // History data
    historyItems,
    isHistoryLoading,
    historyError,
    searchQuery,
    setSearchQuery,
    clearSearch,
    handleLoadMore,
    allItemsLoaded,
    isLoadingMore,
    isSearching,
    
    // Generation data
    isGenerating,
    predictionStatus,
    audioUrl,
    ttsErrorMessage,
    ttsPredictionDbId,
    resetTtsState,
    loadPrediction,
    
    // Unified operations with React Query mutations
    startGeneration,
    saveToDam,
    saveAudioToDam,
    markProblematic,
    deletePrediction,
    
    // Mutation states
    isStartingGeneration: startGenerationMutation.isPending,
    isSavingToDam: saveToDamMutation.isPending,
    isMarkingProblematic: markProblematicMutation.isPending,
    isDeleting: deletePredictionMutation.isPending,
    
    // Unified states
    isAnyLoading,
    hasAnyError,
    
    // Individual mutation errors for specific handling
    generationError: startGenerationMutation.error?.message,
    saveError: saveToDamMutation.error?.message,
    markError: markProblematicMutation.error?.message,
    deleteError: deletePredictionMutation.error?.message,
  };
} 