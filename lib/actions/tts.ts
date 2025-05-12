'use server';

import {
  getTtsVoices as getTtsVoicesService,
  startSpeechGeneration as startSpeechGenerationService,
  getSpeechGenerationResult as getSpeechGenerationResultService,
  saveTtsAudioToDam as saveTtsAudioToDamService,
  saveTtsHistory as saveTtsHistoryService,
  getTtsHistory as getTtsHistoryService,
} from '@/lib/services/tts';

export async function getTtsVoices() {
  return getTtsVoicesService();
}

export async function startSpeechGeneration(formData: FormData) {
  return startSpeechGenerationService(formData);
}

export async function getSpeechGenerationResult(replicatePredictionId: string) {
  return getSpeechGenerationResultService(replicatePredictionId);
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string
) {
  return saveTtsAudioToDamService(audioUrl, desiredAssetName, ttsPredictionId);
}

export async function saveTtsHistory(
  input: Parameters<typeof saveTtsHistoryService>[0]
) {
  return saveTtsHistoryService(input);
}

export async function getTtsHistory() {
  return getTtsHistoryService();
}
