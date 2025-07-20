import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { GenerationStats, Result, success, error } from '../../domain/value-objects';

export class GetGenerationStatsUseCase {
  constructor(private repository: GenerationRepository) {}

  async execute(userId: string, organizationId: string): Promise<Result<GenerationStats, string>> {
    try {
      const statsResult = await this.repository.getStats(userId, organizationId);
      
      if (!statsResult.isSuccess()) {
        return error(statsResult.getError() || 'Failed to get generation statistics');
      }

      return success(statsResult.getValue());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return error(errorMessage);
    }
  }
} 