import { Generation } from '../../domain/entities/Generation';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../infrastructure/common/Result';
import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
import { SupabaseAssetRepository } from '../../../dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { createClient } from '../../../supabase/client';

export class SaveGenerationToDAMUseCase {
  private storageService: SupabaseStorageService;
  private assetRepository: SupabaseAssetRepository;

  constructor(private readonly repository: GenerationRepository) {
    const supabase = createClient();
    this.storageService = new SupabaseStorageService(supabase);
    this.assetRepository = new SupabaseAssetRepository(supabase);
  }

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

      // 3. Download the generated image and save to DAM
      try {
        // Download the image from Replicate URL
        const imageResponse = await fetch(generation.resultImageUrl!);
        if (!imageResponse.ok) {
          return error('Failed to download generated image');
        }
        
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], `generated-${generation.getId()}.webp`, {
          type: 'image/webp'
        });

        // Generate storage path: org/user/generated-images/filename
        const storagePath = `${generation.organizationId}/${generation.userId}/generated-images/${imageFile.name}`;
        
        // Upload to assets bucket
        const uploadResult = await this.storageService.uploadFile(imageFile, storagePath);
        
        // Create DAM asset record
        const assetData = {
          userId: generation.userId,
          name: generation.getDisplayTitle(),
          storagePath: uploadResult.storagePath,
          mimeType: 'image/webp',
          size: imageFile.size,
          folderId: folderId || null,
          organizationId: generation.organizationId,
        };

                 const savedAsset = await this.assetRepository.save(assetData);
         const assetId = savedAsset.id;

         // 4. Link generation to DAM asset
         generation.linkToDAMAsset(assetId);
         
       } catch (err) {
         return error(`Failed to save image to DAM: ${err instanceof Error ? err.message : 'Unknown error'}`);
       }
      
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