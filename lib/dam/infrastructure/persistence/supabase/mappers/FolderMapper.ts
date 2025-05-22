import { Folder } from '../../../../domain/entities/Folder';

// This interface represents the raw data structure from the Supabase 'folders' table,
// including any transformations or joined data (like has_children count).
export interface RawFolderDbRecord {
  id: string;
  name: string;
  parent_folder_id?: string | null;
  organization_id: string;
  user_id: string;
  created_at: string; // ISO date string
  updated_at?: string | null; // ISO date string
  has_children?: Array<{ count: number }> | any; // Flexible to handle Supabase count
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

    return {
      id: raw.id,
      name: raw.name,
      parentFolderId: raw.parent_folder_id,
      organizationId: raw.organization_id,
      userId: raw.user_id,
      createdAt: new Date(raw.created_at),
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
      has_children: hasChildren,
    };
  }

  static toPersistence(folder: Partial<Folder>): any {
    const persistenceData: any = {};

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
  ): any {
    const record: Partial<RawFolderDbRecord> = {
      name: folderData.name,
      organization_id: folderData.organizationId,
      user_id: folderData.userId,
    };
    if (Object.prototype.hasOwnProperty.call(folderData, 'parentFolderId')) {
      record.parent_folder_id = folderData.parentFolderId;
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
} 