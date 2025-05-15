import { useState, useEffect, useTransition, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult } from '@/lib/actions/tts';

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
    // startSpeechGenerationMutation.reset(); // Not applicable here
    // getSpeechGenerationResultMutation.reset(); // Not applicable here
    setIsPollingLoading(false);
    setCurrentPredictionId(null); // Ensure polling stops
    setPredictionStatus(null);
    setAudioUrl(null);
    setTtsErrorMessage(null);
    setTtsPredictionDbId(null);
    console.log("[useTtsGeneration] State reset");
  }, []); // Removed mutation dependencies, as they don't exist in this hook

  // Effect for polling the prediction status
  useEffect(() => {
    // We need ttsPredictionDbId to fetch provider info for polling.
    if (!currentPredictionId || !ttsPredictionDbId || predictionStatus === 'succeeded' || predictionStatus === 'failed' || predictionStatus === 'canceled') {
      return;
    }

    // Indicate polling has started
    setIsPollingLoading(true);
    setPredictionStatus('processing');

    const intervalId = setInterval(async () => {
      try {
        // Pass ttsPredictionDbId to the action, so it can determine the provider and the actual provider's prediction ID.
        const result = await getSpeechGenerationResult(ttsPredictionDbId);

        if (!result.success) {
          setTtsErrorMessage(result.error || 'Polling failed.');
          setCurrentPredictionId(null);
          setIsPollingLoading(false);
          setPredictionStatus('failed');
          clearInterval(intervalId);
          return;
        }

        const currentStatus = result.status || 'failed';
        setPredictionStatus(currentStatus);

        if (currentStatus === 'succeeded') {
          setAudioUrl(result.audioUrl ?? null);
          setTtsPredictionDbId(result.ttsPredictionDbId ?? null);
          setCurrentPredictionId(null); // Stop polling
          setIsPollingLoading(false);
          toast({ title: 'Speech generated successfully!' });
          // Notify parent component that generation is complete
          if (onGenerationComplete) {
            onGenerationComplete();
          }
          clearInterval(intervalId);
        } else if (currentStatus === 'failed' || currentStatus === 'canceled') {
          setTtsErrorMessage(result.error ? JSON.stringify(result.error) : 'Prediction failed or was canceled.');
          setTtsPredictionDbId(null);
          setCurrentPredictionId(null); // Stop polling
          setIsPollingLoading(false);
          clearInterval(intervalId);
        }
        // Keep polling if status is starting, processing, etc.
      } catch (error) {
        console.error('Polling error:', error);
        setTtsErrorMessage('An error occurred during polling.');
        setCurrentPredictionId(null);
        setIsPollingLoading(false);
        setPredictionStatus('failed');
        setTtsPredictionDbId(null);
        clearInterval(intervalId);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      setIsPollingLoading(false); // Ensure loading stops if component unmounts while polling
    };
  }, [currentPredictionId, predictionStatus, toast, onGenerationComplete, ttsPredictionDbId]);

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
      // Pass parameters explicitly instead of formData
      const result = await startSpeechGeneration(inputText, voiceId, provider);

      if (result.success && result.predictionId) {
        setCurrentPredictionId(result.predictionId);
        if (result.ttsPredictionDbId) { // Check if ttsPredictionDbId is returned
          setTtsPredictionDbId(result.ttsPredictionDbId); // Store our DB ID
        }
        // Polling will start via useEffect
      } else {
        setTtsErrorMessage(result.error || 'Failed to start generation.');
        setPredictionStatus('failed'); // Set status to failed if start fails
      }
    });
  }, [resetTtsState, startTtsTransition]);

  const isGenerating = isTtsPending || isPollingLoading;

  const loadPrediction = useCallback((data: {
    audioUrl: string | null;
    dbId: string | null;
    status?: string | null;
  }) => {
    // The calling context (TtsInterface) should call resetTtsState first if needed.
    // This function just loads the data into state.
    setAudioUrl(data.audioUrl); 
    setTtsPredictionDbId(data.dbId);
    setPredictionStatus(data.status || (data.audioUrl ? 'succeeded' : null));
    setTtsErrorMessage(null); // Clear any previous error
    // isGenerating will be false as mutations are reset and isPollingLoading is false (or will be set by resetTtsState)
    console.log("[useTtsGeneration] Prediction loaded into state:", data);
  }, []); // Dependencies: setAudioUrl, setTtsPredictionDbId, etc. are stable from useState

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