// GenerationLifecycle Domain Service - DDD Domain Layer
// Single Responsibility: Handle generation lifecycle operations and status management
// Domain service for complex business operations involving generation state

import { Generation } from '../entities/Generation';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { GenerationStatusManager } from '../entities/services/GenerationStatusManager';

export class GenerationLifecycle {
  /**
   * Update generation status with validation
   */
  static updateStatus(generation: Generation, newStatus: GenerationStatus): void {
    GenerationStatusManager.validateTransition(generation.status, newStatus);
    (generation as any)._status = newStatus;
    (generation as any)._updatedAt = new Date();
  }

  /**
   * Mark generation as completed with results
   */
  static markAsCompleted(generation: Generation, imageUrl: string, generationTime: number): void {
    this.updateStatus(generation, GenerationStatus.completed());
    (generation as any)._resultImageUrl = imageUrl;
    (generation as any)._generationTimeSeconds = generationTime;
    (generation as any)._updatedAt = new Date();
  }

  /**
   * Mark generation as failed with error message
   */
  static markAsFailed(generation: Generation, errorMessage: string): void {
    this.updateStatus(generation, GenerationStatus.failed());
    (generation as any)._errorMessage = errorMessage;
    (generation as any)._updatedAt = new Date();
  }

  /**
   * Mark generation as processing
   */
  static markAsProcessing(generation: Generation): void {
    this.updateStatus(generation, GenerationStatus.processing());
    (generation as any)._updatedAt = new Date();
  }

  /**
   * Set external provider ID with validation
   */
  static setExternalProviderId(generation: Generation, providerId: string): void {
    if (!providerId?.trim()) {
      throw new Error('External provider ID cannot be empty');
    }
    (generation as any)._externalProviderId = providerId;
    (generation as any)._updatedAt = new Date();
  }

  /**
   * Set auto-saved image URL with validation
   */
  static setAutoSavedImageUrl(generation: Generation, permanentUrl: string): void {
    if (!permanentUrl?.trim()) {
      throw new Error('Storage URL cannot be empty');
    }
    (generation as any)._resultImageUrl = permanentUrl;
    // Ensure updatedAt strictly increases even if clock resolution is low
    const prevTime = (generation as any)._updatedAt?.getTime() || 0;
    const nowTime = Date.now();
    const newTime = nowTime > prevTime ? nowTime : prevTime + 1;
    (generation as any)._updatedAt = new Date(newTime);
  }
} 