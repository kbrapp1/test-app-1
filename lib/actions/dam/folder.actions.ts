'use server';

import { Folder } from '@/types/dam';
import {
  _authenticateAndGetOrgId,
  _revalidatePathsForFolderMutation, // This is used by createFolder directly
  _coreUpdateFolder,
  _coreDeleteFolder,
  FolderActionResult // Import the interface
} from './folder.action.helpers';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server'; // Added for direct use
import { type ServiceResult } from '@/types/services'; // Added import
import { ErrorCodes } from '@/lib/errors/constants'; // Added import

// Import Usecases (only createFolderUsecase is directly used here now)
import { createFolderUsecase } from '@/lib/usecases/dam/createFolderUsecase';

// getFolderById is no longer needed here directly, it's used in helpers
// import { getFolderById } from '@/lib/repositories/folder-repo';

export async function createFolder(
  prevState: FolderActionResult,
  formData: FormData
): Promise<FolderActionResult> {
  const folderName = formData.get('name') as string;
  const parentFolderIdValue = formData.get('parentFolderId') as string | null;
  const parentFolderId = parentFolderIdValue === '' || parentFolderIdValue === 'null' ? null : parentFolderIdValue;

  if (!folderName || folderName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.' };
  }

  const authResult = await _authenticateAndGetOrgId('createFolder');
  if (authResult.errorResult) {
    return authResult.errorResult;
  }
  const { user, activeOrgId } = authResult;

  try {
    const usecaseResult = await createFolderUsecase({
      userId: user!.id,
      organizationId: activeOrgId!,
      folderName: folderName.trim(),
      parentFolderId,
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('createFolder Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to create folder via usecase.' };
    }

    _revalidatePathsForFolderMutation(parentFolderId, usecaseResult.data.folder.id);
    
    const newFolder = usecaseResult.data.folder;
    return { success: true, folder: newFolder, folderId: newFolder.id };

  } catch (err: any) {
    console.error('createFolder Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while creating the folder.' };
  }
}

export async function updateFolder(
  prevState: FolderActionResult,
  formData: FormData
): Promise<FolderActionResult> {
  const folderId = formData.get('folderId') as string;
  const newName = formData.get('newName') as string;

  if (!folderId) {
    return { success: false, error: 'Folder ID is required.' };
  }
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'New folder name cannot be empty.' };
  }

  const authResult = await _authenticateAndGetOrgId('updateFolder');
  if (authResult.errorResult) {
    return authResult.errorResult;
  }
  const { activeOrgId } = authResult;

  return _coreUpdateFolder(folderId, newName, activeOrgId!);
}

export async function deleteFolder(
    prevState: FolderActionResult, 
    formData: FormData
): Promise<FolderActionResult> {
  const folderId = formData.get('folderId') as string;

  if (!folderId) {
    return { success: false, error: 'Folder ID is required for deletion.' };
  }

  const authResult = await _authenticateAndGetOrgId('deleteFolder');
  if (authResult.errorResult) {
    return authResult.errorResult;
  }
  const { activeOrgId } = authResult;
  
  return _coreDeleteFolder(folderId, activeOrgId!);
}

export async function renameFolderClient(
  folderId: string,
  newName: string
): Promise<FolderActionResult> {
  if (!folderId) {
    return { success: false, error: 'Folder ID is required.' };
  }
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'New folder name cannot be empty.' };
  }

  const authResult = await _authenticateAndGetOrgId('renameFolderClient');
  if (authResult.errorResult) {
    return authResult.errorResult;
  }
  const { activeOrgId } = authResult;

  return _coreUpdateFolder(folderId, newName, activeOrgId!);
}

export async function deleteFolderClient(
  folderId: string
): Promise<FolderActionResult> {
  if (!folderId) {
    return { success: false, error: 'Folder ID is required for deletion.' };
  }

  const authResult = await _authenticateAndGetOrgId('deleteFolderClient');
  if (authResult.errorResult) {
    return authResult.errorResult;
  }
  const { activeOrgId } = authResult;
  
  return _coreDeleteFolder(folderId, activeOrgId!);
}

export async function getFoldersForPicker(): Promise<ServiceResult<{ id: string; name: string; parent_folder_id: string | null }[]>> {
  const authResult = await _authenticateAndGetOrgId('getFoldersForPicker');
  if (authResult.errorResult) {
    // Ensure errorResult.error is a string, provide a fallback if necessary
    const errorMessage = typeof authResult.errorResult.error === 'string' 
      ? authResult.errorResult.error 
      : 'Authorization failed.';
    return { success: false, error: errorMessage, errorCode: ErrorCodes.UNAUTHORIZED };
  }
  // activeOrgId is guaranteed if errorResult is not present due to _authenticateAndGetOrgId logic
  const { activeOrgId } = authResult; 
  const supabase = createSupabaseUserClient(); // Create client instance here

  try {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name, parent_folder_id')
      .eq('organization_id', activeOrgId!) // activeOrgId is checked by _authenticateAndGetOrgId
      .order('name', { ascending: true });

    if (error) {
      console.error('getFoldersForPicker: Supabase error', error);
      return { success: false, error: error.message, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('getFoldersForPicker: Unexpected error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 