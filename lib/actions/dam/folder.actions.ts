'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder'; // Renamed to avoid conflict
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services';
import { PlainFolder } from '@/lib/dam/types/dam.types';

// Import Use Cases
import { CreateFolderUseCase } from '@/lib/dam/application/use-cases/CreateFolderUseCase';
import { UpdateFolderUseCase } from '@/lib/dam/application/use-cases/UpdateFolderUseCase';
import { DeleteFolderUseCase } from '@/lib/dam/application/use-cases/DeleteFolderUseCase';

// Define UpdateFolderUseCaseParams locally as it's not exported from the use case file
interface UpdateFolderActionParams {
  folderId: string;
  name?: string; 
  parentFolderId?: string | null; 
  organizationId: string;
  // userId is NOT part of UpdateFolderUseCase's direct params
}

// Import Repositories
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';

// Action Result Type (can be shared or moved to a types file if used by other action groups)
export interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: PlainFolder; // Use PlainFolder instead of DomainFolder for serialization
}

// --- Start: Executor Pattern ---

// Internal helper for authentication and organization ID retrieval
async function getAuthenticatedUserAndOrgInternal(
  supabaseClient: SupabaseClient
): Promise<{ user?: User; userId?: string; activeOrgId?: string; error?: string }> {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { error: 'User not authenticated' };
  }
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return { error: 'Active organization not found.' };
  }
  return { user, userId: user.id, activeOrgId };
}

// Arguments for the core logic function of an action
interface FolderActionCoreLogicArgs<TParams, TData extends FolderActionResult> {
  supabase: SupabaseClient;
  activeOrgId: string;
  userId: string;
  user: User;
  params: TParams;
}

// Configuration for the folder action executor
interface FolderActionConfig<TParams, TData extends FolderActionResult> {
  actionName: string;
  params: TParams;
  validateParams: (params: TParams) => string | undefined; // Returns error message if invalid
  executeCoreLogic: (args: FolderActionCoreLogicArgs<TParams, TData>) => Promise<TData>;
}

// Folder Action Executor
async function executeFolderAction<TParams, TData extends FolderActionResult>(
  config: FolderActionConfig<TParams, TData>
): Promise<TData> {
  const validationError = config.validateParams(config.params);
  if (validationError) {
    // Ensure the return type matches TData, which extends FolderActionResult
    return { success: false, error: validationError } as TData;
  }

  const supabase = createSupabaseUserClient();
  try {
    const authResult = await getAuthenticatedUserAndOrgInternal(supabase);
    if (authResult.error || !authResult.activeOrgId || !authResult.userId || !authResult.user) {
      return { success: false, error: authResult.error || 'Authentication or organization check failed.' } as TData;
    }

    return await config.executeCoreLogic({
      supabase,
      activeOrgId: authResult.activeOrgId,
      userId: authResult.userId,
      user: authResult.user,
      params: config.params,
    });

  } catch (err: any) {
    console.error(`${config.actionName} (Folder Action Executor): Unexpected error`, err.message, err.stack);
    return { success: false, error: `An unexpected error occurred in ${config.actionName}.` } as TData;
  }
}
// --- End: Executor Pattern ---

// --- Start: Shared Helper Functions ---
// Helper function for revalidation after folder mutations
function revalidatePathsAfterFolderMutation(
  parentFolderId?: string | null,
  folderId?: string
) {
  revalidatePath('/dam', 'layout');
  revalidateTag('dam-folder-tree'); // For components that might use this tag

  if (parentFolderId) {
    revalidatePath(`/dam/folders/${parentFolderId}`, 'layout');
  } else {
    // If no parent, it's a root folder, revalidate the base DAM path
    revalidatePath('/dam', 'layout'); 
  }

  if (folderId) {
    revalidatePath(`/dam/folders/${folderId}`, 'layout');
  }
}
// --- End: Shared Helper Functions ---


// --- Start: Refactored Folder Actions ---

