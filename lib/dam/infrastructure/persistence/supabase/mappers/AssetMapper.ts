import { Asset } from '../../../../domain/entities/Asset';
import { Tag } from '../../../../domain/entities/Tag';

// This type might come from Supabase generated types or be manually defined based on asset.db.repo.ts
export interface RawAssetDbRecord {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  user_id: string;
  organization_id: string;
  folder_id: string | null;
  storage_path: string;
  mime_type: string;
  size: number;
  asset_tags: Array<{ tags: RawTagDbRecord | null }> | null; // Removed optional '?'
  // Potentially other raw fields from the 'assets' table
}

export interface RawTagDbRecord {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  organization_id: string;
}

export class AssetMapper {
  static toDomain(raw: RawAssetDbRecord): Asset {
    const tags: Tag[] = (raw.asset_tags || [])
      .map(at => at.tags)
      .filter(Boolean)
      .map(rawTag => ({
        id: rawTag!.id,
        name: rawTag!.name,
        userId: rawTag!.user_id,
        createdAt: new Date(rawTag!.created_at),
        organizationId: rawTag!.organization_id,
      }));

    return {
      id: raw.id,
      userId: raw.user_id,
      name: raw.name,
      storagePath: raw.storage_path,
      mimeType: raw.mime_type,
      size: raw.size,
      createdAt: new Date(raw.created_at),
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
      folderId: raw.folder_id,
      organizationId: raw.organization_id,
      tags: tags.length > 0 ? tags : undefined,
    };
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

  static fromDomainToRawApi(asset: Asset): RawAssetDbRecord {
    let mappedAssetTags: Array<{ tags: RawTagDbRecord | null }> | null = null;

    if (asset.tags && asset.tags.length > 0) {
      mappedAssetTags = asset.tags.map(tag => {
        // Convert domain Tag back to RawTagDbRecord structure
        const rawTag: RawTagDbRecord = {
          id: tag.id,
          name: tag.name,
          user_id: tag.userId,
          created_at: tag.createdAt.toISOString(),
          organization_id: tag.organizationId,
        };
        return { tags: rawTag };
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
      updated_at: asset.updatedAt ? asset.updatedAt.toISOString() : new Date().toISOString(),
      folder_id: asset.folderId === undefined ? null : asset.folderId,
      organization_id: asset.organizationId,
      asset_tags: mappedAssetTags, // Use the mapped tags
    };
  }

  static fromDomainToRawApiArray(assets: Asset[]): RawAssetDbRecord[] {
    return assets.map(asset => AssetMapper.fromDomainToRawApi(asset));
  }
} 