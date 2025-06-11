'use server';

import { TtsCompositionRoot } from '../../infrastructure/composition/TtsCompositionRoot';
import { GetTtsHistoryResponseDto } from '../../application/dto/TtsPredictionDto';

// Valid sort fields for TTS predictions
type TtsPredictionSortField = 'createdAt' | 'updatedAt' | 'inputText' | 'status' | 'voiceId';

interface GetTtsHistoryActionParams {
  page?: number;
  limit?: number;
  sortBy?: TtsPredictionSortField;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

export async function getTtsVoices(provider?: string, modelId?: string) {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.getVoices(provider, modelId);
}

export async function startSpeechGeneration(inputText: string, voiceId: string, provider: string) {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.startSpeechGeneration(inputText, voiceId, provider);
}

export async function getSpeechGenerationResult(ttsPredictionDbId: string) {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.getSpeechGenerationResult(ttsPredictionDbId);
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.saveTtsAudioToDam(audioUrl, desiredAssetName, ttsPredictionId, linkToPrediction);
}

export async function saveTtsHistory(input: any) {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.saveTtsHistory(input);
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams): Promise<GetTtsHistoryResponseDto> {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.getTtsHistory(params);
}

export async function markTtsUrlProblematic(
  ttsPredictionId: string, 
  errorMessage?: string | null
): Promise<{ success: boolean; error?: string }> {
  const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
  return ttsAppService.markTtsUrlProblematic(ttsPredictionId, errorMessage);
} 