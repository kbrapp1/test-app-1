// GenerationValidationService - DDD Domain Service
// Single Responsibility: Validation and business rules for Generation entities
// Following Golden Rule: Pure domain service with focused responsibility

import { Generation } from '../entities/Generation';
import { GenerationStatus } from '../value-objects/GenerationStatus';

/**
 * Domain Service for Generation Validation and Business Rules
 * Handles complex validation logic and business rule enforcement
 * Following Golden Rule DDD: Focused service with single responsibility
 */
export class GenerationValidationService {
  /**
   * Validate if status transition is allowed
   */
  static canTransitionTo(currentStatus: GenerationStatus, newStatus: GenerationStatus): boolean {
    const current = currentStatus.value;
    const target = newStatus.value;

    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'failed'],
      'processing': ['completed', 'failed'],
      'completed': [], // Terminal state
      'failed': [] // Terminal state
    };

    return validTransitions[current]?.includes(target) ?? false;
  }

  /**
   * Validate if generation can be saved to DAM
   */
  static canSaveToDAM(generation: Generation): boolean {
    return generation.isCompleted() && !generation.savedToDAM && generation.resultImageUrl !== null;
  }

  /**
   * Validate external provider ID
   */
  static validateExternalProviderId(providerId: string): void {
    if (!providerId?.trim()) {
      throw new Error('External provider ID cannot be empty');
    }
  }

  /**
   * Validate permanent URL for auto-save
   */
  static validatePermanentUrl(url: string): void {
    if (!url?.trim()) {
      throw new Error('Permanent URL cannot be empty');
    }
  }

  /**
   * Validate if generation can be linked to DAM asset
   */
  static validateDAMLinking(generation: Generation): void {
    if (!this.canSaveToDAM(generation)) {
      throw new Error('Cannot save to DAM: generation not completed or already saved');
    }
  }

  /**
   * Validate status transition and throw error if invalid
   */
  static validateStatusTransition(
    currentStatus: GenerationStatus, 
    newStatus: GenerationStatus
  ): void {
    if (!this.canTransitionTo(currentStatus, newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus.value} to ${newStatus.value}`);
    }
  }

  /**
   * Check if generation is in editing mode
   */
  static isEditingMode(generation: Generation): boolean {
    return generation.editType !== 'text-to-image';
  }

  /**
   * Check if generation has base image
   */
  static hasBaseImage(generation: Generation): boolean {
    return !!generation.baseImageUrl;
  }
} 