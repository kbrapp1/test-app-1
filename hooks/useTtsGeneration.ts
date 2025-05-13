import { useState, useEffect, useTransition, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult } from '@/lib/actions/tts';

export function useTtsGeneration() {
  const { toast } = useToast();
  const [isTtsPending, startTtsTransition] = useTransition();
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<string>('idle'); // idle, starting, processing, succeeded, failed, canceled
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);
  const [ttsPredictionDbId, setTtsPredictionDbId] = useState<string | null>(null); // Store the DB ID associated with the prediction

  // Reset state function
  const resetTtsState = useCallback(() => {
    setCurrentPredictionId(null);
    setPredictionStatus('idle');
    setAudioUrl(null);
    setTtsErrorMessage(null);
    setTtsPredictionDbId(null);
    setIsPollingLoading(false);
  }, []);

  // Effect for polling the prediction status
  useEffect(() => {
    if (!currentPredictionId || predictionStatus === 'succeeded' || predictionStatus === 'failed' || predictionStatus === 'canceled') {
      return;
    }

    // Indicate polling has started
    setIsPollingLoading(true);
    setPredictionStatus('processing');

    const intervalId = setInterval(async () => {
      try {
        const result = await getSpeechGenerationResult(currentPredictionId);

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
  }, [currentPredictionId, predictionStatus, toast]);

  // Function to initiate the TTS generation
  const startGeneration = useCallback((formData: FormData) => {
    resetTtsState(); // Reset previous state before starting
    setPredictionStatus('starting');

    startTtsTransition(async () => {
      const result = await startSpeechGeneration(formData);

      if (result.success && result.predictionId) {
        setCurrentPredictionId(result.predictionId);
        // Polling will start via useEffect
      } else {
        setTtsErrorMessage(result.error || 'Failed to start generation.');
        setPredictionStatus('failed'); // Set status to failed if start fails
      }
    });
  }, [resetTtsState, startTtsTransition]);

  const isGenerating = isTtsPending || isPollingLoading;

  return {
    isGenerating,
    predictionStatus,
    audioUrl,
    ttsErrorMessage,
    ttsPredictionDbId,
    startGeneration,
    resetTtsState,
  };
} 