import { getReplicatePrediction } from '@/lib/services/ttsService';

/**
 * Usecase: Fetches the result/status of a speech generation prediction from Replicate.
 */
export async function getSpeechGenerationResult(
  replicatePredictionId: string
): Promise<{
  success: boolean;
  status: string;
  audioUrl: string | null;
  error: string | null;
  ttsPredictionDbId: string | null; // Keep consistent return type for now
}> {
  try {
    console.log(`TTS Usecase (getSpeechGenerationResult): Getting result for prediction ID: ${replicatePredictionId}`);
    const prediction = await getReplicatePrediction(replicatePredictionId);
    console.log(`TTS Usecase (getSpeechGenerationResult): Received prediction status: ${prediction.status}`);

    const status = prediction.status;
    const audioUrl = prediction.status === 'succeeded' ? (prediction.output as string | null) : null;
    const error = prediction.error ? String(prediction.error) : null;
    // Use the Replicate ID as the 'DB ID' for now, consistent with previous logic
    const ttsPredictionDbId = replicatePredictionId; 

    if (error) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Replicate prediction failed for ${replicatePredictionId}:`, error);
      // TODO: Update status in DB if prediction record exists
      return { success: false, status, audioUrl: null, error, ttsPredictionDbId };
    }

    if (status === 'succeeded' && !audioUrl) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Replicate prediction ${replicatePredictionId} succeeded but has no output URL.`);
       // TODO: Update status in DB if prediction record exists
      return { success: false, status, audioUrl: null, error: 'Prediction succeeded but audio URL is missing.', ttsPredictionDbId };
    }

     // TODO: Update status/URL in DB if prediction record exists
    return { success: true, status, audioUrl, error, ttsPredictionDbId };

  } catch (error: any) {
    console.error(`TTS Usecase (getSpeechGenerationResult): Error getting speech generation result for ${replicatePredictionId}:`, error);
    return {
      success: false,
      status: 'failed',
      audioUrl: null,
      error: error.message || 'Failed to get speech generation result.',
      ttsPredictionDbId: replicatePredictionId, // Return ID even on catch
    };
  }
} 