export async function createFolderAction(
  prevState: FolderActionResult | null,
  formData: FormData
): Promise<FolderActionResult> {
  const folderName = formData.get('name') as string;
  const parentFolderIdValue = formData.get('parentFolderId') as string | null;
  const parentFolderId = parentFolderIdValue === '' || parentFolderIdValue === 'null' ? null : parentFolderIdValue;

  return executeFolderAction({
    actionName: 'createFolderAction',
    params: { folderName, parentFolderId },
    validateParams: (params) => {
      if (!params.folderName || params.folderName.trim() === '') {
        return 'Folder name cannot be empty.';
      }
      return undefined;
    },
    executeCoreLogic: async ({ supabase, activeOrgId, userId, params }) => {
      try {
        const folderRepository = new SupabaseFolderRepository(supabase);
        const createFolderUseCase = new CreateFolderUseCase(folderRepository);
        
        const newFolder = await createFolderUseCase.execute({
          name: params.folderName.trim(),
          parentFolderId: params.parentFolderId,
          organizationId: activeOrgId,
          userId: userId,
        });

        revalidatePathsAfterFolderMutation(params.parentFolderId, newFolder.id);
        return { success: true, folder: newFolder.toPlainObject(), folderId: newFolder.id, parentFolderId: params.parentFolderId };
      } catch (error: any) {
        console.error('createFolderAction CoreLogic Error:', error);
        return { success: false, error: error.message || 'Failed to create folder.' };
      }
    },
  });
}

export async function updateFolderAction(
  prevState: FolderActionResult | null, 
  formData: FormData
): Promise<FolderActionResult> {
  const folderId = formData.get('folderId') as string;
  const newName = formData.get('newNameInput') as string;

  if (!folderId) {
    return { success: false, error: 'Folder ID is required.' };
  }
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'New folder name cannot be empty.' };
  }

  try {
    const supabase = createSupabaseUserClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // user is still needed for context if actions require it generally, but not for these specific use case params
    if (userError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const folderRepository = new SupabaseFolderRepository(supabase);
    const updateUseCase = new UpdateFolderUseCase(folderRepository);

    // Construct params for UpdateFolderUseCase
    // Note: userId is not part of UpdateFolderUseCaseParams
    const params: UpdateFolderActionParams = { // Use the locally defined interface
      folderId,
      name: newName.trim(),
      organizationId,
      // parentFolderId is undefined, so it defaults to not moving. Only name is changed.
    };

    const updatedFolder = await updateUseCase.execute(params);
    
    // Revalidate paths - consider if UpdateFolderUseCase should handle this
    // For now, mirroring the simplified revalidation from create/delete
    revalidatePath('/dam', 'layout'); 
    if (updatedFolder.parentFolderId) {
      revalidateTag(`folder-${updatedFolder.parentFolderId}-children`);
    }
    revalidateTag(`folder-${updatedFolder.id}-details`);

    return { 
      success: true, 
      folder: updatedFolder.toPlainObject(), // Convert to plain object for serialization
      folderId: updatedFolder.id, 
      parentFolderId: updatedFolder.parentFolderId 
    };

  } catch (error: any) {
    console.error('Error in updateFolderAction:', error);
    let errorMessage = 'Failed to update folder.';
    if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// Client-side action for renaming (doesn't use FormData)
export async function renameFolderClientAction(
  folderId: string,
  newName: string
): Promise<FolderActionResult> {
   return executeFolderAction({
    actionName: 'renameFolderClientAction',
    params: { folderId, newName },
    validateParams: (params) => {
      if (!params.folderId) return 'Folder ID is required.';
      if (!params.newName || params.newName.trim() === '') return 'New folder name cannot be empty.';
      return undefined;
    },
    executeCoreLogic: async ({ supabase, activeOrgId, params }) => {
      try {
        const folderRepository = new SupabaseFolderRepository(supabase);
        const currentFolder = await folderRepository.findById(params.folderId, activeOrgId); // For revalidation
        const oldParentFolderId = currentFolder?.parentFolderId;

        const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
        const updatedFolder = await updateFolderUseCase.execute({
          folderId: params.folderId,
          name: params.newName.trim(),
          organizationId: activeOrgId,
        });
        revalidatePathsAfterFolderMutation(oldParentFolderId, updatedFolder.id);
        return { success: true, folder: updatedFolder.toPlainObject(), folderId: updatedFolder.id };
      } catch (error: any) {
        console.error('renameFolderClientAction CoreLogic Error:', error);
        return { success: false, error: error.message || 'Failed to rename folder.' };
      }
    },
  });
}


export async function deleteFolderAction(
  prevState: FolderActionResult | null,
  formData: FormData
): Promise<FolderActionResult> {
  const folderId = formData.get('folderId') as string;

  return executeFolderAction({
    actionName: 'deleteFolderAction',
    params: { folderId },
    validateParams: (params) => {
      if (!params.folderId) return 'Folder ID is required for deletion.';
      return undefined;
    },
    executeCoreLogic: async ({ supabase, activeOrgId, params }) => {
      try {
        const folderRepository = new SupabaseFolderRepository(supabase);
        const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);

        // Get parentFolderId for revalidation before deleting
        const folderToDelete = await folderRepository.findById(params.folderId, activeOrgId);
        if (!folderToDelete) {
          // This case should ideally be caught by the use case, but good to double check
          return { success: false, error: 'Folder not found for deletion.' };
        }
        const parentIdForReval = folderToDelete.parentFolderId;

        await deleteFolderUseCase.execute({
          folderId: params.folderId,
          organizationId: activeOrgId,
        });

        revalidatePathsAfterFolderMutation(parentIdForReval, params.folderId);
        // Return parentFolderId for UI to potentially navigate or refresh
        return { success: true, folderId: params.folderId, parentFolderId: parentIdForReval };
      } catch (error: any) {
        console.error('deleteFolderAction CoreLogic Error:', error);
        return { success: false, error: error.message || 'Failed to delete folder.' };
      }
    },
  });
}

// If deleteFolderClient is meant to be a simpler API
export async function deleteFolderClientAction(
  folderId: string
): Promise<FolderActionResult> {
  return executeFolderAction({
    actionName: 'deleteFolderClientAction',
    params: { folderId },
    validateParams: (params) => {
      if (!params.folderId) return 'Folder ID is required for deletion.';
      return undefined;
    },
    executeCoreLogic: async ({ supabase, activeOrgId, params }) => {
      try {
        const folderRepository = new SupabaseFolderRepository(supabase);
        const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);
        const folderToDelete = await folderRepository.findById(params.folderId, activeOrgId);
        const parentIdForReval = folderToDelete?.parentFolderId;

        await deleteFolderUseCase.execute({
          folderId: params.folderId,
          organizationId: activeOrgId,
        });
        revalidatePathsAfterFolderMutation(parentIdForReval, params.folderId);
        return { success: true, folderId: params.folderId, parentFolderId: parentIdForReval };
      } catch (error: any) {
        console.error('deleteFolderClientAction CoreLogic Error:', error);
        return { success: false, error: error.message || 'Failed to delete folder.' };
      }
    },
  });
}


