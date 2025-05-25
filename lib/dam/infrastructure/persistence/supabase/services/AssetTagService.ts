import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Asset Tag Service
 * Follows Single Responsibility Principle - only handles tag-related operations
 */
export class AssetTagService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get asset IDs that match the specified tag IDs
   */
  async getAssetIdsForTags(tagIds?: string[]): Promise<string[] | 'no_match' | 'error' | null> {
    if (!tagIds || tagIds.length === 0) {
      return null;
    }

    try {
      const { data: matchingAssetIds, error } = await this.supabase
        .from('asset_tags')
        .select('asset_id')
        .in('tag_id', tagIds);

      if (error) {
        console.error('Tag filter subquery error:', error);
        return 'error';
      }

      if (matchingAssetIds && matchingAssetIds.length > 0) {
        return matchingAssetIds.map(r => r.asset_id);
      }

      return 'no_match';
    } catch (error) {
      console.error('Error in tag search:', error);
      return 'error';
    }
  }

  /**
   * Validate tag IDs format
   */
  validateTagIds(tagIds?: string[]): { valid: boolean; error?: string } {
    if (!tagIds || tagIds.length === 0) {
      return { valid: true };
    }

    for (const tagId of tagIds) {
      if (!tagId || typeof tagId !== 'string' || tagId.trim().length === 0) {
        return { 
          valid: false, 
          error: 'Invalid tag ID format' 
        };
      }
    }

    return { valid: true };
  }
} 
