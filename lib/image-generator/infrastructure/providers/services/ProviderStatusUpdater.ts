import { Generation } from '../../../domain/entities/Generation';
import { ProviderStatusResponse } from './ProviderStatusCache';
import { success, error, Result } from '../../../domain/value-objects';

/**
 * Infrastructure Layer - ProviderStatusUpdater applies provider responses to domain entities
 * Single Responsibility: Map ProviderStatusResponse into Generation state transitions
 * Golden Rule DDD: Extract domain integration logic from orchestrator
 */
export class ProviderStatusUpdater {
  applyResponse(
    generation: Generation,
    response: ProviderStatusResponse
  ): Result<Generation, string> {
    try {
      switch (response.status) {
        case 'completed':
          if (response.imageUrl) {
            generation.markAsCompleted(response.imageUrl, 25);
          } else {
            generation.markAsFailed('Completed but no image URL provided');
          }
          break;
        case 'failed':
          generation.markAsFailed(response.errorMessage || 'Generation failed');
          break;
        case 'processing':
          generation.markAsProcessing();
          break;
        case 'cancelled':
          generation.markAsFailed('Generation was cancelled');
          break;
        // 'pending' - no update
      }
      return success(generation);
    } catch (err) {
      return error(`Failed to update generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
} 