'use server';

import { TtsCompositionRoot } from '../../infrastructure/composition/TtsCompositionRoot';
import { TtsAccessControlService } from '../../application/services/TtsAccessControlService';
import { TtsErrorHandler } from '../../domain/common/TtsError';
import { TtsHistorySaveInput } from '../../domain/types/DatabaseTypes';

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
  try {
    // AI: Check voice configuration access
    await TtsAccessControlService.checkVoiceConfigurationAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.getVoices(provider, modelId);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function startSpeechGeneration(inputText: string, voiceId: string, provider: string) {
  try {
    // AI: Check speech generation access
    await TtsAccessControlService.checkSpeechGenerationAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.startSpeechGeneration(inputText, voiceId, provider);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function getSpeechGenerationResult(ttsPredictionDbId: string) {
  try {
    // AI: Check TTS history access to view generation results
    await TtsAccessControlService.checkHistoryAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.getSpeechGenerationResult(ttsPredictionDbId);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  try {
    // AI: Check DAM integration access
    await TtsAccessControlService.checkDamIntegrationAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.saveTtsAudioToDam(audioUrl, desiredAssetName, ttsPredictionId, linkToPrediction);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function saveTtsHistory(input: TtsHistorySaveInput) {
  try {
    // AI: Check speech generation access for saving history
    await TtsAccessControlService.checkSpeechGenerationAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.saveTtsHistory(input);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams) {
  try {
    // AI: Check TTS history access
    await TtsAccessControlService.checkHistoryAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.getTtsHistory(params);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
}

export async function markTtsUrlProblematic(
  ttsPredictionId: string, 
  errorMessage?: string | null
) {
  try {
    // AI: Check history delete access for marking problematic
    await TtsAccessControlService.checkHistoryDeleteAccess();
    
    const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
    return ttsAppService.markTtsUrlProblematic(ttsPredictionId, errorMessage);
  } catch (error) {
    return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
  }
} 