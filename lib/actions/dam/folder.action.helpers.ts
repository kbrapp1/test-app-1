import { revalidatePath, revalidateTag } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Folder as FolderType } from '@/lib/dam/domain/entities/Folder';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import { UpdateFolderUseCase } from '@/lib/dam/application/use-cases/UpdateFolderUseCase';
import { DeleteFolderUseCase } from '@/lib/dam/application/use-cases/DeleteFolderUseCase';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';

// Moved from folder.actions.ts
export interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: FolderType;
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
    
    // Use SupabaseFolderRepository directly instead of getFolderById
    const supabase = createSupabaseUserClient();
    const folderRepository = new SupabaseFolderRepository(supabase);
    const currentFolder = await folderRepository.findById(folderId);
    
    if (currentFolder) {
      parentFolderIdForReval = currentFolder.parentFolderId;
    } else {
      console.warn('_coreUpdateFolder: Failed to fetch folder for revalidation path');
    }

    try {
      // Use the new UpdateFolderUseCase
      const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
      const updatedFolder = await updateFolderUseCase.execute({
        folderId,
        name: newName.trim(),
        organizationId: activeOrgId
      });

      _revalidatePathsForFolderMutation(parentFolderIdForReval, folderId);
      return { success: true, folder: updatedFolder };
    } catch (error: any) {
      console.error('_coreUpdateFolder: Use Case Error', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update folder.' 
      };
    }

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
    // Use SupabaseFolderRepository directly if needed for other operations
    const supabase = createSupabaseUserClient();
    const folderRepository = new SupabaseFolderRepository(supabase);
    
    try {
      // Use the new DeleteFolderUseCase
      const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);
      
      // Get the folder before deleting it to know its parent
      const folderToDelete = await folderRepository.findById(folderId);
      if (!folderToDelete) {
        return { success: false, error: `Folder with ID "${folderId}" not found.` };
      }
      
      const parentFolderId = folderToDelete.parentFolderId;
      
      // Execute the delete operation
      await deleteFolderUseCase.execute({
        folderId,
        organizationId: activeOrgId
      });

      _revalidatePathsForFolderMutation(parentFolderId, folderId);
      return { 
        success: true, 
        folderId: folderId, 
        parentFolderId: parentFolderId 
      };
    } catch (error: any) {
      console.error('_coreDeleteFolder: Use Case Error', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete folder.' 
      };
    }

  } catch (err: any) {
    console.error('_coreDeleteFolder: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while deleting the folder.' };
  }
} 