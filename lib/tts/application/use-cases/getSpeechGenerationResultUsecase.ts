import { getReplicatePrediction } from '../../infrastructure/providers/ttsService';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { PredictionStatus } from '../../domain';

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
  const supabase = createSupabaseServerClient();

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
      
      // Use PredictionStatus value object for business logic
      const statusVO = new PredictionStatus(replicatePrediction.status);
      outputAudioUrl = statusVO.isSuccessful ? (replicatePrediction.output as string | null) : null;
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

    const updateData: {
      status?: string;
      outputUrl?: string | null;
      errorMessage?: string | null;
      updatedAt?: string;
      is_output_url_problematic?: boolean;
      output_url_last_error?: string | null;
    } = {
      status: currentProviderStatus,
      updatedAt: new Date().toISOString(),
    };

    if (outputAudioUrl) {
      updateData.outputUrl = outputAudioUrl;
    }
    if (providerError) {
      const statusVO = new PredictionStatus(currentProviderStatus);
      if (!statusVO.isSuccessful && statusVO.isFinal) {
        updateData.errorMessage = providerError;
      }
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
    
    // Use PredictionStatus for final business logic
    const finalStatus = new PredictionStatus(currentProviderStatus);
    
    if (providerError && !finalStatus.isSuccessful && finalStatus.isFinal) {
      return { success: false, status: currentProviderStatus, audioUrl: null, error: providerError, ttsPredictionDbId };
    }

    if (finalStatus.isSuccessful && !outputAudioUrl) {
      return { success: false, status: currentProviderStatus, audioUrl: null, error: 'Prediction succeeded but audio URL is missing.', ttsPredictionDbId };
    }

    return { 
      success: finalStatus.isSuccessful,
      status: currentProviderStatus, 
      audioUrl: outputAudioUrl, 
      error: null, 
      ttsPredictionDbId 
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get speech generation result.';
    return {
      success: false,
      status: 'failed',
      audioUrl: null,
      error: errorMessage,
      ttsPredictionDbId,
    };
  }
} 