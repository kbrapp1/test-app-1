'use server';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
// Import specific usecase functions
import { getTtsVoices as getTtsVoicesUsecase } from '@/lib/usecases/tts/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '@/lib/usecases/tts/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '@/lib/usecases/tts/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '@/lib/usecases/tts/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '@/lib/usecases/tts/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '@/lib/usecases/tts/getTtsHistoryUsecase';
// import { TtsPredictionInsert, TtsPredictionUpdate } from '@/types/supabase-custom'; // Removed as it seems unused for this action and causing errors
import { Database } from '@/types/supabase'; // THIS LINE SHOULD BE THE ONLY IMPORT OF Database
import { checkTtsFeatureFlag } from './services/TtsFeatureFlagService';

// Import the types from the usecase file if they are exported, or redefine if necessary
// Assuming TtsPredictionRow is part of the return type or an exported type from the usecase, or Database types can be used.
// For this example, let's assume we need to define params similar to the usecase.
// Ideally, if TtsPredictionRow is complex and defined in types/supabase.ts, use that.
type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

interface GetTtsHistoryActionParams {
  page?: number;
  limit?: number;
  sortBy?: keyof TtsPredictionRow;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

// Re-export functions for client consumption
export async function getTtsVoices(provider?: string, modelId?: string) {
  return getTtsVoicesUsecase(provider, modelId);
}

export async function startSpeechGeneration(inputText: string, voiceId: string, provider: string) {
  try {
    await checkTtsFeatureFlag();
    return await startSpeechGenerationUsecase(inputText, voiceId, provider);
  } catch (error: any) {
    console.error('TTS feature flag check failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getSpeechGenerationResult(ttsPredictionDbId: string) {
  try {
    await checkTtsFeatureFlag();
    return await getSpeechGenerationResultUsecase(ttsPredictionDbId);
  } catch (error: any) {
    console.error('TTS feature flag check failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  try {
    await checkTtsFeatureFlag();
    const result = await saveTtsAudioToDamUsecase(audioUrl, desiredAssetName, ttsPredictionId);

    if (result.success && result.assetId && linkToPrediction) {
      const supabase = createSupabaseServerClient();
      const { error: linkError } = await supabase
        .from('TtsPrediction')
        .update({ outputAssetId: result.assetId })
        .eq('id', ttsPredictionId);

      if (linkError) {
        console.error('TTS Action (saveTtsAudioToDam): Error linking asset to prediction:', linkError);
        return { success: false, error: 'Failed to link asset to prediction.', assetId: undefined };
      }

      return { success: true, assetId: result.assetId, error: undefined };
    }

    return result;
  } catch (error: any) {
    console.error('TTS feature flag check failed:', error.message);
    return { success: false, error: error.message, assetId: undefined };
  }
}

export async function saveTtsHistory(
  // Define input type properly based on usecase implementation
  input: any 
) {
  try {
    await checkTtsFeatureFlag();
    return await saveTtsHistoryUsecase(input);
  } catch (error: any) {
    console.error('TTS feature flag check failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams) {
  // Pass the received params directly to the usecase function, including searchQuery
  try {
    await checkTtsFeatureFlag();
    return await getTtsHistoryUsecase(params);
  } catch (error: any) {
    console.error('TTS feature flag check failed:', error.message);
    return { success: false, error: error.message };
  }
}

// New Server Action to mark a TTS URL as problematic
export async function markTtsUrlProblematic(
  ttsPredictionId: string, 
  errorMessage?: string | null // Optional error message
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkTtsFeatureFlag();
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in markTtsUrlProblematic:', authError);
      return { success: false, error: 'Authentication failed.' };
    }

    const { error: updateError } = await supabase
      .from('TtsPrediction')
      .update({ 
        is_output_url_problematic: true,
        error_message: errorMessage 
      })
      .eq('id', ttsPredictionId);

    if (updateError) {
      console.error('TTS Action (markTtsPredictionAsProblematic): Error updating prediction:', updateError);
    }

    return { success: true };

  } catch (e: any) {
    console.error('Unexpected error in markTtsUrlProblematic:', e);
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}
