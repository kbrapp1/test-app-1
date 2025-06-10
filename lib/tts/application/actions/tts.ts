'use server';

import { TtsApplicationService } from '../services/TtsApplicationService';
import { GetTtsHistoryResponseDto } from '../dto/TtsPredictionDto';

// Valid sort fields for TTS predictions
type TtsPredictionSortField = 'createdAt' | 'updatedAt' | 'inputText' | 'status' | 'voiceId';

interface GetTtsHistoryActionParams {
  page?: number;
  limit?: number;
  sortBy?: TtsPredictionSortField;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

// Initialize application service
const ttsAppService = new TtsApplicationService();

// Clean server actions that delegate to application service
export async function getTtsVoices(provider?: string, modelId?: string) {
  return ttsAppService.getVoices(provider, modelId);
}

export async function startSpeechGeneration(inputText: string, voiceId: string, provider: string) {
  return ttsAppService.startSpeechGeneration(inputText, voiceId, provider);
}

export async function getSpeechGenerationResult(ttsPredictionDbId: string) {
  return ttsAppService.getSpeechGenerationResult(ttsPredictionDbId);
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  return ttsAppService.saveTtsAudioToDam(audioUrl, desiredAssetName, ttsPredictionId, linkToPrediction);
}

export async function saveTtsHistory(input: any) {
  return ttsAppService.saveTtsHistory(input);
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams): Promise<GetTtsHistoryResponseDto> {
  return ttsAppService.getTtsHistory(params);
}

export async function markTtsUrlProblematic(
  ttsPredictionId: string, 
  errorMessage?: string | null
): Promise<{ success: boolean; error?: string }> {
  return ttsAppService.markTtsUrlProblematic(ttsPredictionId, errorMessage);
}
