'use server';

import { Folder } from '@/lib/dam/domain/entities/Folder';
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

// Import new use case
import { CreateFolderUseCase } from '@/lib/dam/application/use-cases/CreateFolderUseCase';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';

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
    // Create a repository instance
    const supabase = createSupabaseUserClient();
    const folderRepository = new SupabaseFolderRepository(supabase);
    
    // Create the use case
    const createFolderUseCase = new CreateFolderUseCase(folderRepository);
    
    // Execute the use case
    const newFolder = await createFolderUseCase.execute({
      name: folderName.trim(),
      parentFolderId,
      organizationId: activeOrgId!,
      userId: user!.id
    });

    _revalidatePathsForFolderMutation(parentFolderId, newFolder.id);
    
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
    const errorMessage = typeof authResult.errorResult.error === 'string' 
      ? authResult.errorResult.error 
      : 'Authorization failed.';
    return { success: false, error: errorMessage, errorCode: ErrorCodes.UNAUTHORIZED };
  }
  const { activeOrgId } = authResult; 
  const supabase = createSupabaseUserClient();
  const folderRepository = new SupabaseFolderRepository(supabase);

  try {
    const domainFolders = await folderRepository.findAllByOrganizationId(activeOrgId!);
    
    const pickerFolders = domainFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parent_folder_id: folder.parentFolderId || null, // Map to snake_case for existing consumers
    }));

    return { success: true, data: pickerFolders };
  } catch (err: any) {
    console.error('getFoldersForPicker: Error using folder repository', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 