import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../infrastructure/common/Result';
import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '../../../supabase/server';

export class AutoSaveGenerationUseCase {
  private storageService: SupabaseStorageService;

  constructor(private readonly repository: GenerationRepository) {
    // Use server client for auto-save operations - same as DAM operations
    const supabase = createClient();
    this.storageService = new SupabaseStorageService(supabase);
  }

  async execute(generationId: string): Promise<Result<Generation, string>> {
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

      // 2. Check if generation is completed and has a result image
      if (!generation.isCompleted() || !generation.resultImageUrl) {
        return error('Generation is not completed or missing result image');
      }

      // 3. Download and save the image to user storage
      try {
        // Download the image from provider URL
        const imageResponse = await fetch(generation.resultImageUrl);
        if (!imageResponse.ok) {
          return error('Failed to download generated image');
        }
        
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], `${generation.getId()}.webp`, {
          type: 'image/webp'
        });

        // Get the auto-save storage path
        const storagePath = generation.getAutoSaveStoragePath();
        
        // Upload to assets bucket
        const uploadResult = await this.storageService.uploadFile(imageFile, storagePath);
        
        // Update generation with permanent storage URL
        generation.setAutoSavedImageUrl(uploadResult.publicUrl || '');
        
        // Save updated generation
        const updateResult = await this.repository.update(generation);
        if (!updateResult.isSuccess()) {
          return error(updateResult.getError() || 'Failed to update generation');
        }

        return success(generation);
        
      } catch (err) {
        return error(`Failed to auto-save image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }
} 