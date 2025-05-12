import {
  createFolderInDb,
  updateFolderInDb,
  deleteFolderRecordInDb,
  getFolderById,
  type FolderDbRecord,
} from '@/lib/repositories/folder-repo';
import { type Folder } from '@/types/dam';
import { AppError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services';

// Helper to convert DB record to Folder app type
function dbRecordToAppFolder(dbRecord: FolderDbRecord): Folder {
  if (!dbRecord) {
    throw new AppError(ErrorCodes.UNEXPECTED_ERROR, 'DB record is null, cannot map to Folder.');
  }
  return {
    id: dbRecord.id,
    created_at: dbRecord.created_at,
    name: dbRecord.name,
    user_id: dbRecord.user_id,
    organization_id: dbRecord.organization_id,
    parent_folder_id: dbRecord.parent_folder_id,
    type: 'folder',
  };
}

export async function createFolderService(
  userId: string,
  organizationId: string,
  folderName: string,
  parentFolderId: string | null
): Promise<ServiceResult<{ folder: Folder }>> {
  if (!folderName || folderName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  try {
    const repoResult = await createFolderInDb({
      name: folderName.trim(),
      parentFolderId,
      userId,
      organizationId,
    });

    if (repoResult.error) {
      console.error('createFolderService: Repository Error', repoResult.error);
      const supabaseError = repoResult.error as any;
      if (supabaseError.code === '23505') {
        return { success: false, error: 'A folder with this name already exists in this location.', errorCode: ErrorCodes.DUPLICATE_ENTRY };
      }
      return { success: false, error: `Failed to create folder: ${supabaseError.message || 'Unknown repository error'}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    if (!repoResult.data) {
      console.error('createFolderService: Folder created but data not returned from repository.');
      return { success: false, error: 'Folder created but data was not returned from repository.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
    }

    const newFolder = dbRecordToAppFolder(repoResult.data);
    return { success: true, data: { folder: newFolder } };

  } catch (err: any) {
    console.error('createFolderService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function updateFolderService(
  organizationId: string,
  folderId: string,
  newName: string
): Promise<ServiceResult<{ folder: Folder }>> {
  if (!folderId) {
    return { success: false, error: 'Folder ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'New folder name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  try {
    const repoResult = await updateFolderInDb({
      folderId,
      newName: newName.trim(),
      organizationId,
    });

    if (repoResult.error) {
      console.error('updateFolderService: Repository Error', repoResult.error);
      const supabaseError = repoResult.error as any;
      if (supabaseError.code === '23505') {
        return { success: false, error: 'A folder with this name already exists in this location.', errorCode: ErrorCodes.DUPLICATE_ENTRY };
      }
      return { success: false, error: `Failed to update folder: ${supabaseError.message || 'Unknown repository error'}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    if (!repoResult.data) {
      console.warn('updateFolderService: Folder not found for update, or no changes made/RLS prevented.');
      return { success: false, error: 'Folder not found or you do not have permission to update it.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }

    const updatedFolder = dbRecordToAppFolder(repoResult.data);
    return { success: true, data: { folder: updatedFolder } };

  } catch (err: any) {
    console.error('updateFolderService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

interface DeleteFolderServiceResultData {
  deletedFolderId: string;
  parentFolderId: string | null;
}

export async function deleteFolderService(
  organizationId: string,
  folderId: string
): Promise<ServiceResult<DeleteFolderServiceResultData>> {
  if (!folderId) {
    return { success: false, error: 'Folder ID is required for deletion.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  try {
    const folderToFetch = await getFolderById(folderId, organizationId);

    if (folderToFetch.error) {
      console.error('deleteFolderService: Fetch Error before delete', folderToFetch.error);
      return { success: false, error: `Error finding folder to delete: ${folderToFetch.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    if (!folderToFetch.data) {
      return { success: false, error: 'Folder not found or you do not have permission to delete it.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    const parentFolderIdForReval = folderToFetch.data.parent_folder_id;
    const actualFolderId = folderToFetch.data.id;

    const repoResult = await deleteFolderRecordInDb({
      folderId: actualFolderId,
      organizationId,
    });

    if (repoResult.error) {
      console.error('deleteFolderService: Repository Delete Error', repoResult.error);
      const supabaseError = repoResult.error as any;
      if (supabaseError.code === '23503') {
        return { success: false, error: 'Cannot delete folder. It may not be empty or is referenced elsewhere.', errorCode: ErrorCodes.RESOURCE_CONFLICT };
      }
      return { success: false, error: `Failed to delete folder: ${supabaseError.message || 'Unknown repository error'}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    return { 
      success: true, 
      data: { 
        deletedFolderId: actualFolderId,
        parentFolderId: parentFolderIdForReval 
      }
    };

  } catch (err: any) {
    console.error('deleteFolderService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 