/**
 * TTS Prediction to Display DTO Mapper
 * 
 * Handles conversion from TtsPrediction domain entities to display DTOs
 * for client serialization. This separates presentation concerns from
 * domain logic following DDD principles.
 */
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionDisplayDto } from '../dto/TtsPredictionDto';

/**
 * Mapper for converting TtsPrediction entities to display DTOs
 */
export class TtsPredictionToDisplayDtoMapper {
  
  /**
   * Convert a TtsPrediction entity to a display DTO
   */
  toDisplayDto(entity: TtsPrediction): TtsPredictionDisplayDto {
    return {
      id: entity.id,
      externalProviderId: entity.externalProviderId,
      inputText: entity.textInput.value,
      inputTextSnippet: this.createTextSnippet(entity.textInput.value),
      status: entity.status.value,
      statusDisplayName: entity.status.value,
      outputUrl: entity.outputUrl,
      createdAt: entity.createdAt.toISOString(),
      voiceDisplayName: this.getVoiceDisplayName(entity),
      providerDisplayName: this.getProviderDisplayName(entity),
      errorMessage: entity.errorMessage,
      isOutputUrlProblematic: entity.isOutputUrlProblematic,
      outputUrlLastError: entity.outputUrlLastError,
      outputAssetId: entity.outputAssetId,
      hasAudioOutput: !!entity.outputUrl,
      isOutputUrlLikelyExpired: entity.isOutputUrlLikelyExpired(),
      canBeReplayed: entity.canBeReplayed(),
      canBeSavedToDam: entity.canBeSavedToDam(),
      isAlreadySavedToDam: !!entity.outputAssetId,
      isCompleted: entity.status.isSuccessful,
      isFailed: !entity.status.isSuccessful && entity.status.isFinal,
      isProcessing: entity.status.isProcessing,
    };
  }

  /**
   * Convert multiple entities to display DTOs
   */
  toDisplayDtoList(entities: TtsPrediction[]): TtsPredictionDisplayDto[] {
    return entities.map(entity => this.toDisplayDto(entity));
  }

  /**
   * Create a text snippet with ellipsis if too long
   */
  private createTextSnippet(text: string, maxLength: number = 50): string {
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  }

  /**
   * Get voice display name
   */
  private getVoiceDisplayName(entity: TtsPrediction): string {
    if (entity.voiceId) {
      return entity.voiceId.displayName;
    }
    return 'Default Voice';
  }

  /**
   * Get provider display name
   */
  private getProviderDisplayName(entity: TtsPrediction): string {
    if (entity.predictionProvider) {
      return entity.predictionProvider.charAt(0).toUpperCase() + entity.predictionProvider.slice(1);
    }
    return 'Unknown Provider';
  }
} 