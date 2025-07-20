import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository, GenerationFilters } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../domain/value-objects';

export type GetGenerationsFilters = GenerationFilters & {
  // Additional filters can be added here
  // Currently inherits all filters from GenerationFilters
  extensionPlaceholder?: never;
};

export interface GetGenerationsOptions {
  /** Get a single generation by ID */
  id?: string;
  /** Get multiple generations with filters */
  filters?: GetGenerationsFilters;
}

export class GetGenerationsUseCase {
  constructor(private generationRepository: GenerationRepository) {}

  /**
   * Get multiple generations with filters - optimized for React Query integration
   */
  async getMany(filters: GetGenerationsFilters = {}): Promise<Result<Generation[], string>> {
    try {
      const result = await this.generationRepository.findMany(filters);
      if (!result.isSuccess()) {
        return error(result.getError() || 'Failed to fetch generations');
      }
      
      return success(result.getValue());
    } catch (err) {
      return error(`Failed to get generations: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Get single generation by ID - optimized for React Query integration
   */
  async getById(id: string): Promise<Result<Generation | null, string>> {
    try {
      const result = await this.generationRepository.findById(id);
      if (!result.isSuccess()) {
        return error(result.getError() || 'Failed to fetch generation');
      }
      
      return success(result.getValue());
    } catch (err) {
      return error(`Failed to get generation: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Legacy execute method - kept for backward compatibility
   */
  async execute(options: GetGenerationsOptions): Promise<Result<Generation[], string>> {
    try {
      if (options.id) {
        // Get single generation by ID using optimized method
        const result = await this.getById(options.id);
        if (!result.isSuccess()) {
          return error(result.getError());
        }
        const generation = result.getValue();
        return success(generation ? [generation] : []);
      } else {
        // Get multiple generations with filters using optimized method
        const filters = options.filters || {};
        return await this.getMany(filters);
      }
    } catch (err) {
      return error(`Failed to get generations: ${err instanceof Error ? err.message : err}`);
    }
  }
}