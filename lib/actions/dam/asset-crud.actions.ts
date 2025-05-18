'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Import Usecases
import { moveAssetUsecase } from '@/lib/usecases/dam/moveAssetUsecase';
import { deleteAssetUsecase } from '@/lib/usecases/dam/deleteAssetUsecase';
import { renameAssetUsecase } from '@/lib/usecases/dam/renameAssetUsecase';
import { addTagToAssetUsecase } from '@/lib/usecases/dam/addTagToAssetUsecase';
import { removeTagFromAssetUsecase } from '@/lib/usecases/dam/removeTagFromAssetUsecase';

// Generic Action Result Type
export type GenericActionResult<TData = void> = 
  | { success: true; data?: TData }
  | { success: false; error: string; data?: TData }; // Allow data even on error for some cases

// Internal helper for authentication and organization ID retrieval
async function getAuthenticatedUserAndOrg(
  supabaseClient: SupabaseClient
): Promise<{ user?: User; activeOrgId?: string; error?: string; userId?: string }> {
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
interface ActionCoreLogicArgs<TParams, TData> {
  supabase: SupabaseClient;
  activeOrgId: string;
  userId: string;
  user: User; // Pass the full user object if needed by core logic
  params: TParams;
}

// Configuration for the asset action executor
interface AssetActionConfig<TParams, TData> {
  actionName: string;
  params: TParams;
  validateParams: (params: TParams) => string | undefined; // Returns error message if invalid
  executeCoreLogic: (args: ActionCoreLogicArgs<TParams, TData>) => Promise<GenericActionResult<TData>>;
}

// Asset Action Executor
async function executeAssetAction<TParams, TData>(
  config: AssetActionConfig<TParams, TData>
): Promise<GenericActionResult<TData>> {
  const validationError = config.validateParams(config.params);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = createSupabaseUserClient();
  try {
    const authResult = await getAuthenticatedUserAndOrg(supabase);
    if (authResult.error || !authResult.activeOrgId || !authResult.userId || !authResult.user) {
      return { success: false, error: authResult.error || 'Authentication or organization check failed.' };
    }

    return await config.executeCoreLogic({
      supabase,
      activeOrgId: authResult.activeOrgId,
      userId: authResult.userId,
      user: authResult.user, // Pass the user object
      params: config.params,
    });

  } catch (err: any) {
    console.error(`${config.actionName} (Action Executor): Unexpected error`, err.message, err.stack);
    return { success: false, error: `An unexpected error occurred in ${config.actionName}.` };
  }
}

// Refactored Actions

export async function moveAsset(
  assetId: string,
  targetFolderId: string | null
): Promise<GenericActionResult> {
  return executeAssetAction({
    actionName: 'moveAsset',
    params: { assetId, targetFolderId },
    validateParams: ({ assetId }) => {
      if (!assetId) return 'Missing asset ID.';
      // targetFolderId can be null, so no specific validation here unless required
      return undefined;
    },
    executeCoreLogic: async ({ activeOrgId, params }) => {
      const usecaseResult = await moveAssetUsecase({
        organizationId: activeOrgId,
        assetId: params.assetId,
        targetFolderId: params.targetFolderId,
      });
      if (!usecaseResult.success) {
        console.error('moveAsset: Usecase Error', usecaseResult.error);
        return { success: false, error: usecaseResult.error || 'Failed to move asset.' };
      }
      revalidatePath('/dam', 'layout');
      return { success: true };
    },
  });
}

export async function deleteAsset(
  assetId: string
): Promise<GenericActionResult<{ folderId: string | null }>> {
  return executeAssetAction({
    actionName: 'deleteAsset',
    params: { assetId },
    validateParams: ({ assetId }) => {
      if (!assetId) return 'Asset ID is required.';
      return undefined;
    },
    executeCoreLogic: async ({ activeOrgId, params }) => {
      const usecaseResult = await deleteAssetUsecase({
        organizationId: activeOrgId,
        assetId: params.assetId,
      });
      if (!usecaseResult.success || !usecaseResult.data) {
        console.error('deleteAsset: Usecase Error', usecaseResult.error);
        return { success: false, error: usecaseResult.error || 'Failed to delete asset.' };
      }
      revalidatePath('/dam', 'layout');
      if (usecaseResult.data.folderId) {
        revalidatePath(`/dam/folders/${usecaseResult.data.folderId}`, 'layout');
      }
      return { success: true, data: { folderId: usecaseResult.data.folderId || null } };
    },
  });
}

export async function renameAssetClient(
  assetId: string,
  newName: string
): Promise<GenericActionResult<{ id: string; name: string }>> {
  return executeAssetAction({
    actionName: 'renameAssetClient',
    params: { assetId, newName },
    validateParams: ({ assetId, newName }) => {
      if (!assetId) return 'Asset ID is required.';
      if (!newName || newName.trim().length === 0) return 'New name is required.';
      return undefined;
    },
    executeCoreLogic: async ({ activeOrgId, params }) => {
      const usecaseResult = await renameAssetUsecase({
        organizationId: activeOrgId,
        assetId: params.assetId,
        newName: params.newName,
      });

      if (!usecaseResult.success || !usecaseResult.data) {
        console.error(
          `renameAssetClient: Usecase Error (Code: ${usecaseResult.errorCode || 'N/A'})`,
          usecaseResult.error
        );
        return { 
          success: false, 
          error: usecaseResult.error || 'Failed to rename asset via usecase.'
        };
      }
      
      revalidatePath('/dam', 'layout');
      return { success: true, data: usecaseResult.data };
    },
  });
}

// No longer needed: export interface AssetTagActionResult { success: boolean; error?: string; }

export async function addTagToAsset(
  formData: FormData
): Promise<GenericActionResult> {
  return executeAssetAction({
    actionName: 'addTagToAsset',
    params: { 
      assetId: formData.get('assetId') as string, 
      tagId: formData.get('tagId') as string 
    },
    validateParams: ({ assetId, tagId }) => {
      if (!assetId) return 'Asset ID is required.';
      if (!tagId) return 'Tag ID is required.';
      return undefined;
    },
    executeCoreLogic: async ({ activeOrgId, params }) => {
      const usecaseResult = await addTagToAssetUsecase({
        organizationId: activeOrgId,
        assetId: params.assetId,
        tagId: params.tagId,
      });

      if (!usecaseResult.success) {
        console.error(
          `addTagToAsset: Usecase Error (Code: ${usecaseResult.errorCode || 'N/A'})`,
          usecaseResult.error
        );
        return { 
          success: false, 
          error: usecaseResult.error || 'Failed to add tag to asset via usecase.'
        };
      }
      revalidatePath('/dam', 'layout');
      return { success: true }; // Usecase returns null data on success
    },
  });
}

export async function removeTagFromAsset(
  formData: FormData
): Promise<GenericActionResult> {
  return executeAssetAction({
    actionName: 'removeTagFromAsset',
    params: { 
      assetId: formData.get('assetId') as string, 
      tagId: formData.get('tagId') as string 
    },
    validateParams: ({ assetId, tagId }) => {
      if (!assetId) return 'Asset ID is required.';
      if (!tagId) return 'Tag ID is required.';
      return undefined;
    },
    executeCoreLogic: async ({ activeOrgId, params }) => {
      const usecaseResult = await removeTagFromAssetUsecase({
        organizationId: activeOrgId,
        assetId: params.assetId,
        tagId: params.tagId,
      });

      if (!usecaseResult.success) {
        console.error(
          `removeTagFromAsset: Usecase Error (Code: ${usecaseResult.errorCode || 'N/A'})`,
          usecaseResult.error
        );
        return { 
          success: false, 
          error: usecaseResult.error || 'Failed to remove tag from asset via usecase.'
        };
      }
      revalidatePath('/dam', 'layout');
      return { success: true }; // Usecase returns null data on success
    },
  });
} 