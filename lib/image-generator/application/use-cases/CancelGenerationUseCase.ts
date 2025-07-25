import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { ImageGenerationProvider } from '../../domain/repositories/ImageGenerationProvider';
import { Result, success, error } from '../../domain/value-objects';
import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '../../../supabase/client';

export class CancelGenerationUseCase {
  private storageService: SupabaseStorageService;

  constructor(
    private readonly repository: GenerationRepository,
    private readonly provider: ImageGenerationProvider
  ) {
    const supabase = createClient();
    this.storageService = new SupabaseStorageService(supabase);
  }

  async execute(id: string): Promise<Result<Generation, string>> {
    try {
      if (!id || typeof id !== 'string') {
        return error('Generation ID is required');
      }

      // 1. Get generation from repository
      const getResult = await this.repository.findById(id);
      if (!getResult.isSuccess()) {
        return error(getResult.getError() || 'Failed to fetch generation');
      }

      const generation = getResult.getValue();
      if (!generation) {
        return error('Generation not found');
      }

      // 2. Check if generation can be cancelled
      if (generation.isCompleted() || generation.isFailed()) {
        return error('Cannot cancel completed or failed generation');
      }

      // 3. Cancel with provider if there's a prediction ID
      const generationData = generation.toData();
      if (generationData.externalProviderId) {
        try {
          await this.provider.cancelGeneration(generationData.externalProviderId);
        } catch (providerError) {
          console.warn('Failed to cancel with provider:', providerError);
          // Continue with local cancellation even if provider fails
        }
      }

      // 4. Clean up any auto-saved storage files
      await this.cleanupAutoSavedImage(generation);

      // 5. Update generation status to cancelled
      generation.updateStatus(generation.getStatus().transitionTo('cancelled'));
      
      const updateResult = await this.repository.update(generation);
      if (!updateResult.isSuccess()) {
        return error(updateResult.getError() || 'Failed to update generation status');
      }

      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  private async cleanupAutoSavedImage(generation: Generation): Promise<void> {
    try {
      // Check if this generation has an auto-saved image (storage URL instead of provider URL)
      const generationData = generation.toData();
      const resultUrl = generationData.resultImageUrl;
      if (resultUrl && resultUrl.includes('/storage/v1/object/public/assets/')) {
        // This is an auto-saved image, delete it from storage
        // Extract the storage path from the URL
        const urlParts = resultUrl.split('/storage/v1/object/public/assets/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          await this.storageService.removeFile(storagePath);
        }
      }
    } catch (err) {
      console.warn('Failed to cleanup auto-saved image:', err);
      // Don't fail the cancellation if cleanup fails
    }
  }
} 