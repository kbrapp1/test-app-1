// Generation Management Domain Service - DDD Domain Layer
// Single Responsibility: Coordinate complex generation business operations
// Following Golden Rule: Domain service for business logic that doesn't belong to a single entity

import { Generation } from '../entities/Generation';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { GenerationDisplayService } from './GenerationDisplayService';

/**
 * Generation Management Domain Service
 * Handles complex business operations involving generation lifecycle
 * Following Golden Rule DDD: Keep focused on coordination, under 250 lines
 */
export class GenerationManagementService {
  
  /**
   * Process generation completion with validation and side effects
   */
  static processCompletion(
    generation: Generation, 
    imageUrl: string, 
    generationTime: number
  ): void {
    if (!generation.isProcessing()) {
      throw new Error('Can only complete generations that are processing');
    }

    if (!imageUrl?.trim()) {
      throw new Error('Image URL is required for completion');
    }

    if (generationTime <= 0) {
      throw new Error('Generation time must be positive');
    }

    generation.markAsCompleted(imageUrl, generationTime);
  }

  /**
   * Process generation failure with error handling
   */
  static processFailure(generation: Generation, errorMessage: string): void {
    if (generation.isCompleted()) {
      throw new Error('Cannot mark completed generation as failed');
    }

    if (!errorMessage?.trim()) {
      throw new Error('Error message is required for failure');
    }

    generation.markAsFailed(errorMessage);
  }

  /**
   * Start generation processing with validation
   */
  static startProcessing(generation: Generation, externalProviderId: string): void {
    if (!generation.isPending()) {
      throw new Error('Can only start processing pending generations');
    }

    if (!externalProviderId?.trim()) {
      throw new Error('External provider ID is required to start processing');
    }

    generation.markAsProcessing();
    generation.setExternalProviderId(externalProviderId);
  }

  /**
   * Process auto-save with URL validation
   */
  static processAutoSave(generation: Generation, permanentUrl: string): void {
    if (!generation.isCompleted()) {
      throw new Error('Can only auto-save completed generations');
    }

    if (!permanentUrl?.trim()) {
      throw new Error('Permanent URL is required for auto-save');
    }

    // Validate URL format
    try {
      new URL(permanentUrl);
    } catch {
      throw new Error('Invalid permanent URL format');
    }

    generation.setAutoSavedImageUrl(permanentUrl);
  }

  /**
   * Validate generation can be processed for DAM integration
   */
  static validateDAMIntegration(generation: Generation): void {
    if (!generation.canSaveToDAM()) {
      const reason = generation.isCompleted() 
        ? generation.savedToDAM 
          ? 'already saved to DAM'
          : 'no result image available'
        : 'not completed';
      
      throw new Error(`Cannot save to DAM: generation ${reason}`);
    }
  }

  /**
   * Create DAM metadata from generation
   */
  static createDAMMetadata(generation: Generation): Record<string, unknown> {
    return {
      title: GenerationDisplayService.getDisplayTitle(generation),
      description: generation.prompt.toString(),
      tags: ['ai-generated', generation.modelName, generation.providerName],
      customFields: {
        generation_id: generation.id,
        provider: generation.providerName,
        model: generation.modelName,
        cost_cents: generation.costCents,
        generation_time_seconds: generation.generationTimeSeconds,
        ai_generated: true,
        edit_type: generation.editType,
        aspect_ratio: generation.aspectRatio,
        dimensions: `${generation.imageWidth}x${generation.imageHeight}`
      }
    };
  }

  /**
   * Validate status transition for complex workflows
   */
  static validateStatusTransition(
    currentStatus: GenerationStatus, 
    targetStatus: GenerationStatus,
    context: { hasImageUrl?: boolean; hasError?: boolean } = {}
  ): void {
    const current = currentStatus.value;
    const target = targetStatus.value;

    // Business rule: Completion requires image URL
    if (target === 'completed' && !context.hasImageUrl) {
      throw new Error('Cannot complete generation without image URL');
    }

    // Business rule: Failure requires error context
    if (target === 'failed' && !context.hasError) {
      throw new Error('Cannot mark as failed without error information');
    }

    // Business rule: Cannot restart terminal states
    if ((current === 'completed' || current === 'failed') && target !== current) {
      throw new Error(`Cannot transition from terminal state ${current} to ${target}`);
    }
  }

  /**
   * Calculate processing metrics for analytics
   */
  static calculateProcessingMetrics(generation: Generation): {
    isWithinTimeLimit: boolean;
    efficiencyScore: number;
    costPerSecond: number | null;
  } {
    const timeSeconds = generation.generationTimeSeconds;
    const costCents = generation.costCents;

    // Standard time limits by model type (business rules)
    const timeLimit = generation.modelName.includes('flux') ? 300 : 180; // 5min vs 3min
    
    return {
      isWithinTimeLimit: timeSeconds ? timeSeconds <= timeLimit : true,
      efficiencyScore: timeSeconds ? Math.max(0, (timeLimit - timeSeconds) / timeLimit) : 0,
      costPerSecond: timeSeconds && timeSeconds > 0 ? costCents / timeSeconds : null
    };
  }
} 