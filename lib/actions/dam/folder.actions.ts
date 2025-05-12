'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Folder } from '@/types/dam';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server'; // Still needed for auth

// Import Usecases
import { createFolderUsecase } from '@/lib/usecases/dam/createFolderUsecase';
import { updateFolderUsecase } from '@/lib/usecases/dam/updateFolderUsecase';
import { deleteFolderUsecase } from '@/lib/usecases/dam/deleteFolderUsecase';

// Import specific services needed for other actions until they are refactored
// import { updateFolderService, deleteFolderService } from '@/lib/services/dam-service';
// Keep repository import if still needed by actions for revalidation paths, etc.
import { getFolderById } from '@/lib/repositories/folder-repo';

interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: Folder;
}

// dbRecordToAppFolder helper is removed as this logic is now in the service layer.

export async function createFolder(
  prevState: FolderActionResult,
  formData: FormData
): Promise<FolderActionResult> {
  const folderName = formData.get('name') as string;
  const parentFolderIdValue = formData.get('parentFolderId') as string | null;
  const parentFolderId = parentFolderIdValue === '' || parentFolderIdValue === 'null' ? null : parentFolderIdValue;

  // Basic form validation remains in action
  if (!folderName || folderName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.' };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      console.error('createFolder Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('createFolder Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot create folder.' };
    }

    // Call the usecase
    const usecaseResult = await createFolderUsecase({
      userId: user.id,
      organizationId: activeOrgId,
      folderName: folderName.trim(), // Usecase might also trim, but good practice here too
      parentFolderId,
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('createFolder Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to create folder via usecase.' };
    }

    // Revalidation logic remains in action
    revalidatePath('/dam', 'layout');
    if (parentFolderId) {
      revalidatePath(`/dam/folders/${parentFolderId}`, 'layout');
    } else {
      // Revalidate root if parent is null. Explicitly revalidate /dam which covers root items.
      revalidatePath('/dam', 'layout'); 
    }
    
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

  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      console.error('updateFolder Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('updateFolder Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot update folder.' };
    }

    let parentFolderIdForReval: string | null | undefined = undefined;
    const { data: currentFolderData, error: fetchError } = await getFolderById(folderId, activeOrgId);

    if (fetchError) {
        console.warn('updateFolder Action: Fetch for revalidation path failed', fetchError);
    }
    if (currentFolderData) {
        parentFolderIdForReval = currentFolderData.parent_folder_id;
    }

    // Call the usecase
    const usecaseResult = await updateFolderUsecase({
      organizationId: activeOrgId,
      folderId,
      newName: newName.trim(),
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('updateFolder Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to update folder via usecase.' };
    }

    revalidatePath('/dam', 'layout');
    if (parentFolderIdForReval) {
      revalidatePath(`/dam/folders/${parentFolderIdForReval}`, 'layout');
    } else {
      revalidatePath('/dam', 'layout'); 
    }
    revalidatePath(`/dam/folders/${folderId}`, 'layout');

    return { success: true, folder: usecaseResult.data.folder };

  } catch (err: any) {
    console.error('updateFolder Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while updating the folder.' };
  }
}

export async function deleteFolder(
    prevState: FolderActionResult, 
    formData: FormData
): Promise<FolderActionResult> {
  const folderId = formData.get('folderId') as string;

  if (!folderId) {
    return { success: false, error: 'Folder ID is required for deletion.' };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      console.error('deleteFolder Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('deleteFolder Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot delete folder.' };
    }

    // Call the usecase
    const usecaseResult = await deleteFolderUsecase({
        organizationId: activeOrgId,
        folderId,
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('deleteFolder Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to delete folder via usecase.' };
    }

    // Revalidation using data from usecase (which gets it from service)
    revalidatePath('/dam', 'layout');
    const parentFolderIdFromUsecase = usecaseResult.data.parentFolderId;
    if (parentFolderIdFromUsecase) {
      revalidatePath(`/dam/folders/${parentFolderIdFromUsecase}`, 'layout');
    } else {
      revalidatePath('/dam', 'layout');
    }

    return { success: true, folderId: usecaseResult.data.deletedFolderId, parentFolderId: parentFolderIdFromUsecase };

  } catch (err: any) {
    console.error('deleteFolder Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while deleting the folder.' };
  }
} 