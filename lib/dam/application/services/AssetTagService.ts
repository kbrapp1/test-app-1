import { toast } from 'sonner';
import type { PlainTag } from '../../application/dto/DamApiRequestDto';
import { RemoveTagFromAssetUseCase } from '../use-cases/tags/RemoveTagFromAssetUseCase';
import { SupabaseAssetRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseTagRepository } from '../../infrastructure/persistence/supabase/SupabaseTagRepository';
import { SupabaseAssetTagRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetTagRepository';
import { AuthContextFactory } from '../../infrastructure/composition/AuthContextFactory';

/**
 * Application service for asset tag operations
 * Handles business logic for adding/removing tags from assets
 */
export class AssetTagService {
  static async removeTagFromAsset(assetId: string, tagToRemove: PlainTag): Promise<void> {
    if (!assetId || !tagToRemove?.id) {
      throw new Error('Asset ID or Tag ID is missing');
    }

    const { supabase, activeOrgId } = await AuthContextFactory.getLegacyContext();
    
    const assetRepository = new SupabaseAssetRepository(supabase);
    const tagRepository = new SupabaseTagRepository(supabase);
    const assetTagRepository = new SupabaseAssetTagRepository(supabase);
    const removeTagUseCase = new RemoveTagFromAssetUseCase(assetRepository, tagRepository, assetTagRepository);

    await removeTagUseCase.execute({
      assetId,
      tagId: tagToRemove.id,
      organizationId: activeOrgId,
    });
  }

  static showTagAddedSuccess(tagName: string): void {
    toast.success('Tag added successfully', { 
      description: `"${tagName}" has been added to this asset.`,
      duration: 3000
    });
  }

  static showTagRemovedSuccess(tagName: string): void {
    toast.success('Tag removed', { 
      description: `"${tagName}" has been removed from this asset.`,
      duration: 3000
    });
  }

  static showTagRemoveError(error: Error): void {
    toast.error('Failed to remove tag', { 
      description: error.message || 'Please try again.'
    });
  }
} 
