/**
 * TTS Application Service
 * 
 * Coordinates TTS use cases, handles cross-cutting concerns (feature flags),
 * and manages DTO transformations. This follows DDD patterns by keeping
 * business logic orchestration separate from server actions.
 */
import { getTtsVoices as getTtsVoicesUsecase } from '../use-cases/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '../use-cases/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '../use-cases/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '../use-cases/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '../use-cases/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '../use-cases/getTtsHistoryUsecase';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { TtsPredictionToDisplayDtoMapper } from '../mappers/TtsPredictionToDisplayDtoMapper';
import { GetTtsHistoryResponseDto, TtsPredictionDisplayDto } from '../dto/TtsPredictionDto';
import { TtsGenerationService } from './TtsGenerationService';
import { ITtsFeatureFlagService } from '../../domain/services/ITtsFeatureFlagService';
// Domain interfaces only - no concrete infrastructure imports
import { TtsPredictionRepository } from '../../domain/repositories/TtsPredictionRepository';

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
  async getVoices(provider?: string, modelId?: string): Promise<any> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return getTtsVoicesUsecase(provider, modelId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Start speech generation with feature flag check
   */
  async startSpeechGeneration(
    inputText: string,
    voiceId: string,
    provider: string
  ): Promise<StartSpeechGenerationResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return await startSpeechGenerationUsecase(inputText, voiceId, provider, this.ttsGenerationService);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get speech generation result with feature flag check
   */
  async getSpeechGenerationResult(ttsPredictionDbId: string): Promise<SpeechGenerationResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return await getSpeechGenerationResultUsecase(ttsPredictionDbId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save TTS audio to DAM with optional linking
   */
  async saveTtsAudioToDam(
    audioUrl: string,
    desiredAssetName: string,
    ttsPredictionId: string,
    linkToPrediction: boolean = true
  ): Promise<SaveToDamResult> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await saveTtsAudioToDamUsecase(audioUrl, desiredAssetName, ttsPredictionId, this.ttsGenerationService);

      if (result.success && result.assetId && linkToPrediction) {
        try {
          await this.predictionService.linkToAsset(ttsPredictionId, result.assetId);
          return { success: true, assetId: result.assetId };
        } catch (linkError: any) {
          return { 
            success: false, 
            error: 'Failed to link asset to prediction.',
            assetId: undefined 
          };
        }
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message, assetId: undefined };
    }
  }

  /**
   * Save TTS history
   */
  async saveTtsHistory(input: any): Promise<any> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      return await saveTtsHistoryUsecase(input);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get TTS history with proper DTO mapping
   */
  async getTtsHistory(params?: GetTtsHistoryParams): Promise<GetTtsHistoryResponseDto> {
    try {
      await this.featureFlagService.checkTtsFeatureFlag();
      const result = await getTtsHistoryUsecase(params);
      
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
    } catch (error: any) {
      return { success: false, error: error.message, count: undefined };
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
} 