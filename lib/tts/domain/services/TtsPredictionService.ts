import { TtsPrediction } from '../entities/TtsPrediction';
import { TtsPredictionRepository } from '../repositories/TtsPredictionRepository';
import { TextInput } from '../value-objects/TextInput';
import { VoiceId } from '../value-objects/VoiceId';

/**
 * Domain service for TtsPrediction business logic coordination.
 * This service orchestrates complex business operations that don't belong
 * to a single entity and coordinates between multiple domain objects.
 */
export class TtsPredictionService {
  constructor(private readonly repository: TtsPredictionRepository) {}

  /**
   * Create a new TTS prediction with business validation
   */
  async createPrediction(params: {
    userId: string;
    organizationId: string;
    textInput: TextInput;
    voiceId: VoiceId;
    provider: string;
    externalProviderId: string;
  }): Promise<TtsPrediction> {
    // Business validation
    this.validatePredictionCreation(params);

    // Check for duplicate predictions (business rule)
    await this.ensureNoDuplicatePrediction(params.externalProviderId);

    // Create the prediction entity
    const prediction = TtsPrediction.create({
      replicatePredictionId: params.externalProviderId,
      userId: params.userId,
      organizationId: params.organizationId,
      textInput: params.textInput,
      voiceId: params.voiceId,
      predictionProvider: params.provider,
      externalProviderId: params.externalProviderId,
    });

    // Persist the prediction
    return await this.repository.save(prediction);
  }

  /**
   * Complete a prediction with audio output
   */
  async completePrediction(
    predictionId: string,
    outputUrl: string,
    metadata?: {
      outputStoragePath?: string;
      outputContentType?: string;
      outputFileSize?: number;
    }
  ): Promise<TtsPrediction> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    // Business logic: Mark as completed with output and metadata
    const completedPrediction = prediction.markAsCompleted(outputUrl, metadata);
    
    return await this.repository.update(completedPrediction);
  }

  /**
   * Fail a prediction with error message
   */
  async failPrediction(
    predictionId: string,
    errorMessage: string
  ): Promise<TtsPrediction> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    // Business logic: Mark as failed with error
    const failedPrediction = prediction.markAsFailed(errorMessage);
    
    return await this.repository.update(failedPrediction);
  }

  /**
   * Link a prediction to a DAM asset
   */
  async linkToAsset(
    predictionId: string,
    assetId: string
  ): Promise<TtsPrediction> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    // Business validation: Can only link completed predictions
    if (!prediction.isCompleted()) {
      throw new Error('Can only link completed predictions to DAM assets');
    }

    // Update the prediction
    const linkedPrediction = prediction.linkToDamAsset(assetId);
    await this.repository.update(linkedPrediction);

    // Also update in repository for tracking
    await this.repository.linkToAsset(predictionId, assetId);

    return linkedPrediction;
  }

  /**
   * Mark a prediction URL as problematic
   */
  async markUrlProblematic(
    predictionId: string,
    errorMessage: string
  ): Promise<TtsPrediction> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    // Mark as problematic in entity
    const problematicPrediction = prediction.markOutputUrlAsProblematic(errorMessage);
    await this.repository.update(problematicPrediction);

    // Also mark in repository for querying
    await this.repository.markUrlProblematic(predictionId, errorMessage);

    return problematicPrediction;
  }

  /**
   * Check if a prediction can be replayed
   */
  async canReplay(predictionId: string): Promise<boolean> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      return false;
    }

    return prediction.canBeReplayed();
  }

  /**
   * Check if prediction output is likely expired (business rule)
   */
  async isOutputLikelyExpired(predictionId: string): Promise<boolean> {
    const prediction = await this.repository.findById(predictionId);
    if (!prediction) {
      return true;
    }

    return prediction.isOutputUrlLikelyExpired();
  }

  /**
   * Get predictions ready for cleanup (business rule)
   */
  async getPredictionsReadyForCleanup(): Promise<TtsPrediction[]> {
    // Business rule: Get old failed predictions or expired URLs
    const olderThan30Days = new Date();
    olderThan30Days.setDate(olderThan30Days.getDate() - 30);

    const failedPredictions = await this.repository.findByStatus('failed', {
      sortBy: 'createdAt',
      sortOrder: 'asc'
    });

    // Filter by business logic
    return failedPredictions.filter(prediction => 
      prediction.createdAt < olderThan30Days ||
      prediction.isOutputUrlLikelyExpired()
    );
  }

  /**
   * Validate prediction creation parameters
   */
  private validatePredictionCreation(params: {
    userId: string;
    organizationId: string;
    textInput: TextInput;
    voiceId: VoiceId;
    provider: string;
    externalProviderId: string;
  }): void {
    if (!params.userId) {
      throw new Error('User ID is required for prediction creation');
    }

    if (!params.organizationId) {
      throw new Error('Organization ID is required for prediction creation');
    }

    if (!params.externalProviderId) {
      throw new Error('External provider ID is required for prediction creation');
    }

    // Additional business validations can be added here
  }

  /**
   * Ensure no duplicate prediction exists
   */
  private async ensureNoDuplicatePrediction(externalProviderId: string): Promise<void> {
    const existing = await this.repository.findByExternalProviderId(externalProviderId);
    if (existing) {
      throw new Error(`Prediction already exists with external provider ID: ${externalProviderId}`);
    }
  }
} 