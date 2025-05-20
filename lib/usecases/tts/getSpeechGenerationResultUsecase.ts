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
    const { data: ttsRecord, error: fetchError } = await supabase
      .from('TtsPrediction')
      .select('*')
      .eq('id', ttsPredictionDbId)
      .single();

    if (fetchError || !ttsRecord) {
      return {
        success: false,
        status: 'failed',
        audioUrl: null,
        error: `Failed to fetch prediction details from database: ${fetchError?.message || 'Record not found.'}`, 
        ttsPredictionDbId,
      };
    }

    const provider = ttsRecord.prediction_provider;
    const providerPredictionId = ttsRecord.replicatePredictionId;

    if (!provider || !providerPredictionId) {
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

    if (provider === 'elevenlabs') {
      // ElevenLabs TTS is synchronous; treat as succeeded immediately
      return {
        success: true,
        status: ttsRecord.status,
        audioUrl: ttsRecord.outputUrl || null,
        error: null,
        ttsPredictionDbId,
      };
    }
    
    if (provider === 'replicate') {
      const replicatePrediction = await getReplicatePrediction(providerPredictionId);
      currentProviderStatus = replicatePrediction.status;
      outputAudioUrl = replicatePrediction.status === 'succeeded' ? (replicatePrediction.output as string | null) : null;
      providerError = replicatePrediction.error ? String(replicatePrediction.error) : null;
    } else {
      return { 
        success: false, 
        status: 'failed', 
        audioUrl: null, 
        error: `Provider '${provider}' is not supported for status checks.`, 
        ttsPredictionDbId 
      };
    }

    const updateData: Partial<TtsPredictionRow> = {
      status: currentProviderStatus,
      updatedAt: new Date().toISOString(),
    };

    if (outputAudioUrl) {
      updateData.outputUrl = outputAudioUrl;
    }
    if (providerError && (currentProviderStatus === 'failed' || currentProviderStatus === 'canceled')) {
      updateData.errorMessage = providerError;
    }

    const { error: dbUpdateError } = await supabase
      .from('TtsPrediction')
      .update(updateData)
      .eq('id', ttsPredictionDbId);

    if (dbUpdateError) {
      return { 
        success: false, 
        status: currentProviderStatus, 
        audioUrl: outputAudioUrl, 
        error: `Failed to update prediction in database: ${dbUpdateError.message}`, 
        ttsPredictionDbId 
      };
    }
    
    if (providerError && (currentProviderStatus === 'failed' || currentProviderStatus === 'canceled')) {
      return { success: false, status: currentProviderStatus, audioUrl: null, error: providerError, ttsPredictionDbId };
    }

    if (currentProviderStatus === 'succeeded' && !outputAudioUrl) {
      return { success: false, status: currentProviderStatus, audioUrl: null, error: 'Prediction succeeded but audio URL is missing.', ttsPredictionDbId };
    }

    return { 
      success: currentProviderStatus === 'succeeded',
      status: currentProviderStatus, 
      audioUrl: outputAudioUrl, 
      error: null, 
      ttsPredictionDbId 
    };

  } catch (error: any) {
    return {
      success: false,
      status: 'failed',
      audioUrl: null,
      error: error.message || 'Failed to get speech generation result.',
      ttsPredictionDbId,
    };
  }
} 