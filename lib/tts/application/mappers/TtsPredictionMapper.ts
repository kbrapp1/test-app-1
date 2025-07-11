import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionDto, TtsPredictionDisplayDto } from '../dto/TtsPredictionDto';
import { TextInput } from '../../domain/value-objects/TextInput';
import { PredictionStatus } from '../../domain/value-objects/PredictionStatus';
import { VoiceId } from '../../domain/value-objects/VoiceId';

/**
 * Mapper for converting TtsPrediction entities to DTOs for server/client boundary
 */
export class TtsPredictionMapper {
  
  /**
   * Convert TtsPrediction entity to full DTO
   */
  static toDto(entity: TtsPrediction): TtsPredictionDto {
    return {
      id: entity.id,
      replicatePredictionId: entity.replicatePredictionId,
      externalProviderId: entity.externalProviderId,
      textInput: {
        value: entity.textInput.value,
        isValid: true, // TextInput is always valid if constructed
        validationErrors: [],
      },
      status: {
        value: entity.status.value,
        displayName: entity.status.value, // Use the value as display name
        isCompleted: entity.status.isSuccessful,
        isFailed: entity.status.value === 'failed',
        isProcessing: entity.status.isProcessing,
      },
      outputUrl: entity.outputUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      userId: entity.userId,
      organizationId: entity.organizationId,
      sourceAssetId: entity.sourceAssetId,
      outputAssetId: entity.outputAssetId,
      voiceId: entity.voiceId ? {
        value: entity.voiceId.value,
        displayName: entity.voiceId.displayName,
        provider: entity.voiceId.provider,
      } : null,
      errorMessage: entity.errorMessage,
      predictionProvider: entity.predictionProvider,
      isOutputUrlProblematic: entity.isOutputUrlProblematic,
      outputUrlLastError: entity.outputUrlLastError,
      outputStoragePath: entity.outputStoragePath,
      outputContentType: entity.outputContentType,
      outputFileSize: entity.outputFileSize,
    };
  }

  /**
   * Convert TtsPrediction entity to display DTO (optimized for UI)
   */
  static toDisplayDto(entity: TtsPrediction): TtsPredictionDisplayDto {
    return {
      id: entity.id,
      externalProviderId: entity.externalProviderId,
      inputText: entity.textInput.value,
      inputTextSnippet: this.createTextSnippet(entity.textInput.value),
      status: entity.status.value,
      statusDisplayName: entity.status.value, // Use value as display name
      outputUrl: entity.outputUrl,
      createdAt: entity.createdAt.toISOString(),
      voiceDisplayName: this.getVoiceDisplayName(entity),
      providerDisplayName: this.getProviderDisplayName(entity),
      errorMessage: entity.errorMessage,
      isOutputUrlProblematic: entity.isOutputUrlProblematic,
      outputUrlLastError: entity.outputUrlLastError,
      outputAssetId: entity.outputAssetId,
      
      // Computed business logic flags
      hasAudioOutput: entity.hasAudioOutput(),
      isOutputUrlLikelyExpired: entity.isOutputUrlLikelyExpired(),
      canBeReplayed: entity.canBeReplayed(),
      canBeSavedToDam: entity.canBeSavedToDam(),
      isAlreadySavedToDam: entity.isLinkedToDam(),
      isCompleted: entity.status.isSuccessful,
      isFailed: entity.status.value === 'failed',
      isProcessing: entity.status.isProcessing,
    };
  }

  /**
   * Convert array of entities to display DTOs
   */
  static toDisplayDtos(entities: TtsPrediction[]): TtsPredictionDisplayDto[] {
    return entities.map(entity => this.toDisplayDto(entity));
  }

  /**
   * Convert DTO back to entity (for client-side reconstruction if needed)
   * Note: This recreates the entity from serialized data
   */
  static fromDto(dto: TtsPredictionDto): TtsPrediction {
    // Create entity using proper value objects
    return new TtsPrediction({
      id: dto.id,
      replicatePredictionId: dto.replicatePredictionId || dto.externalProviderId,
      externalProviderId: dto.externalProviderId,
      textInput: new TextInput(dto.textInput.value),
      status: new PredictionStatus(dto.status.value),
      outputUrl: dto.outputUrl,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      userId: dto.userId || '',
      organizationId: dto.organizationId || '',
      sourceAssetId: dto.sourceAssetId,
      outputAssetId: dto.outputAssetId,
      voiceId: dto.voiceId ? new VoiceId(dto.voiceId.value) : null,
      errorMessage: dto.errorMessage,
      predictionProvider: dto.predictionProvider,
      isOutputUrlProblematic: dto.isOutputUrlProblematic,
      outputUrlLastError: dto.outputUrlLastError,
      outputStoragePath: dto.outputStoragePath,
      outputContentType: dto.outputContentType,
      outputFileSize: dto.outputFileSize,
    });
  }

  /**
   * Convert display DTO to a simplified client-side object
   * This is useful when the client doesn't need full entity functionality
   */
  static fromDisplayDto(dto: TtsPredictionDisplayDto): {
    id: string;
    inputText: string;
    voiceId: string;
    outputUrl: string | null;
    status: string;
    createdAt: Date;
    [key: string]: unknown;
  } {
    return {
      id: dto.id,
      inputText: dto.inputText,
      voiceId: dto.voiceDisplayName, // Note: using display name since we don't have the raw value
      outputUrl: dto.outputUrl,
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      // Include other commonly needed properties
      externalProviderId: dto.externalProviderId,
      statusDisplayName: dto.statusDisplayName,
      voiceDisplayName: dto.voiceDisplayName,
      providerDisplayName: dto.providerDisplayName,
      errorMessage: dto.errorMessage,
      isOutputUrlProblematic: dto.isOutputUrlProblematic,
      outputUrlLastError: dto.outputUrlLastError,
      outputAssetId: dto.outputAssetId,
      hasAudioOutput: dto.hasAudioOutput,
      isOutputUrlLikelyExpired: dto.isOutputUrlLikelyExpired,
      canBeReplayed: dto.canBeReplayed,
      canBeSavedToDam: dto.canBeSavedToDam,
      isAlreadySavedToDam: dto.isAlreadySavedToDam,
      isCompleted: dto.isCompleted,
      isFailed: dto.isFailed,
      isProcessing: dto.isProcessing,
    };
  }

  /**
   * Display logic helper methods
   */

  /**
   * Create a text snippet with ellipsis if too long
   */
  private static createTextSnippet(text: string, maxLength: number = 50): string {
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  }

  /**
   * Get voice display name
   */
  private static getVoiceDisplayName(entity: TtsPrediction): string {
    if (entity.voiceId) {
      return entity.voiceId.displayName;
    }
    return 'Default Voice';
  }

  /**
   * Get provider display name
   */
  private static getProviderDisplayName(entity: TtsPrediction): string {
    if (entity.predictionProvider) {
      return entity.predictionProvider.charAt(0).toUpperCase() + entity.predictionProvider.slice(1);
    }
    return 'Unknown Provider';
  }
} 