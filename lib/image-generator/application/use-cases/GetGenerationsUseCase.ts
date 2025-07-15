import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository, GenerationFilters } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../infrastructure/common/Result';

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

  async execute(options: GetGenerationsOptions): Promise<Result<Generation[]>> {
    try {
      let generations: Generation[];

      if (options.id) {
        // Get single generation by ID
        const generation = await this.generationRepository.getById(options.id);
        generations = generation ? [generation] : [];
      } else {
        // Get multiple generations with filters
        const filters = options.filters || {};
        generations = await this.generationRepository.getAll(filters);
      }

      return success(generations);
    } catch (err) {
      return error(`Failed to get generations: ${err instanceof Error ? err.message : err}`);
    }
  }
}