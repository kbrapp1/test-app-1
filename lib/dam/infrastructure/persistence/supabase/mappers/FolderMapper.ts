import { Folder } from '../../../../domain/entities/Folder';

// This interface represents the raw data structure from the Supabase 'folders' table,
// including any transformations or joined data (like has_children count).
export interface RawFolderDbRecord {
  id: string;
  name: string;
  parent_folder_id: string | null;
  organization_id: string;
  user_id: string;
  created_at: string; // ISO date string
  updated_at: string | null; // Changed from updated_at?: string | null;
  has_children?: Array<{ count: number }> | boolean; // Flexible to handle Supabase count
  // Add any other direct column names from your 'folders' table or common views
  // path?: string; // Example, if path was directly on the table
}

export class FolderMapper {
  static toDomain(raw: RawFolderDbRecord): Folder {
    let hasChildren = false;
    if (raw.has_children && Array.isArray(raw.has_children) && raw.has_children.length > 0) {
      hasChildren = raw.has_children[0].count > 0;
    } else if (typeof raw.has_children === 'number') { // Fallback if it comes as a direct count
      hasChildren = raw.has_children > 0;
    }
    // Add other potential formats for has_children if necessary based on your Supabase queries

    // Sanitize the folder name to handle existing data that might have invalid characters
    const sanitizedName = this.sanitizeFolderName(raw.name);

    // Use Folder constructor to create a proper class instance
    return new Folder({
      id: raw.id,
      name: sanitizedName,
      parentFolderId: raw.parent_folder_id,
      organizationId: raw.organization_id,
      userId: raw.user_id,
      createdAt: new Date(raw.created_at),
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
      has_children: hasChildren,
    });
  }

  /**
   * Sanitizes folder names from existing database data to make them compatible with domain validation
   */
  private static sanitizeFolderName(name: string): string {
    if (!name || typeof name !== 'string') {
      return 'Unnamed Folder';
    }

    // Replace invalid characters with safe alternatives
    let sanitized = name
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[:"]/g, '') // Remove colons and quotes  
      .replace(/[/\\|]/g, '-') // Replace path separators and pipes with dashes
      .replace(/[?*]/g, '') // Remove wildcards
      .replace(/[\x00-\x1f]/g, '') // Remove control characters
      .trim();

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

    // Ensure the name isn't empty after sanitization
    if (sanitized.length === 0) {
      sanitized = 'Sanitized Folder';
    }

    // Ensure it doesn't exceed length limits
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }

    // Log a warning if sanitization was needed
    if (sanitized !== name) {
      console.warn(`Folder name sanitized: "${name}" -> "${sanitized}"`);
    }

    return sanitized;
  }

  static toPersistence(folder: Partial<Folder>): Partial<RawFolderDbRecord> {
    const persistenceData: Partial<RawFolderDbRecord> = {};

    if (folder.id !== undefined) persistenceData.id = folder.id;
    if (folder.name !== undefined) persistenceData.name = folder.name;
    if (Object.prototype.hasOwnProperty.call(folder, 'parentFolderId')) {
        persistenceData.parent_folder_id = folder.parentFolderId;
    }
    if (folder.organizationId !== undefined) persistenceData.organization_id = folder.organizationId;
    if (folder.userId !== undefined) persistenceData.user_id = folder.userId;
    // 'has_children' is typically derived, not set directly during persistence of a Folder entity.
    // 'createdAt' and 'updatedAt' are usually handled by the database.
    return persistenceData;
  }

  static toCreatePersistence(
    folderData: Pick<Folder, 'name' | 'organizationId' | 'userId'> & Partial<Pick<Folder, 'parentFolderId'>>
  ): Omit<RawFolderDbRecord, 'id' | 'created_at' | 'updated_at' | 'has_children'> {
    const record: Omit<RawFolderDbRecord, 'id' | 'created_at' | 'updated_at' | 'has_children'> = {
      name: folderData.name,
      organization_id: folderData.organizationId,
      user_id: folderData.userId,
      parent_folder_id: null,
    };
    if (Object.prototype.hasOwnProperty.call(folderData, 'parentFolderId')) {
      record.parent_folder_id = folderData.parentFolderId ?? null;
    }
    return record;
  }

  // Specific mapper for update operations which might only allow certain fields
  static toUpdatePersistence(
    data: Partial<Pick<Folder, 'name' | 'parentFolderId'>>
  ): Partial<Pick<RawFolderDbRecord, 'name' | 'parent_folder_id'>> {
    const persistenceRecord: Partial<Pick<RawFolderDbRecord, 'name' | 'parent_folder_id'>> = {};
    if (data.name !== undefined) {
      persistenceRecord.name = data.name;
    }
    // parentFolderId can be explicitly null (for root) or a string (for a parent)
    // If it's undefined in the partial input, we don't set it.
    // If it's present (string or null), we map it.
    if (Object.prototype.hasOwnProperty.call(data, 'parentFolderId')) {
        persistenceRecord.parent_folder_id = data.parentFolderId;
    }
    return persistenceRecord;
  }

  static fromDomainToRawFolderDbRecord(folder: Folder): RawFolderDbRecord {
    const raw: RawFolderDbRecord = {
      id: folder.id,
      name: folder.name,
      parent_folder_id: folder.parentFolderId === undefined ? null : folder.parentFolderId,
      organization_id: folder.organizationId,
      user_id: folder.userId,
      created_at: folder.createdAt.toISOString(),
      updated_at: folder.updatedAt?.toISOString() || null,
      // has_children count is usually part of specific query selects, not directly stored in a way that maps back here
      // If it needs to be represented, it would typically come from a query joining and counting children.
      // For simplicity, this mapper focuses on core folder fields. If `has_children` is on the domain Folder object as boolean:
      has_children: folder.has_children ? [{ count: 1 }] : [{ count: 0 }] // Represent as array for consistency with some queries
    };
    return raw;
  }

  static fromDomainToRawApiArray(folders: Folder[]): RawFolderDbRecord[] {
    return folders.map(folder => FolderMapper.fromDomainToRawFolderDbRecord(folder));
  }
} 
