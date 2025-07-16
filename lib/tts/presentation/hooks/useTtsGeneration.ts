import { useState, useTransition, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult } from '../actions/tts';

// String-based status utility functions
const isStatusFinal = (status: string): boolean => {
  return status === 'completed' || 
         status === 'succeeded' || 
         status === 'failed' || 
         status === 'canceled';
};

const isStatusSuccessful = (status: string): boolean => {
  return status === 'completed' || status === 'succeeded';
};

interface UseTtsGenerationOptions {
  onGenerationComplete?: () => void;
}

export function useTtsGeneration(options?: UseTtsGenerationOptions) {
  const { onGenerationComplete } = options || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTtsPending, startTtsTransition] = useTransition();
  
  // State for tracking generation
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [ttsPredictionDbId, setTtsPredictionDbId] = useState<string | null>(null);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);
  
  // State for loaded predictions (from history)
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<string | null>(null);

  // React Query for polling generation result
  const {
    data: generationResult,
    isLoading: isPollingLoading,
    error: pollingError
  } = useQuery({
    queryKey: ['tts-generation-result', ttsPredictionDbId],
    queryFn: async () => {
      if (!ttsPredictionDbId) return null;
      
      const result = await getSpeechGenerationResult(ttsPredictionDbId);
      
      if (!result.success && result.error) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Generation failed';
        
        // Don't throw for "Record not found" - keep retrying
        if (errorMessage.includes('Record not found')) {
          return null; // Return null to continue polling
        }
        
        throw new Error(errorMessage);
      }
      
      return result;
    },
    enabled: !!ttsPredictionDbId && !!currentPredictionId, // Only poll when we have IDs
    refetchInterval: (data) => {
      // Stop polling if we have a final result
      if (data && 'status' in data && data.status) {
        const status = data.status as string;
        return isStatusFinal(status) ? false : 3000; // Poll every 3 seconds
      }
      return 3000; // Keep polling if no data yet
    },
    retry: (failureCount, error) => {
      // Keep retrying for "Record not found" errors
      if (error?.message?.includes('Record not found')) {
        return failureCount < 10; // Retry up to 10 times
      }
      return failureCount < 3; // Standard retry for other errors
    },
    staleTime: 2000, // Keep data fresh for 2 seconds to reduce flickering
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not loading states
  });

  // Handle generation completion
  const predictionStatus = loadedStatus || ((generationResult?.success && 'status' in generationResult) ? generationResult.status : null);
  const audioUrl = loadedAudioUrl || ((generationResult?.success && 'audioUrl' in generationResult) ? generationResult.audioUrl : null);

  // Effect to handle completion
  useEffect(() => {
    if (generationResult?.success && 'status' in generationResult && generationResult.status) {
      const status = generationResult.status;
      
      if (isStatusSuccessful(status)) {
        setCurrentPredictionId(null); // Stop polling
        setTtsErrorMessage(null);
        toast({ title: 'Speech generated successfully!' });
        onGenerationComplete?.();
      } else if (isStatusFinal(status) && !isStatusSuccessful(status)) {
        setCurrentPredictionId(null); // Stop polling
        const errorMessage = (generationResult.error && typeof generationResult.error === 'string') 
          ? generationResult.error 
          : `Generation failed with status: ${status}`;
        setTtsErrorMessage(errorMessage);
      }
    }
  }, [generationResult, toast, onGenerationComplete]);

  // Handle polling errors
  useEffect(() => {
    if (pollingError) {
      setCurrentPredictionId(null); // Stop polling
      setTtsErrorMessage(pollingError.message);
    }
  }, [pollingError]);

  // Reset state function
  const resetTtsState = useCallback(() => {
    setCurrentPredictionId(null);
    setTtsPredictionDbId(null);
    setTtsErrorMessage(null);
    setLoadedAudioUrl(null);
    setLoadedStatus(null);
    queryClient.removeQueries({ queryKey: ['tts-generation-result'] });
  }, [queryClient]);

  // Function to initiate TTS generation
  const startGeneration = useCallback((formData: FormData) => {
    resetTtsState(); // Reset previous state

    const inputText = formData.get('inputText') as string;
    const voiceId = formData.get('voiceId') as string;
    const provider = formData.get('provider') as string;

    if (!inputText || !voiceId || !provider) {
      setTtsErrorMessage('Missing input text, voice ID, or provider for speech generation.');
      return;
    }

    startTtsTransition(async () => {
      try {
        const result = await startSpeechGeneration(inputText, voiceId, provider);

        if (result.success && 'predictionId' in result && 'ttsPredictionDbId' in result && 
            result.predictionId && result.ttsPredictionDbId) {
          // Set both IDs to start polling
          setTtsPredictionDbId(result.ttsPredictionDbId);
          setCurrentPredictionId(result.predictionId);
        } else {
          const errorMessage = typeof result.error === 'string' 
            ? result.error 
            : result.error?.message || 'Failed to start generation.';
          setTtsErrorMessage(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start generation.';
        setTtsErrorMessage(errorMessage);
      }
    });
  }, [resetTtsState, startTtsTransition]);

  // Load existing prediction
  const loadPrediction = useCallback((data: {
    audioUrl: string | null;
    dbId: string | null;
    status?: string | null;
  }) => {
    resetTtsState();
    setTtsPredictionDbId(data.dbId);
    setLoadedAudioUrl(data.audioUrl);
    setLoadedStatus(data.status || null);
    // Don't set currentPredictionId to avoid polling for already completed predictions
  }, [resetTtsState]);

  // More stable loading state - only show loading for initial generation or actual pending states
  const isGenerating = isTtsPending || (isPollingLoading && !generationResult);

  return {
    isGenerating,
    predictionStatus,
    audioUrl,
    ttsErrorMessage,
    ttsPredictionDbId,
    startGeneration,
    resetTtsState,
    loadPrediction,
  };
} 