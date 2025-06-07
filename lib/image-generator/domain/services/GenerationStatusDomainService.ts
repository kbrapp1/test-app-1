import { Generation } from '../entities/Generation';
import { GenerationStatus } from '../value-objects/GenerationStatus';

/**
 * Generation Status Domain Service
 * Single Responsibility: Pure business logic for generation status management
 * Domain Layer - No external dependencies, pure business rules only
 */
export class GenerationStatusDomainService {
  private static readonly TIMEOUT_THRESHOLD_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_POLLING_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly RAPID_POLLING_THRESHOLD_MS = 30 * 1000; // 30 seconds

  /**
   * Determine if a generation requires active status polling
   * Business Rule: Only poll active generations within reasonable time limits
   */
  static requiresPolling(generation: Generation): boolean {
    const status = generation.getStatus();
    
    // Terminal statuses never need polling
    if (this.isTerminalStatus(status)) {
      return false;
    }

    // Don't poll very old generations (assume failed)
    if (this.isExpiredGeneration(generation)) {
      return false;
    }

    // Only poll active statuses
    return this.isActiveStatus(status);
  }

  /**
   * Calculate appropriate polling interval based on generation characteristics
   * Business Rule: Newer generations poll more frequently, older ones less
   */
  static calculatePollingInterval(generation: Generation): number {
    const status = generation.getStatus();
    const age = this.getGenerationAgeMs(generation);

    // Terminal statuses don't need polling
    if (this.isTerminalStatus(status)) {
      return 0;
    }

    // Rapid polling for new generations
    if (age < this.RAPID_POLLING_THRESHOLD_MS) {
      return 2000; // 2 seconds
    }

    // Standard polling for active generations
    if (age < this.TIMEOUT_THRESHOLD_MS) {
      return 5000; // 5 seconds
    }

    // Slower polling for older generations
    return 10000; // 10 seconds
  }

  /**
   * Determine if generation should be marked as timed out
   * Business Rule: Mark as failed if stuck in active state too long
   */
  static shouldTimeout(generation: Generation): boolean {
    const status = generation.getStatus();
    const age = this.getGenerationAgeMs(generation);

    return this.isActiveStatus(status) && age > this.TIMEOUT_THRESHOLD_MS;
  }

  /**
   * Determine if generation should stop being monitored due to age
   * Business Rule: Stop monitoring very old generations to prevent resource waste
   */
  static shouldStopMonitoring(generation: Generation): boolean {
    const age = this.getGenerationAgeMs(generation);
    const status = generation.getStatus();

    // Always stop monitoring terminal statuses
    if (this.isTerminalStatus(status)) {
      return true;
    }

    // Stop monitoring very old active generations
    return age > this.MAX_POLLING_AGE_MS;
  }

  /**
   * Determine priority for batch status checking
   * Business Rule: Prioritize newer, active generations
   */
  static getPollingPriority(generation: Generation): 'high' | 'medium' | 'low' | 'none' {
    const status = generation.getStatus();
    const age = this.getGenerationAgeMs(generation);

    // No polling for terminal statuses
    if (this.isTerminalStatus(status)) {
      return 'none';
    }

    // High priority for new active generations
    if (this.isActiveStatus(status) && age < this.RAPID_POLLING_THRESHOLD_MS) {
      return 'high';
    }

    // Medium priority for active generations
    if (this.isActiveStatus(status) && age < this.TIMEOUT_THRESHOLD_MS) {
      return 'medium';
    }

    // Low priority for older active generations
    if (this.isActiveStatus(status)) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Determine if multiple generations can be efficiently batched
   * Business Rule: Batch similar priority generations for efficiency
   */
  static canBatchTogether(generations: Generation[]): boolean {
    if (generations.length < 2) {
      return false;
    }

    // All generations must be active to benefit from batching
    const allActive = generations.every(g => this.isActiveStatus(g.getStatus()));
    if (!allActive) {
      return false;
    }

    // Batch if all have similar polling priority
    const priorities = generations.map(g => this.getPollingPriority(g));
    const uniquePriorities = new Set(priorities);
    
    return uniquePriorities.size === 1 && !priorities.includes('none');
  }

  /**
   * Calculate optimal batch size for status checking
   * Business Rule: Balance efficiency vs response time
   */
  static getOptimalBatchSize(generationCount: number): number {
    // Single generation - no batching needed
    if (generationCount <= 1) {
      return 1;
    }

    // Small batch - check all together
    if (generationCount <= 5) {
      return generationCount;
    }

    // Medium batch - limit to reasonable size
    if (generationCount <= 20) {
      return Math.min(10, generationCount);
    }

    // Large batch - process in chunks
    return 15;
  }

  /**
   * Private helper: Check if status is terminal (completed/failed/cancelled)
   */
  private static isTerminalStatus(status: GenerationStatus): boolean {
    const statusValue = status.value;
    return ['completed', 'failed', 'cancelled'].includes(statusValue);
  }

  /**
   * Private helper: Check if status is active (pending/processing)
   */
  private static isActiveStatus(status: GenerationStatus): boolean {
    const statusValue = status.value;
    return ['pending', 'processing'].includes(statusValue);
  }

  /**
   * Private helper: Get generation age in milliseconds
   */
  private static getGenerationAgeMs(generation: Generation): number {
    const now = new Date();
    return now.getTime() - generation.createdAt.getTime();
  }

  /**
   * Private helper: Check if generation is too old to be actively processed
   */
  private static isExpiredGeneration(generation: Generation): boolean {
    const age = this.getGenerationAgeMs(generation);
    return age > this.MAX_POLLING_AGE_MS;
  }
} 