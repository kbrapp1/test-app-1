import { TextInput } from '../value-objects/TextInput';
import { PredictionStatus } from '../value-objects/PredictionStatus';
import { VoiceId } from '../value-objects/VoiceId';
import { TtsPredictionDatabaseRow } from '../types/DatabaseTypes';

/**
 * TtsPrediction Domain Entity
 * 
 * Represents a text-to-speech prediction/generation request with its lifecycle.
 * This entity replaces Database['public']['Tables']['TtsPrediction']['Row'] usage.
 * 
 * Core business entity with identity - can be tracked through its lifecycle.
 */
export class TtsPrediction {
  public readonly id: string;
  public readonly replicatePredictionId: string; // Legacy field - keeping for compatibility
  public readonly externalProviderId: string; // New unified provider ID field
  public readonly textInput: TextInput;
  public readonly status: PredictionStatus;
  public readonly outputUrl: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly userId: string;
  public readonly organizationId: string;
  public readonly sourceAssetId: string | null;
  public readonly outputAssetId: string | null;
  public readonly voiceId: VoiceId | null;
  public readonly errorMessage: string | null;
  public readonly predictionProvider: string | null;
  public readonly isOutputUrlProblematic: boolean;
  public readonly outputUrlLastError: string | null;
  public readonly outputStoragePath: string | null;
  public readonly outputContentType: string | null;
  public readonly outputFileSize: number | null;

  constructor(params: {
    id: string;
    replicatePredictionId: string;
    externalProviderId?: string;
    textInput: TextInput;
    status: PredictionStatus;
    outputUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    organizationId: string;
    sourceAssetId?: string | null;
    outputAssetId?: string | null;
    voiceId?: VoiceId | null;
    errorMessage?: string | null;
    predictionProvider?: string | null;
    isOutputUrlProblematic?: boolean;
    outputUrlLastError?: string | null;
    outputStoragePath?: string | null;
    outputContentType?: string | null;
    outputFileSize?: number | null;
  }) {
    this.id = params.id;
    this.replicatePredictionId = params.replicatePredictionId;
    this.externalProviderId = params.externalProviderId || params.replicatePredictionId;
    this.textInput = params.textInput;
    this.status = params.status;
    this.outputUrl = params.outputUrl;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.userId = params.userId;
    this.organizationId = params.organizationId;
    this.sourceAssetId = params.sourceAssetId || null;
    this.outputAssetId = params.outputAssetId || null;
    this.voiceId = params.voiceId || null;
    this.errorMessage = params.errorMessage || null;
    this.predictionProvider = params.predictionProvider || null;
    this.isOutputUrlProblematic = params.isOutputUrlProblematic || false;
    this.outputUrlLastError = params.outputUrlLastError || null;
    this.outputStoragePath = params.outputStoragePath || null;
    this.outputContentType = params.outputContentType || null;
    this.outputFileSize = params.outputFileSize || null;
  }

  // ========================
  // Business Logic Methods
  // ========================

  /**
   * Check if the prediction is complete and successful
   */
  public isCompleted(): boolean {
    return this.status.isSuccessful;
  }

  /**
   * Check if the prediction is still processing
   */
  public isProcessing(): boolean {
    return this.status.isProcessing;
  }

  /**
   * Check if the prediction has failed
   */
  public isFailed(): boolean {
    return !this.status.isSuccessful && this.status.isFinal;
  }

  /**
   * Check if the prediction is in a final state (completed or failed)
   */
  public isFinal(): boolean {
    return this.status.isFinal;
  }

  /**
   * Check if audio output is available
   */
  public hasAudioOutput(): boolean {
    return this.isCompleted() && !!this.outputUrl && !this.isOutputUrlProblematic;
  }

