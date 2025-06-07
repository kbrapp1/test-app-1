import { Generation } from '../entities/Generation';
import { GenerationStatusDomainService } from '../services/GenerationStatusDomainService';

/**
 * Generation Polling Specification
 * Single Responsibility: Encapsulate business rules for when and how to poll generations
 * Domain Layer - Specification pattern for complex business rules
 */
export class GenerationPollingSpecification {
  
  /**
   * Check if a generation satisfies the criteria for active polling
   * Encapsulates complex business logic for polling decisions
   */
  static isSatisfiedBy(generation: Generation): boolean {
    return GenerationStatusDomainService.requiresPolling(generation);
  }

  /**
   * Check if multiple generations satisfy batching criteria
   * Business Rule: Efficient batching requires similar characteristics
   */
  static canBeBatched(generations: Generation[]): boolean {
    if (generations.length < 2) {
      return false;
    }

    // All generations must satisfy individual polling criteria
    const allNeedPolling = generations.every(g => this.isSatisfiedBy(g));
    if (!allNeedPolling) {
      return false;
    }

    // Check if they can be efficiently batched together
    return GenerationStatusDomainService.canBatchTogether(generations);
  }

  /**
   * Filter generations that need immediate attention (high priority)
   * Business Rule: Prioritize newly created generations
   */
  static filterHighPriority(generations: Generation[]): Generation[] {
    return generations.filter(generation => {
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      return priority === 'high';
    });
  }

  /**
   * Filter generations that need standard polling (medium priority)
   * Business Rule: Regular monitoring for active generations
   */
  static filterMediumPriority(generations: Generation[]): Generation[] {
    return generations.filter(generation => {
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      return priority === 'medium';
    });
  }

  /**
   * Filter generations that need minimal polling (low priority)
   * Business Rule: Reduced monitoring for older generations
   */
  static filterLowPriority(generations: Generation[]): Generation[] {
    return generations.filter(generation => {
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      return priority === 'low';
    });
  }

  /**
   * Check if a generation should be excluded from polling due to timeout
   * Business Rule: Stop polling generations that are stuck
   */
  static shouldExcludeFromPolling(generation: Generation): boolean {
    return GenerationStatusDomainService.shouldTimeout(generation) ||
           GenerationStatusDomainService.shouldStopMonitoring(generation);
  }

  /**
   * Group generations by optimal polling strategy
   * Business Rule: Organize generations for efficient batch processing
   */
  static groupByPollingStrategy(generations: Generation[]): {
    highPriority: Generation[];
    mediumPriority: Generation[];
    lowPriority: Generation[];
    excluded: Generation[];
  } {
    const highPriority: Generation[] = [];
    const mediumPriority: Generation[] = [];
    const lowPriority: Generation[] = [];
    const excluded: Generation[] = [];

    for (const generation of generations) {
      if (this.shouldExcludeFromPolling(generation)) {
        excluded.push(generation);
        continue;
      }

      if (!this.isSatisfiedBy(generation)) {
        excluded.push(generation);
        continue;
      }

      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      switch (priority) {
        case 'high':
          highPriority.push(generation);
          break;
        case 'medium':
          mediumPriority.push(generation);
          break;
        case 'low':
          lowPriority.push(generation);
          break;
        default:
          excluded.push(generation);
      }
    }

    return { highPriority, mediumPriority, lowPriority, excluded };
  }

  /**
   * Calculate optimal polling intervals for a group of generations
   * Business Rule: Balance responsiveness with resource efficiency
   */
  static calculateGroupPollingInterval(generations: Generation[]): number {
    if (generations.length === 0) {
      return 0;
    }

    // Single generation - use its specific interval
    if (generations.length === 1) {
      return GenerationStatusDomainService.calculatePollingInterval(generations[0]);
    }

    // Multiple generations - use the shortest interval needed
    const intervals = generations.map(g => 
      GenerationStatusDomainService.calculatePollingInterval(g)
    );

    // Filter out zero intervals (terminal statuses)
    const activeIntervals = intervals.filter(interval => interval > 0);
    
    if (activeIntervals.length === 0) {
      return 0;
    }

    // Use the shortest interval to ensure no generation is neglected
    return Math.min(...activeIntervals);
  }

  /**
   * Validate that polling configuration is within reasonable limits
   * Business Rule: Prevent resource exhaustion from overly aggressive polling
   */
  static validatePollingConfiguration(
    generationCount: number,
    pollingInterval: number
  ): { isValid: boolean; reason?: string } {
    // No polling needed for zero generations
    if (generationCount === 0) {
      return { isValid: true };
    }

    // Prevent overly aggressive polling
    const minInterval = 1000; // 1 second minimum
    if (pollingInterval < minInterval) {
      return {
        isValid: false,
        reason: `Polling interval ${pollingInterval}ms is too aggressive (minimum: ${minInterval}ms)`
      };
    }

    // Prevent excessive batch sizes
    const maxBatchSize = 25;
    if (generationCount > maxBatchSize) {
      return {
        isValid: false,
        reason: `Batch size ${generationCount} exceeds maximum (${maxBatchSize})`
      };
    }

    // Warn about potentially inefficient configurations
    const maxRecommendedCount = 15;
    if (generationCount > maxRecommendedCount) {
      return {
        isValid: true,
        reason: `Large batch size ${generationCount} may impact performance (recommended: <=${maxRecommendedCount})`
      };
    }

    return { isValid: true };
  }
} 