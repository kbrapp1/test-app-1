// GenerationLifecycle Domain Service - DDD Domain Layer
// Single Responsibility: Handle generation lifecycle operations and status management
// Domain service for complex business operations involving generation state

import { Generation } from '../entities/Generation';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { GenerationStatusManager } from '../entities/services/GenerationStatusManager';

// Type assertion for domain service pattern - allows legitimate access to private fields
type WritableGeneration = {
  _status: GenerationStatus;
  _resultImageUrl: string;
  _generationTimeSeconds: number;
  _updatedAt: Date;
  _errorMessage: string | null;
  _savedToDAM: boolean;
  _damAssetId: string | null;
  _externalProviderId: string | null;
};

export class GenerationLifecycle {
  /**
   * Update generation status with validation
   */
  static updateStatus(generation: Generation, newStatus: GenerationStatus): void {
    GenerationStatusManager.validateTransition(generation.status, newStatus);
    (generation as unknown as WritableGeneration)._status = newStatus;
    (generation as unknown as WritableGeneration)._updatedAt = new Date();
  }

  /**
   * Mark generation as completed with results
   */
  static markAsCompleted(generation: Generation, imageUrl: string, generationTime: number): void {
    this.updateStatus(generation, GenerationStatus.completed());
    (generation as unknown as WritableGeneration)._resultImageUrl = imageUrl;
    (generation as unknown as WritableGeneration)._generationTimeSeconds = generationTime;
    (generation as unknown as WritableGeneration)._updatedAt = new Date();
  }

  /**
   * Mark generation as failed with error message
   */
  static markAsFailed(generation: Generation, errorMessage: string): void {
    this.updateStatus(generation, GenerationStatus.failed());
    (generation as unknown as WritableGeneration)._errorMessage = errorMessage;
    (generation as unknown as WritableGeneration)._updatedAt = new Date();
  }

  /**
   * Mark generation as processing
   */
  static markAsProcessing(generation: Generation): void {
    this.updateStatus(generation, GenerationStatus.processing());
    (generation as unknown as WritableGeneration)._updatedAt = new Date();
  }

  /**
   * Set external provider ID with validation
   */
  static setExternalProviderId(generation: Generation, providerId: string): void {
    if (!providerId?.trim()) {
      throw new Error('External provider ID cannot be empty');
    }
    (generation as unknown as WritableGeneration)._externalProviderId = providerId;
    (generation as unknown as WritableGeneration)._updatedAt = new Date();
  }

  /**
   * Set auto-saved image URL with validation
   */
  static setAutoSavedImageUrl(generation: Generation, permanentUrl: string): void {
    if (!permanentUrl?.trim()) {
      throw new Error('Storage URL cannot be empty');
    }
    (generation as unknown as WritableGeneration)._resultImageUrl = permanentUrl;
    // Ensure updatedAt strictly increases even if clock resolution is low
    const prevTime = (generation as unknown as WritableGeneration)._updatedAt?.getTime() || 0;
    const nowTime = Date.now();
    const newTime = nowTime > prevTime ? nowTime : prevTime + 1;
    (generation as unknown as WritableGeneration)._updatedAt = new Date(newTime);
  }
} 