import { Asset, AssetValidationError } from './Asset';

/**
 * Factory for creating Asset instances from different data sources
 * Follows DDD Factory pattern - encapsulates complex object creation
 */
export class AssetFactory {
  /**
   * Creates an Asset instance from database data
   */
  static fromDatabaseRow(row: any): Asset {
    if (!row) {
      throw new AssetValidationError('Database row cannot be null or undefined.');
    }
    
    return new Asset({
      id: row.id,
      userId: row.user_id || row.userId,
      name: row.name,
      storagePath: row.storage_path || row.storagePath,
      mimeType: row.mime_type || row.mimeType,
      size: row.size,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: row.updated_at ? new Date(row.updated_at || row.updatedAt) : undefined,
      folderId: row.folder_id || row.folderId,
      organizationId: row.organization_id || row.organizationId,
      tags: row.tags,
      publicUrl: row.public_url || row.publicUrl,
      folderName: row.folder_name || row.folderName,
      userFullName: row.user_full_name || row.userFullName,
    });
  }

  /**
   * Creates an Asset instance for upload scenarios
   */
  static forUpload(data: {
    userId: string;
    name: string;
    storagePath: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
    organizationId: string;
  }): Asset {
    return new Asset({
      id: '', // Will be set by repository
      userId: data.userId,
      name: data.name,
      storagePath: data.storagePath,
      mimeType: data.mimeType,
      size: data.size,
      createdAt: new Date(),
      folderId: data.folderId,
      organizationId: data.organizationId,
    });
  }
} 
