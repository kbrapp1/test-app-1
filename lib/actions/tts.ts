'use server';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
// Import specific usecase functions
import { getTtsVoices as getTtsVoicesUsecase } from '@/lib/usecases/tts/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '@/lib/usecases/tts/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '@/lib/usecases/tts/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '@/lib/usecases/tts/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '@/lib/usecases/tts/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '@/lib/usecases/tts/getTtsHistoryUsecase';

// Import the types from the usecase file if they are exported, or redefine if necessary
// Assuming TtsPredictionRow is part of the return type or an exported type from the usecase, or Database types can be used.
// For this example, let's assume we need to define params similar to the usecase.
// Ideally, if TtsPredictionRow is complex and defined in types/supabase.ts, use that.
import type { Database } from '@/types/supabase';
type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

interface GetTtsHistoryActionParams {
  page?: number;
  limit?: number;
  sortBy?: keyof TtsPredictionRow;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

// Re-export functions for client consumption
export async function getTtsVoices() {
  return getTtsVoicesUsecase();
}

export async function startSpeechGeneration(formData: FormData) {
  return startSpeechGenerationUsecase(formData);
}

export async function getSpeechGenerationResult(replicatePredictionId: string) {
  return getSpeechGenerationResultUsecase(replicatePredictionId);
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  const result = await saveTtsAudioToDamUsecase(audioUrl, desiredAssetName, ttsPredictionId);

  if (result.success && result.assetId && linkToPrediction) {
    const supabase = createSupabaseServerClient();
    const { error: linkError } = await supabase
      .from('TtsPrediction')
      .update({ outputAssetId: result.assetId })
      .eq('id', ttsPredictionId);

    if (linkError) {
      console.error('TTS Action (saveTtsAudioToDam): Error linking asset ID to TTS prediction:', linkError);
      return { ...result, error: `Asset created, but linking failed: ${linkError.message}` };
    }
    console.log(`TTS Action (saveTtsAudioToDam): Successfully linked asset ${result.assetId} to prediction ${ttsPredictionId}`);
  }

  return result;
}

export async function saveTtsHistory(
  // Define input type properly based on usecase implementation
  input: any 
) {
  return saveTtsHistoryUsecase(input);
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams) {
  // Pass the received params directly to the usecase function, including searchQuery
  return getTtsHistoryUsecase(params);
}