// --- End: Refactored Folder Actions ---

// --- Start: Read-Only Actions (Can remain separate or use a simpler read-executor) ---
export async function getFoldersForPickerAction(): Promise<ServiceResult<{ id: string; name: string; parent_folder_id: string | null }[]>> {
  // This action can use a simplified auth check if not using the full executor
  const supabase = createSupabaseUserClient();
  const authResult = await getAuthenticatedUserAndOrgInternal(supabase);

  if (authResult.error || !authResult.activeOrgId) {
    return { 
      success: false, 
      error: authResult.error || 'Authorization or organization check failed for picker.',
      errorCode: ErrorCodes.UNAUTHORIZED 
    };
  }
  const { activeOrgId } = authResult;
  const folderRepository = new SupabaseFolderRepository(supabase);

  try {
    const domainFolders = await folderRepository.findAllByOrganizationId(activeOrgId);
    
    const pickerFolders = domainFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parent_folder_id: folder.parentFolderId || null,
    }));

    return { success: true, data: pickerFolders };
  } catch (err: any) {
    console.error('getFoldersForPickerAction: Error using folder repository', err);
    return { 
      success: false, 
      error: err.message || 'An unexpected error occurred while fetching folders for picker.',
      errorCode: ErrorCodes.UNEXPECTED_ERROR 
    };
  }
}
// --- End: Read-Only Actions --- 