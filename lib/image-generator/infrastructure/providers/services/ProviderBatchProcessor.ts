import { Generation } from '../../../domain/entities/Generation';
import { success, error, Result } from '../../../domain/value-objects';

/**
 * Infrastructure Layer - ProviderBatchProcessor handles grouping and batch workflows
 * Single Responsibility: Group generations by provider and coordinate individual checks
 * Golden Rule DDD: Extract batch logic from orchestrator into focused service
 */
export class ProviderBatchProcessor {
  /**
   * Group generations by provider name for efficient batch handling
   */
  groupByProvider(generations: Generation[]): Map<string, Generation[]> {
    const grouped = new Map<string, Generation[]>();
    generations.forEach(gen => {
      const name = gen.providerName.toLowerCase();
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(gen);
    });
    return grouped;
  }

  /**
   * Process a batch of generations using provided check function
   */
  async processBatchForProvider(
    generations: Generation[],
    checkFn: (generation: Generation) => Promise<Result<Generation, string>>
  ): Promise<Result<Generation[], string>> {
    const results = await Promise.all(generations.map(checkFn));
    const updated: Generation[] = [];
    const errors: string[] = [];

    results.forEach(res => {
      if (res.isSuccess()) updated.push(res.getValue());
      else errors.push(res.getError());
    });

    if (errors.length > 0 && updated.length === 0) {
      return error(`Batch provider check failed: ${errors.join(', ')}`);
    }

    return success(updated);
  }
} 