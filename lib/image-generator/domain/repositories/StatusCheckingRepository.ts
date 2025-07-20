import { Generation } from '../entities/Generation';
import { Result } from '../value-objects';

/**
 * Status Checking Repository Interface
 * Single Responsibility: Define contracts for generation status data access
 * Domain Layer - Interface only, no implementation details
 */
export interface StatusCheckingRepository {
  
  /**
   * Find active generations that require status polling
   * Returns generations that satisfy polling business rules
   */
  findActiveGenerationsForPolling(
    userId: string, 
    organizationId: string
  ): Promise<Result<Generation[], string>>;

  /**
   * Find specific generation by ID for status checking
   * Used for individual generation monitoring
   */
  findGenerationForStatusCheck(
    generationId: string,
    userId: string,
    organizationId: string
  ): Promise<Result<Generation | null, string>>;

  /**
   * Find multiple generations by IDs for batch status checking
   * Optimized for efficient batch operations
   */
  findGenerationsForBatchStatusCheck(
    generationIds: string[],
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>>;

  /**
   * Update generation status after external provider check
   * Single responsibility for status updates
   */
  updateGenerationStatus(
    generation: Generation
  ): Promise<Result<void, string>>;

  /**
   * Update multiple generation statuses in batch
   * Efficient batch status updates
   */
  updateGenerationStatusBatch(
    generations: Generation[]
  ): Promise<Result<void, string>>;

  /**
   * Find generations that should be marked as timed out
   * Business rule: Find stuck generations for timeout handling
   */
  findGenerationsForTimeout(
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>>;

  /**
   * Mark generations as timed out due to business rules
   * Apply timeout business logic to stuck generations
   */
  markGenerationsAsTimedOut(
    generations: Generation[]
  ): Promise<Result<void, string>>;
} 