import { Generation } from '../entities/Generation';
import { GenerationStatusManager } from '../entities/services/GenerationStatusManager';

/**
 * Domain Service for handling generation failures
 * Single Responsibility: Safely transition generations to failed state
 * Follows DDD Domain Service pattern - encapsulates domain logic that doesn't belong to a single entity
 */
export class GenerationFailureHandler {
  /**
   * Safely marks a generation as failed, respecting domain invariants
   * @param generation - The generation to mark as failed
   * @param errorMessage - The error message to record
   * @returns boolean - true if the failure was handled, false if already in terminal state
   */
  static handleFailure(generation: Generation, errorMessage: string): boolean {
    const currentStatus = generation.getStatus();
    
    // Check if generation can be marked as failed (domain rule)
    if (!GenerationStatusManager.canFail(currentStatus)) {
      // Already in terminal state or invalid for failure transition
      // This is normal behavior due to concurrent status updates
      return false;
    }

    try {
      // Perform the state transition through domain methods
      const failedStatus = currentStatus.transitionTo('failed');
      generation.updateStatus(failedStatus);
      generation.markAsFailed(errorMessage);
      
      return true;
    } catch (error) {
      // This can happen due to concurrent modifications - not an error, just log for debugging
      console.debug(`Generation ${generation.getId()} already in terminal state - no action needed`);
      return false;
    }
  }

  /**
   * Checks if a generation can be marked as failed
   * @param generation - The generation to check
   * @returns boolean - true if can be failed, false otherwise
   */
  static canHandleFailure(generation: Generation): boolean {
    return GenerationStatusManager.canFail(generation.getStatus());
  }

  /**
   * Gets a user-friendly error message based on the error type
   * @param error - The original error
   * @returns string - User-friendly error message
   */
  static getDisplayErrorMessage(error: string | Error): string {
    const errorMessage = error instanceof Error ? error.message : error;
    
    // Map common technical errors to user-friendly messages
    if (errorMessage.includes('Image editing not supported')) {
      return 'This model does not support image editing. Please select a different model or use text-to-image generation.';
    }
    
    if (errorMessage.includes('Provider') && errorMessage.includes('not found')) {
      return 'The selected AI provider is currently unavailable. Please try again or select a different provider.';
    }
    
    if (errorMessage.includes('Model') && errorMessage.includes('not found')) {
      return 'The selected model is not available. Please choose a different model.';
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return 'You have reached your generation limit. Please upgrade your plan or try again later.';
    }
    
    // Default technical error message
    return errorMessage || 'An unexpected error occurred during generation.';
  }
} 