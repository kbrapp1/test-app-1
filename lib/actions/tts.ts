'use server';

// Import specific usecase functions
import { getTtsVoices as getTtsVoicesUsecase } from '@/lib/usecases/tts/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '@/lib/usecases/tts/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '@/lib/usecases/tts/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '@/lib/usecases/tts/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '@/lib/usecases/tts/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '@/lib/usecases/tts/getTtsHistoryUsecase';

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
  ttsPredictionId: string
) {
  return saveTtsAudioToDamUsecase(audioUrl, desiredAssetName, ttsPredictionId);
}

export async function saveTtsHistory(
  // Define input type properly based on usecase implementation
  input: any 
) {
  return saveTtsHistoryUsecase(input);
}

export async function getTtsHistory() {
  return getTtsHistoryUsecase();
}
