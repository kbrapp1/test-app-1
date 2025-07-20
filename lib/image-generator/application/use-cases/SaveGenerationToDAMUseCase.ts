// Save Generation to DAM Use Case - DDD Application Layer  
// Single Responsibility: Orchestrate saving image generation results to DAM
// Following Golden Rule: Use case coordinates domain objects and application services

import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../domain/value-objects';
import { DAMIntegrationApplicationService } from '../services/DAMIntegrationService';
import { GenerationDisplayService } from '../../domain/services/GenerationDisplayService';

export class SaveGenerationToDAMUseCase {
  constructor(
    private readonly repository: GenerationRepository,
    private readonly damIntegrationService: DAMIntegrationApplicationService
  ) {}

  async execute(generationId: string, folderId?: string): Promise<Result<Generation, string>> {
    try {
      if (!generationId || typeof generationId !== 'string') {
        return error('Generation ID is required');
      }

      // 1. Get generation from repository
      const getResult = await this.repository.findById(generationId);
      if (!getResult.isSuccess()) {
        return error(getResult.getError() || 'Failed to fetch generation');
      }

      const generation = getResult.getValue();
      if (!generation) {
        return error('Generation not found');
      }

      // 2. Check if generation can be saved to DAM
      if (!generation.canSaveToDAM()) {
        return error('Generation cannot be saved to DAM (not completed or already saved)');
      }

      // 3. Save generated image to DAM using application service
      const damResult = await this.damIntegrationService.saveGeneratedImageToDAM(
        generation.resultImageUrl!,
        generation.organizationId,
        generation.userId,
        GenerationDisplayService.getDisplayTitle(generation),
        generation.id,
        folderId
      );

      if (!damResult.isSuccess()) {
        return error(damResult.getError() || 'Failed to save to DAM');
      }

      const savedAsset = damResult.getValue();
      
      // 4. Link generation to DAM asset
      generation.linkToDAMAsset(savedAsset.id);
      
      const updateResult = await this.repository.update(generation);
      if (!updateResult.isSuccess()) {
        return error(updateResult.getError() || 'Failed to update generation');
      }

      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }
} 