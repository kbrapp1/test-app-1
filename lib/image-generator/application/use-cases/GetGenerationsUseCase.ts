import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository, GenerationFilters } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../infrastructure/common/Result';

export interface GetGenerationsFilters extends GenerationFilters {
  // Additional filters can be added here
}

export interface GetGenerationsOptions {
  /** Get a single generation by ID */
  id?: string;
  /** Get multiple generations with filters */
  filters?: GetGenerationsFilters;
}

export class GetGenerationsUseCase {
  constructor(private readonly repository: GenerationRepository) {}

  /**
   * Execute the use case - can get single or multiple generations
   * @param options - Either { id } for single or { filters } for multiple
   * @returns Result with single Generation or array of Generations
   */
  async execute(options: GetGenerationsOptions = {}): Promise<Result<Generation | Generation[], string>> {
    try {
      // Handle single generation by ID
      if (options.id) {
        if (typeof options.id !== 'string') {
          return error('Generation ID must be a string');
        }

        const result = await this.repository.findById(options.id);
        
        if (!result.isSuccess()) {
          return error(result.getError() || 'Failed to fetch generation');
        }

        const generation = result.getValue();
        if (!generation) {
          return error('Generation not found');
        }

        return success(generation);
      }

      // Handle multiple generations with filters
      const filters = options.filters || {};
      const result = await this.repository.findMany(filters);
      
      if (!result.isSuccess()) {
        return error(result.getError() || 'Failed to fetch generations');
      }

      return success(result.getValue());
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  /**
   * Convenience method to get a single generation by ID
   */
  async getById(id: string): Promise<Result<Generation, string>> {
    const result = await this.execute({ id });
    
    if (!result.isSuccess()) {
      return error(result.getError());
    }

    const value = result.getValue();
    if (Array.isArray(value)) {
      return error('Unexpected array result for single ID lookup');
    }

    return success(value);
  }

  /**
   * Convenience method to get multiple generations with filters
   */
  async getMany(filters: GetGenerationsFilters = {}): Promise<Result<Generation[], string>> {
    const result = await this.execute({ filters });
    
    if (!result.isSuccess()) {
      return error(result.getError());
    }

    const value = result.getValue();
    if (!Array.isArray(value)) {
      return error('Unexpected single result for filtered lookup');
    }

    return success(value);
  }
} 