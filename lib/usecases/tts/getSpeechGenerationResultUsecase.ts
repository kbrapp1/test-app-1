import { getReplicatePrediction } from '@/lib/services/ttsService';
import { createClient } from '@/lib/supabase/server';

/**
 * Usecase: Fetches the result/status of a speech generation prediction from Replicate
 * and updates the corresponding record in the local TtsPrediction table.
 */
export async function getSpeechGenerationResult(
  replicatePredictionId: string
): Promise<{
  success: boolean;
  status: string; // The status from Replicate
  audioUrl: string | null; // The audio URL from Replicate, if successful
  error: string | null;    // Error message from Replicate or internal
  ttsPredictionDbId: string | null; // Our internal DB ID for the TtsPrediction record
}> {
  const supabase = createClient();
  let ourDbRecordId: string | null = null;

  try {
    console.log(`TTS Usecase (getSpeechGenerationResult): Getting result for Replicate prediction ID: ${replicatePredictionId}`);
    const replicatePrediction = await getReplicatePrediction(replicatePredictionId);
    console.log(`TTS Usecase (getSpeechGenerationResult): Received Replicate prediction status: ${replicatePrediction.status}`);

    const currentReplicateStatus = replicatePrediction.status;
    const outputAudioUrl = replicatePrediction.status === 'succeeded' ? (replicatePrediction.output as string | null) : null;
    const replicateError = replicatePrediction.error ? String(replicatePrediction.error) : null;

    const updateData: { 
      status: string;
      outputUrl?: string | null;
      errorMessage?: string | null;
      updatedAt: string; // Trigger should also handle this, but good to be explicit
    } = {
      status: currentReplicateStatus,
      updatedAt: new Date().toISOString(),
    };

    if (outputAudioUrl) {
      updateData.outputUrl = outputAudioUrl;
    }
    if (replicateError) {
      updateData.errorMessage = replicateError;
    }

    console.log(`TTS Usecase (getSpeechGenerationResult): Updating TtsPrediction table for replicatePredictionId ${replicatePredictionId} with data:`, updateData);
    const { data: updatedRecord, error: dbUpdateError } = await supabase
      .from('TtsPrediction')
      .update(updateData)
      .eq('replicatePredictionId', replicatePredictionId)
      .select('id')
      .single();

    if (dbUpdateError) {
      console.error(`TTS Usecase (getSpeechGenerationResult): DB update error for replicatePredictionId ${replicatePredictionId}:`, dbUpdateError);
      // Return Replicate status but indicate DB update failure
      return { 
        success: false, // Indicate overall failure due to DB issue
        status: currentReplicateStatus, 
        audioUrl: outputAudioUrl, 
        error: `Failed to update prediction in database: ${dbUpdateError.message}`, 
        ttsPredictionDbId: null 
      };
    }

    if (!updatedRecord) {
      console.error(`TTS Usecase (getSpeechGenerationResult): No record found in TtsPrediction for replicatePredictionId ${replicatePredictionId} to update.`);
      // This case should ideally not happen if startSpeechGenerationUsecase worked correctly
      return { 
        success: false, 
        status: currentReplicateStatus, 
        audioUrl: outputAudioUrl, 
        error: 'Failed to find prediction record in database to update.', 
        ttsPredictionDbId: null 
      };
    }
    
    ourDbRecordId = updatedRecord.id;
    console.log(`TTS Usecase (getSpeechGenerationResult): Successfully updated TtsPrediction record ${ourDbRecordId} for Replicate ID ${replicatePredictionId}`);

    // Check if Replicate itself reported an error for the prediction
    if (replicateError) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Replicate prediction failed for ${replicatePredictionId}:`, replicateError);
      return { success: false, status: currentReplicateStatus, audioUrl: null, error: replicateError, ttsPredictionDbId: ourDbRecordId };
    }

    // Check if Replicate prediction succeeded but has no output URL (should be rare)
    if (currentReplicateStatus === 'succeeded' && !outputAudioUrl) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Replicate prediction ${replicatePredictionId} succeeded but has no output URL.`);
      return { success: false, status: currentReplicateStatus, audioUrl: null, error: 'Prediction succeeded but audio URL is missing.', ttsPredictionDbId: ourDbRecordId };
    }

    // If everything went well (DB update and Replicate status is not an error state handled above)
    return { 
      success: true, // Or determine based on currentReplicateStatus (e.g. only true if 'succeeded')
      status: currentReplicateStatus, 
      audioUrl: outputAudioUrl, 
      error: null, // No internal error, Replicate error handled above
      ttsPredictionDbId: ourDbRecordId 
    };

  } catch (error: any) {
    console.error(`TTS Usecase (getSpeechGenerationResult): Catch block error for Replicate ID ${replicatePredictionId}:`, error);
    // Attempt to find our DB record ID even in case of an error to return it if possible
    // This might be helpful if the error occurred after fetching from Replicate but before/during DB update attempt
    // However, if `replicatePrediction` itself failed, `ourDbRecordId` would be null.
    // A more robust way might be another query if essential.
    // For now, if `ourDbRecordId` was set before error, use it.
    return {
      success: false,
      status: 'failed', // Generic status for catch block error
      audioUrl: null,
      error: error.message || 'Failed to get speech generation result.',
      ttsPredictionDbId: ourDbRecordId, // May be null if error happened early
    };
  }
} 