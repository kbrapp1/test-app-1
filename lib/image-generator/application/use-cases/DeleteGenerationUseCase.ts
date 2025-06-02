import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../infrastructure/common/Result';
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
      const resultUrl = generation.resultImageUrl;
      if (resultUrl && resultUrl.includes('/storage/v1/object/public/assets/')) {
        // This is an auto-saved image, delete it from storage
        const storagePath = generation.getAutoSaveStoragePath();
        await this.storageService.removeFile(storagePath);
      }
    } catch (err) {
      console.warn('Failed to cleanup auto-saved image during deletion:', err);
      // Don't fail the deletion if cleanup fails
    }
  }
} 