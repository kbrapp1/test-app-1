import { Asset } from '../../../../domain/entities/Asset';
import { AssetFactory as _AssetFactory } from '../../../../domain/entities/AssetFactory';
import { Tag } from '../../../../domain/entities/Tag';
import { TagFactory } from '../../../../domain/entities/TagFactory';

// This type might come from Supabase generated types or be manually defined based on asset.db.repo.ts
export interface RawAssetDbRecord {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  user_id: string;
  organization_id: string;
  folder_id: string | null;
  folder_name?: string | null;
  storage_path: string;
  mime_type: string;
  size: number;
  asset_tags: Array<{ tags: RawTagDbRecord | null }> | null; // Raw tag records from database
  user?: { full_name: string | null } | null; // User profile information
  // Potentially other raw fields from the 'assets' table
}

export interface RawTagDbRecord {
  id: string;
  name: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  updated_at?: string | null;
}

export class AssetMapper {
  static toDomain(raw: RawAssetDbRecord): Asset {
    // Convert raw tag database records to Tag domain entities
    const tags: Tag[] = (raw.asset_tags || [])
      .map(at => at.tags)
      .filter((rawTag): rawTag is RawTagDbRecord => rawTag !== null)
      .map(rawTag => TagFactory.fromDatabaseRow({
        id: rawTag.id,
        name: rawTag.name,
        user_id: rawTag.user_id,
        organization_id: rawTag.organization_id,
        created_at: rawTag.created_at,
        updated_at: rawTag.updated_at || undefined
      }));

    // Sanitize the asset name to handle existing data that might have invalid characters
    const sanitizedName = this.sanitizeAssetName(raw.name);

    // Create Asset using constructor directly since we need to pass tags
    return new Asset({
      id: raw.id,
      userId: raw.user_id,
      name: sanitizedName,
      storagePath: raw.storage_path,
      mimeType: raw.mime_type,
      size: raw.size,
      createdAt: new Date(raw.created_at),
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
      folderId: raw.folder_id,
      organizationId: raw.organization_id,
      tags: tags.length > 0 ? tags : undefined,
      publicUrl: undefined, // Will be computed elsewhere
      folderName: raw.folder_name || undefined,
      userFullName: raw.user?.full_name || undefined,
    });
  }

  /**
   * Sanitizes asset names from existing database data to make them compatible with domain validation
   */
  private static sanitizeAssetName(name: string): string {
    if (!name || typeof name !== 'string') {
      return 'Unnamed Asset';
    }

    // Replace invalid characters with safe alternatives
    let sanitized = name
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[:"]/g, '') // Remove colons and quotes  
      .replace(/[/\\|]/g, '-') // Replace path separators and pipes with dashes
      .replace(/[?*]/g, '') // Remove wildcards
      .replace(/[\x00-\x1f]/g, '') // Remove control characters
      .trim();

    // Ensure the name isn't empty after sanitization
    if (sanitized.length === 0) {
      sanitized = 'Sanitized Asset';
    }

    // Ensure it doesn't exceed length limits
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }

    // Log a warning if sanitization was needed
    // if (sanitized !== name) {
    //   console.warn(`Asset name sanitized: "${name}" -> "${sanitized}"`);
    // }

    return sanitized;
  }

  static toPersistence(asset: Asset): Omit<RawAssetDbRecord, 'id' | 'created_at' | 'updated_at' | 'asset_tags'> {
    // This is for creating/updating. 'id' is usually handled by DB or set separately.
    // 'created_at', 'updated_at' are typically managed by the database.
    // 'asset_tags' would be handled via junction table operations, not directly here.
    return {
      name: asset.name,
      user_id: asset.userId,
      organization_id: asset.organizationId,
      folder_id: asset.folderId === undefined ? null : asset.folderId, // Ensure null if undefined
      storage_path: asset.storagePath,
      mime_type: asset.mimeType,
      size: asset.size,
    };
  }

  // This method now aims to produce a structure compatible with RawAssetFromApi
  static fromDomainToRawApi(asset: Asset): RawAssetDbRecord {
    let apiCompatibleAssetTags: Array<{ tags: RawTagDbRecord | null }> | null = null;

    if (asset.tags && asset.tags.length > 0) {
      apiCompatibleAssetTags = asset.tags.map(tag => {
        return { 
          tags: {
            id: tag.id,
            name: tag.name,
            user_id: tag.userId,
            organization_id: tag.organizationId,
            created_at: tag.createdAt.toISOString(),
            updated_at: tag.updatedAt ? tag.updatedAt.toISOString() : null,
          }
        };
      });
    }

    return {
      id: asset.id,
      user_id: asset.userId,
      name: asset.name,
      storage_path: asset.storagePath,
      mime_type: asset.mimeType,
      size: asset.size,
      created_at: asset.createdAt.toISOString(),
      // Ensure updated_at is string | null for compatibility with RawAssetFromApi
      updated_at: asset.updatedAt ? asset.updatedAt.toISOString() : null,
      folder_id: asset.folderId === undefined ? null : asset.folderId,
      organization_id: asset.organizationId,
      asset_tags: apiCompatibleAssetTags,
    };
  }

  static fromDomainToRawApiArray(assets: Asset[]): RawAssetDbRecord[] {
    return assets.map(asset => AssetMapper.fromDomainToRawApi(asset));
  }
} 
