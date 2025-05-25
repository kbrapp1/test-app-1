import { SupabaseClient } from '@supabase/supabase-js';
import { IAssetTagRepository } from '../../../domain/repositories/IAssetTagRepository';
import { Tag } from '../../../domain/entities/Tag';
import { TagMapper, RawTagDbRecord } from './mappers/TagMapper'; // Assuming TagMapper exists and exports RawTagDbRecord
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/errors/base';

// Assumed structure for the asset_tags join table
interface AssetTagLink {
  asset_id: string;
  tag_id: string;
}

export class SupabaseAssetTagRepository implements IAssetTagRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createSupabaseServerClient();
  }

  async linkTagToAsset(assetId: string, tagId: string, organizationId: string, userId?: string): Promise<boolean> {
    const linkData: AssetTagLink = {
      asset_id: assetId,
      tag_id: tagId,
    };

    const { error } = await this.supabase.from('asset_tags').insert(linkData);

    if (error) {
      console.error('Error linking tag to asset:', error.message);
      // Consider checking for unique constraint violation (e.g., P2002 in Prisma, 23505 in Postgres) 
      // and returning true or specific error if the link already exists.
      // For now, any error is a failure.
      throw new DatabaseError('Could not link tag to asset.', error.message);
    }
    return true;
  }

  async unlinkTagFromAsset(assetId: string, tagId: string, organizationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('asset_tags')
      .delete()
      .eq('asset_id', assetId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error unlinking tag from asset:', error.message);
      throw new DatabaseError('Could not unlink tag from asset.', error.message);
    }
    // Supabase delete doesn't error if no rows match, it just results in count 0.
    // We consider it successful if no error occurs.
    return true;
  }

  async findTagsByAssetId(assetId: string, organizationId: string): Promise<Tag[]> {
    const { data, error } = await this.supabase
      .from('asset_tags')
      .select(`
        tags (*)
      `)
      .eq('asset_id', assetId);
      // Note: The tags selected via (*) should also be implicitly filtered by RLS on the 'tags' table if set up.

    if (error) {
      console.error('Error finding tags by asset ID:', error.message);
      throw new DatabaseError('Could not retrieve tags for asset.', error.message);
    }
    if (!data) {
      return [];
    }

    const tags = data
      .map(assetTagLink => (assetTagLink as any).tags) // Extract the nested tag object
      .filter(rawTag => rawTag !== null) // Filter out cases where the join might have resulted in a null tag
      .map(rawTag => TagMapper.toDomain(rawTag as RawTagDbRecord)); // Map to domain entity
    
    return tags;
  }

  async findAssetIdsByTagId(tagId: string, organizationId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('asset_tags')
      .select('asset_id')
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error finding asset IDs by tag ID:', error.message);
      throw new DatabaseError('Could not retrieve asset IDs for tag.', error.message);
    }
    return data ? data.map(link => link.asset_id) : [];
  }

  async updateTagsForAsset(assetId: string, tagIds: string[], organizationId: string, userId: string): Promise<boolean> {
    // 1. Delete existing tag links for the asset
    const { error: deleteError } = await this.supabase
      .from('asset_tags')
      .delete()
      .eq('asset_id', assetId);

    if (deleteError) {
      console.error('Error deleting existing tags for asset:', deleteError.message);
      throw new DatabaseError('Could not update tags for asset (delete step failed).', deleteError.message);
    }

    // 2. Insert new tag links if there are any tags to add
    if (tagIds.length > 0) {
      const linksToCreate: AssetTagLink[] = tagIds.map(tagId => ({
        asset_id: assetId,
        tag_id: tagId,
      }));

      const { error: insertError } = await this.supabase.from('asset_tags').insert(linksToCreate);
      if (insertError) {
        console.error('Error inserting new tags for asset:', insertError.message);
        // Potentially, old tags are deleted but new ones failed. This is not truly transactional here.
        // A stored procedure (rpc) would be better for atomicity.
        throw new DatabaseError('Could not update tags for asset (insert step failed).', insertError.message);
      }
    }
    return true;
  }

  async isTagLinked(tagId: string, organizationId: string): Promise<boolean> {
    // We only need to check if at least one link exists for the tag within the organization.
    // RLS should handle organization scoping if asset_tags table is linked to assets/tags that have org_id.
    // For a direct check, we can count.
    const { count, error } = await this.supabase
      .from('asset_tags')
      .select('tag_id', { count: 'exact', head: true })
      .eq('tag_id', tagId);
      // .eq('organization_id', organizationId); // This might be redundant if RLS is effective or if asset_tags doesn't have org_id directly.
      // If asset_tags doesn't have organization_id, we might need a join or RPC to ensure org scope.
      // For now, assuming direct check on tag_id is sufficient and RLS on related tables handles org security.

    if (error) {
      console.error('Error checking if tag is linked:', error.message);
      throw new DatabaseError('Could not determine if tag is linked to assets.', error.message);
    }
    return (count || 0) > 0;
  }
} 
