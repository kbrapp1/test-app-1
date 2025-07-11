import { useState, useEffect, useTransition, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult } from '../actions/tts';

// String-based status utility functions (replacing domain object usage)
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
  const [isTtsPending, startTtsTransition] = useTransition();
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);
  const [ttsPredictionDbId, setTtsPredictionDbId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Reset state function
  const resetTtsState = useCallback(() => {
    setIsPollingLoading(false);
    setCurrentPredictionId(null); // Ensure polling stops
    setPredictionStatus(null);
    setAudioUrl(null);
    setTtsErrorMessage(null);
    setTtsPredictionDbId(null);
  }, []);

  // Effect for polling the prediction status
  useEffect(() => {
    if (!currentPredictionId) {
      return;
    }
    if (!ttsPredictionDbId) {
      return;
    }
    // Use string-based status check for final state
    if (predictionStatus && isStatusFinal(predictionStatus)) {
      return;
    }

    setIsPollingLoading(true);
    // If status is not final and not already 'processing', set to 'processing' to reflect polling activity.
    // Avoids resetting from 'starting' if it's the very first poll setup.
    if (predictionStatus !== 'processing' && predictionStatus !== 'starting') {
        setPredictionStatus('processing'); 
    } else if (!predictionStatus) { // If status is null (e.g. after reset and new ID set)
        setPredictionStatus('processing');
    }

    const intervalId = setInterval(async () => {
      setPollCount(prev => prev + 1);
      try {
        const result = await getSpeechGenerationResult(ttsPredictionDbId); 

        // Reset poll count on successful fetch
        setPollCount(0);

        // Use string-based status checks for failure detection
        const resultStatus = 'status' in result ? result.status || 'failed' : 'failed';
        const isFailure = (!result.success && result.error) || 
          ('status' in result && result.status && (
            !isStatusSuccessful(resultStatus) && isStatusFinal(resultStatus)
          ));
          
        if (isFailure) {
          const errorMessage = typeof result.error === 'string' 
            ? result.error 
            : result.error?.message || `Prediction status: ${resultStatus}`;
          // Special handling for 'Record not found' to retry
          if (errorMessage.includes('Record not found') && pollCount < 3) {
            return; // Continue polling
          }
          setTtsErrorMessage(errorMessage);
          setCurrentPredictionId(null); 
          setIsPollingLoading(false);
          setPredictionStatus(resultStatus);
          clearInterval(intervalId); 
          return;
        }

        const currentStatus = resultStatus;
        setPredictionStatus(currentStatus);

        // Use string-based status check for success
        if (isStatusSuccessful(currentStatus)) {
          setAudioUrl('audioUrl' in result ? result.audioUrl ?? null : null);
          setCurrentPredictionId(null); 
          setIsPollingLoading(false);
          toast({ title: 'Speech generated successfully!' });
          if (onGenerationComplete) {
            onGenerationComplete();
          }
          clearInterval(intervalId); 
        }
        // For any other status (like 'processing', 'starting') that isn't a hard error, just continue polling.
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during polling.';
        setTtsErrorMessage(errorMessage);
        setCurrentPredictionId(null); 
        setIsPollingLoading(false);
        setPredictionStatus('failed');
        clearInterval(intervalId); 
      }
    }, 3000); 

    return () => {
      clearInterval(intervalId);
      setIsPollingLoading(false);
      setPollCount(0);
    };
  }, [currentPredictionId, predictionStatus, toast, onGenerationComplete, ttsPredictionDbId, pollCount]); // REMOVED resetTtsState from deps

  // Function to initiate the TTS generation
  const startGeneration = useCallback((formData: FormData) => {
    resetTtsState(); // Reset previous state before starting
    setPredictionStatus('starting');

    const inputText = formData.get('inputText') as string;
    const voiceId = formData.get('voiceId') as string;
    const provider = formData.get('provider') as string;

    if (!inputText || !voiceId || !provider) {
      setTtsErrorMessage('Missing input text, voice ID, or provider for speech generation.');
      setPredictionStatus('failed');
      return;
    }

    startTtsTransition(async () => {
      const result = await startSpeechGeneration(inputText, voiceId, provider);

      if (result.success && 'predictionId' in result && 'ttsPredictionDbId' in result && result.predictionId && result.ttsPredictionDbId) {
        // Important: Set DB ID first, then Replicate ID to trigger polling effect correctly
        setTtsPredictionDbId(result.ttsPredictionDbId); 
        setCurrentPredictionId(result.predictionId);
      } else {
        // AI: Extract error message from domain error object or use string
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Failed to start generation.';
        setTtsErrorMessage(errorMessage);
        setPredictionStatus('failed');
        // Ensure currentPredictionId and ttsPredictionDbId are null if start failed
        setCurrentPredictionId(null);
        setTtsPredictionDbId(null);
      }
    });
  }, [resetTtsState, startTtsTransition]); // Removed setTtsErrorMessage from deps as it's a setter

  const isGenerating = isTtsPending || isPollingLoading;

  const loadPrediction = useCallback((data: {
    audioUrl: string | null;
    dbId: string | null;
    status?: string | null;
  }) => {
    resetTtsState(); // Reset state before loading an existing prediction
    setAudioUrl(data.audioUrl); 
    setTtsPredictionDbId(data.dbId);
    setPredictionStatus(data.status || (data.audioUrl ? 'succeeded' : null));
    setTtsErrorMessage(null); 
    // Ensure polling doesn't start for already loaded predictions
    setCurrentPredictionId(null); 
    setIsPollingLoading(false);
  }, [resetTtsState]); // resetTtsState is a dependency

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