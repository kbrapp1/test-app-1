import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../domain/value-objects';
import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '../../../supabase/client';

export class DeleteGenerationUseCase {
  private storageService: SupabaseStorageService;

  constructor(private readonly repository: GenerationRepository) {
    const supabase = createClient();
    this.storageService = new SupabaseStorageService(supabase);
  }

  async execute(generationId: string): Promise<Result<boolean, string>> {
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

      // 2. Clean up auto-saved storage file if it exists
      await this.cleanupAutoSavedImage(generation);

      // 3. Delete from database
      const deleteResult = await this.repository.delete(generationId);
      if (!deleteResult.isSuccess()) {
        return error(deleteResult.getError() || 'Failed to delete generation');
      }

      return success(true);
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
      console.warn('Failed to cleanup auto-saved image during deletion:', err);
      // Don't fail the deletion if cleanup fails
    }
  }
} 