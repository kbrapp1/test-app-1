import { getReplicatePrediction } from '@/lib/services/ttsService';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase'; // Import Database types

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

/**
 * Usecase: Fetches the result/status of a speech generation prediction from the specified provider
 * and updates the corresponding record in the local TtsPrediction table.
 */
export async function getSpeechGenerationResult(
  ttsPredictionDbId: string // Our internal DB ID for the TtsPrediction record
): Promise<{
  success: boolean;
  status: string; 
  audioUrl: string | null; 
  error: string | null;    
  ttsPredictionDbId: string | null; // Echo back our DB ID
}> {
  const supabase = createClient();

  try {
    // 1. Fetch our TtsPrediction record to get provider and provider's prediction ID
    console.log(`TTS Usecase (getSpeechGenerationResult): Fetching TtsPrediction record with ID: ${ttsPredictionDbId}`);
    const { data: ttsRecord, error: fetchError } = await supabase
      .from('TtsPrediction')
      .select('*')
      .eq('id', ttsPredictionDbId)
      .single();

    if (fetchError || !ttsRecord) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Could not fetch TtsPrediction record for ID ${ttsPredictionDbId}:`, fetchError);
      return {
        success: false,
        status: 'failed',
        audioUrl: null,
        error: `Failed to fetch prediction details from database: ${fetchError?.message || 'Record not found.'}`, 
        ttsPredictionDbId,
      };
    }

    const provider = ttsRecord.prediction_provider;
    const providerPredictionId = ttsRecord.replicatePredictionId; // Using current field name

    if (!provider || !providerPredictionId) {
        console.error(`TTS Usecase (getSpeechGenerationResult): Missing provider ('${provider}') or providerPredictionId ('${providerPredictionId}') in TtsPrediction record ${ttsPredictionDbId}`);
        return { 
            success: false, 
            status: 'failed', 
            audioUrl: null, 
            error: 'Database record is missing provider information.', 
            ttsPredictionDbId 
        };
    }

    let currentProviderStatus: string;
    let outputAudioUrl: string | null = null;
    let providerError: string | null = null;

    // 2. Provider-specific logic to get status
    if (provider === 'replicate') {
      console.log(`TTS Usecase (getSpeechGenerationResult): Getting result from Replicate for prediction ID: ${providerPredictionId}`);
      const replicatePrediction = await getReplicatePrediction(providerPredictionId);
      console.log(`TTS Usecase (getSpeechGenerationResult): Received Replicate prediction status: ${replicatePrediction.status}`);
      currentProviderStatus = replicatePrediction.status;
      outputAudioUrl = replicatePrediction.status === 'succeeded' ? (replicatePrediction.output as string | null) : null;
      providerError = replicatePrediction.error ? String(replicatePrediction.error) : null;
    } else {
      console.warn(`TTS Usecase (getSpeechGenerationResult): Unsupported provider '${provider}' for TtsPrediction ID ${ttsPredictionDbId}`);
      return { 
        success: false, 
        status: 'failed', 
        audioUrl: null, 
        error: `Provider '${provider}' is not supported for status checks.`, 
        ttsPredictionDbId 
      };
    }

    // 3. Update our TtsPrediction table
    const updateData: Partial<TtsPredictionRow> = { // Use Partial for update data
      status: currentProviderStatus,
      updatedAt: new Date().toISOString(),
    };

    if (outputAudioUrl) {
      updateData.outputUrl = outputAudioUrl;
    }
    // Only set errorMessage if there was an error from the provider AND the status is a failure/error status.
    // If providerError is set but status is e.g. 'succeeded', it might be a warning or non-fatal issue.
    if (providerError && (currentProviderStatus === 'failed' || currentProviderStatus === 'canceled')) {
      updateData.errorMessage = providerError;
    }

    console.log(`TTS Usecase (getSpeechGenerationResult): Updating TtsPrediction table for ID ${ttsPredictionDbId} with data:`, updateData);
    const { error: dbUpdateError } = await supabase
      .from('TtsPrediction')
      .update(updateData)
      .eq('id', ttsPredictionDbId); // Use our DB ID for the update

    if (dbUpdateError) {
      console.error(`TTS Usecase (getSpeechGenerationResult): DB update error for TtsPrediction ID ${ttsPredictionDbId}:`, dbUpdateError);
      return { 
        success: false, 
        status: currentProviderStatus, 
        audioUrl: outputAudioUrl, 
        error: `Failed to update prediction in database: ${dbUpdateError.message}`, 
        ttsPredictionDbId 
      };
    }
    
    console.log(`TTS Usecase (getSpeechGenerationResult): Successfully updated TtsPrediction record ${ttsPredictionDbId}`);

    // 4. Determine overall success and return
    if (providerError && (currentProviderStatus === 'failed' || currentProviderStatus === 'canceled')) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Provider '${provider}' reported failure for ${providerPredictionId}:`, providerError);
      return { success: false, status: currentProviderStatus, audioUrl: null, error: providerError, ttsPredictionDbId };
    }

    if (currentProviderStatus === 'succeeded' && !outputAudioUrl) {
      console.error(`TTS Usecase (getSpeechGenerationResult): Provider '${provider}' prediction ${providerPredictionId} succeeded but has no output URL.`);
      return { success: false, status: currentProviderStatus, audioUrl: null, error: 'Prediction succeeded but audio URL is missing.', ttsPredictionDbId };
    }

    return { 
      success: currentProviderStatus === 'succeeded', // Success is true only if provider status is 'succeeded'
      status: currentProviderStatus, 
      audioUrl: outputAudioUrl, 
      error: null, 
      ttsPredictionDbId 
    };

  } catch (error: any) {
    console.error(`TTS Usecase (getSpeechGenerationResult): Catch block error for TtsPredictionDbId ${ttsPredictionDbId}:`, error);
    return {
      success: false,
      status: 'failed',
      audioUrl: null,
      error: error.message || 'Failed to get speech generation result.',
      ttsPredictionDbId,
    };
  }
} 