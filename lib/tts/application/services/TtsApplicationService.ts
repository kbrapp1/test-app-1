// TTS Application Service - coordinates use cases and manages DTO transformations
import { getTtsVoices as getTtsVoicesUsecase } from '../use-cases/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '../use-cases/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '../use-cases/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '../use-cases/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '../use-cases/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '../use-cases/getTtsHistoryUsecase';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { TtsPredictionToDisplayDtoMapper } from '../mappers/TtsPredictionToDisplayDtoMapper';
import { GetTtsHistoryResponseDto } from '../dto/TtsPredictionDto';
import { TtsGenerationService } from './TtsGenerationService';
import { ITtsFeatureFlagService } from '../../domain/services/ITtsFeatureFlagService';
// Domain interfaces only - no concrete infrastructure imports
import { TtsPredictionRepository } from '../../domain/repositories/TtsPredictionRepository';
import { TtsHistorySaveInput, TtsServiceResponse } from '../../domain/types/DatabaseTypes';
import { TtsVoice } from '../../domain/value-objects/VoiceId';

// Types
type TtsPredictionSortField = 'createdAt' | 'updatedAt' | 'inputText' | 'status' | 'voiceId';

interface GetTtsHistoryParams {
  page?: number;
  limit?: number;
  sortBy?: TtsPredictionSortField;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

interface StartSpeechGenerationResult {
  success: boolean;
  predictionId?: string;
  ttsPredictionDbId?: string;
  error?: string;
}

interface SpeechGenerationResult {
  success: boolean;
  status?: string;
  audioUrl?: string | null;
  error?: string | null;
  ttsPredictionDbId?: string | null;
}

interface SaveToDamResult {
  success: boolean;
  assetId?: string;
  error?: string;
}

interface MarkProblematicResult {
  success: boolean;
  error?: string;
}

/**
 * Application service for TTS operations
 * Handles orchestration, feature flag checking, and DTO mapping
 * 
 * Uses dependency injection to maintain DDD compliance
 */
export class TtsApplicationService {
  private readonly dtoMapper: TtsPredictionToDisplayDtoMapper;

  constructor(
    private readonly repository: TtsPredictionRepository,
    private readonly ttsGenerationService: TtsGenerationService,
    private readonly predictionService: TtsPredictionService,
    private readonly featureFlagService: ITtsFeatureFlagService
  ) {
    // ✅ DDD COMPLIANT - All dependencies injected via constructor
    this.dtoMapper = new TtsPredictionToDisplayDtoMapper();
  }

  /**
   * Get available TTS voices
   */
  async getVoices(provider?: string, modelId?: string): Promise<{ success: boolean; voices?: TtsVoice[]; error?: string }> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await getTtsVoicesUsecase(provider, modelId);
      
      // Map the response from 'data' to 'voices' for consistency
      return {
        success: result.success,
        voices: result.data, // Map 'data' to 'voices'
        error: result.error
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start speech generation with feature flag check
   */
  async startSpeechGeneration(
    inputText: string,
    voiceId: string,
    provider: string,
    userId: string,
    organizationId: string
  ): Promise<StartSpeechGenerationResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return await startSpeechGenerationUsecase(inputText, voiceId, provider, this.ttsGenerationService, userId, organizationId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get speech generation result with feature flag check
   */
  async getSpeechGenerationResult(ttsPredictionDbId: string): Promise<SpeechGenerationResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return await getSpeechGenerationResultUsecase(ttsPredictionDbId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Save TTS audio to DAM with optional linking
   */
  async saveTtsAudioToDam(
    audioUrl: string,
    desiredAssetName: string,
    ttsPredictionId: string,
    linkToPrediction: boolean = true,
    userId?: string,
    organizationId?: string
  ): Promise<SaveToDamResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await saveTtsAudioToDamUsecase(audioUrl, desiredAssetName, ttsPredictionId, this.ttsGenerationService, userId, organizationId);

      if (result.success && result.assetId && linkToPrediction) {
        try {
          await this.predictionService.linkToAsset(ttsPredictionId, result.assetId);
          return { success: true, assetId: result.assetId };
        } catch (linkError: unknown) {
          // Log the specific linking error for debugging
          const errorMessage = linkError instanceof Error ? linkError.message : 'Unknown linking error';
          console.error('Failed to link TTS asset to prediction:', errorMessage);
          return { 
            success: false, 
            error: 'Failed to link asset to prediction.',
            assetId: undefined 
          };
        }
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage, assetId: undefined };
    }
  }

  /**
   * Save TTS history
   */
  async saveTtsHistory(input: TtsHistorySaveInput): Promise<TtsServiceResponse<void>> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await saveTtsHistoryUsecase(input);
      
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: { 
            code: 'TTS_HISTORY_SAVE_FAILED', 
            message: result.error || 'Failed to save TTS history' 
          } 
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error saving TTS history';
      return { 
        success: false, 
        error: { 
          code: 'TTS_HISTORY_SAVE_ERROR', 
          message: errorMessage
        } 
      };
    }
  }

  /**
   * Get TTS history with proper DTO mapping
   */
  async getTtsHistory(params?: GetTtsHistoryParams, userId?: string, organizationId?: string): Promise<GetTtsHistoryResponseDto> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await getTtsHistoryUsecase(params, userId, organizationId);
      
      if (!result.success) {
        return { success: false, error: result.error, count: undefined };
      }

      // Use dedicated mapper for DTO conversion
      const displayDtos = result.data 
        ? result.data.map(entity => this.dtoMapper.toDisplayDto(entity))
        : [];
      
      return { 
        success: true, 
        data: displayDtos, 
        count: result.count 
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage, count: undefined };
    }
  }

  /**
   * Mark TTS URL as problematic using domain service
   */
  async markTtsUrlProblematic(
    ttsPredictionId: string, 
    errorMessage?: string | null
  ): Promise<MarkProblematicResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      await this.predictionService.markUrlProblematic(
        ttsPredictionId, 
        errorMessage || 'URL marked as problematic'
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  }
} 