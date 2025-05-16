import { revalidatePath, revalidateTag } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Folder } from '@/types/dam'; 
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import { getFolderById } from '@/lib/repositories/folder-repo';
import { updateFolderUsecase } from '@/lib/usecases/dam/updateFolderUsecase';
import { deleteFolderUsecase } from '@/lib/usecases/dam/deleteFolderUsecase';

// Moved from folder.actions.ts
export interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: Folder;
}

// Helper function for authentication and organization ID retrieval
export async function _authenticateAndGetOrgId(actionName: string): Promise<{
  user?: import('@supabase/supabase-js').User;
  activeOrgId?: string;
  errorResult?: FolderActionResult;
}> {
  const supabaseAuthClient = createSupabaseUserClient();
  const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
  if (authError || !user) {
    console.error(`${actionName} Action: Auth Error`, authError);
    return { errorResult: { success: false, error: 'User not authenticated.' } };
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    console.error(`${actionName} Action: Active Organization ID not found.`);
    return { errorResult: { success: false, error: 'Active organization not found.' } };
  }
  return { user, activeOrgId };
}

// Helper function for revalidation after folder mutations (create, update, rename)
export function _revalidatePathsForFolderMutation(
  parentFolderId?: string | null,
  folderId?: string
) {
  revalidatePath('/dam', 'layout');
  revalidateTag('dam-folder-tree');

  if (parentFolderId) {
    revalidatePath(`/dam/folders/${parentFolderId}`, 'layout');
  } else {
    revalidatePath('/dam', 'layout'); 
  }

  if (folderId) {
    revalidatePath(`/dam/folders/${folderId}`, 'layout');
  }
}

// Core logic for updating a folder
export async function _coreUpdateFolder(
  folderId: string,
  newName: string,
  activeOrgId: string
): Promise<FolderActionResult> {
  try {
    let parentFolderIdForReval: string | null | undefined = undefined;
    const { data: currentFolderData, error: fetchError } = await getFolderById(folderId, activeOrgId);
    if (fetchError) {
      console.warn('_coreUpdateFolder: Fetch for revalidation path failed', fetchError);
    }
    if (currentFolderData) {
      parentFolderIdForReval = currentFolderData.parent_folder_id;
    }

    const usecaseResult = await updateFolderUsecase({
      organizationId: activeOrgId,
      folderId,
      newName: newName.trim(),
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('_coreUpdateFolder: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to update folder via usecase.' };
    }

    _revalidatePathsForFolderMutation(parentFolderIdForReval, folderId);
    return { success: true, folder: usecaseResult.data.folder };

  } catch (err: any) {
    console.error('_coreUpdateFolder: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while updating the folder.' };
  }
}

// Core logic for deleting a folder
export async function _coreDeleteFolder(
  folderId: string,
  activeOrgId: string
): Promise<FolderActionResult> {
  try {
    const usecaseResult = await deleteFolderUsecase({
      organizationId: activeOrgId,
      folderId,
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('_coreDeleteFolder: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to delete folder via usecase.' };
    }

    _revalidatePathsForFolderMutation(usecaseResult.data.parentFolderId, folderId);
    return { 
      success: true, 
      folderId: usecaseResult.data.deletedFolderId, 
      parentFolderId: usecaseResult.data.parentFolderId 
    };

  } catch (err: any) {
    console.error('_coreDeleteFolder: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while deleting the folder.' };
  }
} 