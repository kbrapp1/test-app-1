import { useState, useEffect, useTransition, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult } from '../../application/actions/tts';
import { PredictionStatus } from '../../domain';

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
    // Use PredictionStatus domain logic for final state check
    if (predictionStatus) {
      try {
        const statusVO = new PredictionStatus(predictionStatus);
        if (statusVO.isFinal) {
          return;
        }
      } catch {
        // Invalid status, continue with polling
      }
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
      try {
        const result = await getSpeechGenerationResult(ttsPredictionDbId); 

        // Use PredictionStatus domain logic for failure detection
        const isFailure = (!result.success && result.error) || 
          ('status' in result && result.status && (() => {
            try {
              const statusVO = new PredictionStatus(result.status);
              return !statusVO.isSuccessful && statusVO.isFinal;
            } catch {
              return result.status === 'failed' || result.status === 'canceled';
            }
          })());
          
        if (isFailure) {
          setTtsErrorMessage(result.error || `Prediction status: ${'status' in result ? result.status || 'failed' : 'failed'}`);
          setCurrentPredictionId(null); 
          setIsPollingLoading(false);
          setPredictionStatus('status' in result ? result.status || 'failed' : 'failed'); // Ensure status reflects the failure
          clearInterval(intervalId); 
          return;
        }

        const currentStatus = 'status' in result ? result.status || 'failed' : 'failed';
        setPredictionStatus(currentStatus);

        // Use PredictionStatus domain logic for success check
        try {
          const statusVO = new PredictionStatus(currentStatus);
          if (statusVO.isSuccessful) {
            setAudioUrl('audioUrl' in result ? result.audioUrl ?? null : null);
            setCurrentPredictionId(null); 
            setIsPollingLoading(false);
            toast({ title: 'Speech generated successfully!' });
            if (onGenerationComplete) {
              onGenerationComplete();
            }
            clearInterval(intervalId); 
          } else {
            // For any other status (like 'processing', 'starting') that isn't a hard error, just log and continue.
          }
        } catch {
          // Fallback for invalid status
          if (currentStatus === 'succeeded') {
            setAudioUrl('audioUrl' in result ? result.audioUrl ?? null : null);
            setCurrentPredictionId(null); 
            setIsPollingLoading(false);
            toast({ title: 'Speech generated successfully!' });
            if (onGenerationComplete) {
              onGenerationComplete();
            }
            clearInterval(intervalId); 
          }
        }
      } catch (error: any) {
        setTtsErrorMessage(error.message || 'An error occurred during polling.');
        setCurrentPredictionId(null); 
        setIsPollingLoading(false);
        setPredictionStatus('failed');
        clearInterval(intervalId); 
      }
    }, 3000); 

    return () => {
      clearInterval(intervalId);
      setIsPollingLoading(false);
    };
  }, [currentPredictionId, predictionStatus, toast, onGenerationComplete, ttsPredictionDbId]); // REMOVED resetTtsState from deps

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
        setTtsErrorMessage(result.error || 'Failed to start generation.');
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