import { SupabaseClient } from '@supabase/supabase-js';
import { Asset } from '../../../../domain/entities/Asset';

/**
 * Asset URL Service
 * Follows Single Responsibility Principle - only handles asset URL operations
 */
export class AssetUrlService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Add public URL to an asset
   */
  addPublicUrlToAsset(asset: Asset): Asset {
    if (!asset.storagePath) {
      return asset;
    }

    try {
      const { data: urlData } = this.supabase.storage
        .from('assets')
        .getPublicUrl(asset.storagePath);

      // Create a new Asset instance with the publicUrl since it's readonly
      return new Asset({
        id: asset.id,
        userId: asset.userId,
        name: asset.name,
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        folderId: asset.folderId,
        folderName: asset.folderName,
        organizationId: asset.organizationId,
        tags: asset.tags,
        publicUrl: urlData.publicUrl,
        userFullName: asset.userFullName,
      });
    } catch (error) {
      console.warn(`Failed to get public URL for ${asset.storagePath}:`, error);
      return asset; // Return original asset without publicUrl
    }
  }

  /**
   * Get public URL for a storage path
   */
  getPublicUrl(storagePath: string): string | null {
    try {
      const { data: urlData } = this.supabase.storage
        .from('assets')
        .getPublicUrl(storagePath);

      return urlData.publicUrl;
    } catch (error) {
      console.warn(`Failed to get public URL for ${storagePath}:`, error);
      return null;
    }
  }

  /**
   * Validate storage path format
   */
  validateStoragePath(storagePath: string): { valid: boolean; error?: string } {
    if (!storagePath || typeof storagePath !== 'string') {
      return { 
        valid: false, 
        error: 'Storage path is required and must be a string' 
      };
    }

    if (storagePath.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Storage path cannot be empty' 
      };
    }

    // Basic path validation - no leading/trailing slashes, no double slashes
    if (storagePath.startsWith('/') || storagePath.endsWith('/')) {
      return { 
        valid: false, 
        error: 'Storage path should not start or end with slash' 
      };
    }

    if (storagePath.includes('//')) {
      return { 
        valid: false, 
        error: 'Storage path should not contain double slashes' 
      };
    }

    return { valid: true };
  }
} 