  /**
   * Check if the output URL is likely expired
   */
  public isOutputUrlLikelyExpired(): boolean {
    if (!this.outputUrl || this.isOutputUrlProblematic) {
      return true;
    }

    // For Replicate URLs, check if they're older than 24 hours
    if (this.predictionProvider === 'replicate' && this.outputUrl.includes('replicate.delivery')) {
      const now = new Date();
      const hoursAgo = (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursAgo > 24;
    }

    return false;
  }

  /**
   * Check if the prediction can be replayed (re-executed)
   */
  public canBeReplayed(): boolean {
    return TextInput.isValid(this.textInput.value) && (this.voiceId ? VoiceId.isValid(this.voiceId.value) : true);
  }

  /**
   * Check if the prediction can be saved to DAM
   */
  public canBeSavedToDam(): boolean {
    return this.hasAudioOutput() && !this.outputAssetId;
  }

  /**
   * Check if the prediction is already linked to a DAM asset
   */
  public isLinkedToDam(): boolean {
    return !!this.outputAssetId;
  }



  /**
   * Mark prediction as completed with output
   */
  public markAsCompleted(outputUrl: string, metadata?: {
    outputStoragePath?: string;
    outputContentType?: string;
    outputFileSize?: number;
  }): TtsPrediction {
    return new TtsPrediction({
      ...this,
      status: PredictionStatus.succeeded(),
      outputUrl,
      updatedAt: new Date(),
      outputStoragePath: metadata?.outputStoragePath || this.outputStoragePath,
      outputContentType: metadata?.outputContentType || this.outputContentType,
      outputFileSize: metadata?.outputFileSize || this.outputFileSize,
      isOutputUrlProblematic: false,
      outputUrlLastError: null,
      errorMessage: null,
    });
  }

  /**
   * Mark prediction as failed with error
   */
  public markAsFailed(errorMessage: string): TtsPrediction {
    return new TtsPrediction({
      ...this,
      status: PredictionStatus.failed(),
      errorMessage,
      updatedAt: new Date(),
      outputUrl: null,
    });
  }

  /**
   * Mark output URL as problematic
   */
  public markOutputUrlAsProblematic(errorMessage: string): TtsPrediction {
    return new TtsPrediction({
      ...this,
      isOutputUrlProblematic: true,
      outputUrlLastError: errorMessage,
      updatedAt: new Date(),
    });
  }

  /**
   * Link to DAM asset
   */
  public linkToDamAsset(outputAssetId: string): TtsPrediction {
    return new TtsPrediction({
      ...this,
      outputAssetId,
      updatedAt: new Date(),
    });
  }

  /**
   * Update status to processing
   */
  public markAsProcessing(): TtsPrediction {
    return new TtsPrediction({
      ...this,
      status: PredictionStatus.processing(),
      updatedAt: new Date(),
      errorMessage: null,
    });
  }

  // ========================
  // Factory Methods
  // ========================

  /**
   * Create a new TtsPrediction for a speech generation request
   */
  public static create(params: {
    replicatePredictionId: string;
    externalProviderId?: string;
    textInput: TextInput;
    voiceId?: VoiceId;
    userId: string;
    organizationId: string;
    predictionProvider?: string;
    sourceAssetId?: string;
  }): TtsPrediction {
    const now = new Date();
    const id = crypto.randomUUID();

    return new TtsPrediction({
      id,
      replicatePredictionId: params.replicatePredictionId,
      externalProviderId: params.externalProviderId || params.replicatePredictionId,
      textInput: params.textInput,
      status: PredictionStatus.pending(),
      outputUrl: null,
      createdAt: now,
      updatedAt: now,
      userId: params.userId,
      organizationId: params.organizationId,
      sourceAssetId: params.sourceAssetId || null,
      outputAssetId: null,
      voiceId: params.voiceId || null,
      errorMessage: null,
      predictionProvider: params.predictionProvider || null,
      isOutputUrlProblematic: false,
      outputUrlLastError: null,
      outputStoragePath: null,
      outputContentType: null,
      outputFileSize: null,
    });
  }

  /**
   * Create from database row data
   */
  public static fromDatabaseRow(row: TtsPredictionDatabaseRow): TtsPrediction {
    return new TtsPrediction({
      id: row.id,
      replicatePredictionId: row.replicatePredictionId,
      externalProviderId: row.replicatePredictionId, // Map legacy field
      textInput: new TextInput(row.inputText),
      status: new PredictionStatus(row.status),
      outputUrl: row.outputUrl,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      userId: row.userId,
      organizationId: row.organization_id,
      sourceAssetId: row.sourceAssetId,
      outputAssetId: row.outputAssetId,
      voiceId: row.voiceId ? new VoiceId(row.voiceId) : null,
      errorMessage: row.errorMessage,
      predictionProvider: row.prediction_provider,
      isOutputUrlProblematic: row.is_output_url_problematic,
      outputUrlLastError: row.output_url_last_error,
      outputStoragePath: row.output_storage_path,
      outputContentType: row.output_content_type,
      outputFileSize: row.output_file_size,
    });
  }

  /**
   * Convert to database row format (for backward compatibility)
   */
  public toDatabaseRow(): TtsPredictionDatabaseRow {
    return {
      id: this.id,
      replicatePredictionId: this.replicatePredictionId,
      status: this.status.toString(),
      inputText: this.textInput.toString(),
      outputUrl: this.outputUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      userId: this.userId,
      organization_id: this.organizationId,
      sourceAssetId: this.sourceAssetId,
      outputAssetId: this.outputAssetId,
      voiceId: this.voiceId?.toString() || null,
      errorMessage: this.errorMessage,
      prediction_provider: this.predictionProvider,
      is_output_url_problematic: this.isOutputUrlProblematic,
      output_url_last_error: this.outputUrlLastError,
      output_storage_path: this.outputStoragePath,
      output_content_type: this.outputContentType,
      output_file_size: this.outputFileSize,
    };
  }

  /**
   * Convert to legacy format for backward compatibility
   */
  public toLegacyFormat(): TtsPredictionDatabaseRow {
    return this.toDatabaseRow();
  }

  // ========================
  // Validation Methods
  // ========================

  /**
   * Validate the entity state
   */
  public isValid(): boolean {
    try {
      // Basic validation
      if (!this.id || !this.replicatePredictionId || !this.userId || !this.organizationId) {
        return false;
      }

      // Validate value objects
      if (!TextInput.isValid(this.textInput.value)) {
        return false;
      }

      if (this.voiceId && !VoiceId.isValid(this.voiceId.value)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors
   */
  public getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.id) errors.push('ID is required');
    if (!this.replicatePredictionId) errors.push('External provider ID is required');
    if (!this.userId) errors.push('User ID is required');
    if (!this.organizationId) errors.push('Organization ID is required');

    if (!TextInput.isValid(this.textInput.value)) {
      errors.push('Invalid text input');
    }

    if (this.voiceId && !VoiceId.isValid(this.voiceId.value)) {
      errors.push('Invalid voice ID');
    }

    return errors;
  }
} 