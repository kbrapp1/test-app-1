'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Import new use cases
import { MoveAssetUseCase } from '@/lib/dam/application/use-cases/MoveAssetUseCase';
import { DeleteAssetUseCase } from '@/lib/dam/application/use-cases/DeleteAssetUseCase';
import { RenameAssetUseCase } from '@/lib/dam/application/use-cases/RenameAssetUseCase';
import { AddTagToAssetUseCase } from '@/lib/dam/application/use-cases/AddTagToAssetUseCase';
import { RemoveTagFromAssetUseCase } from '@/lib/dam/application/use-cases/RemoveTagFromAssetUseCase';

// Import repositories and services needed for use cases
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';
import { SupabaseAssetTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetTagRepository';
import { SupabaseTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseTagRepository';

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
    executeCoreLogic: async ({ activeOrgId, userId, supabase, params }) => {
      try {
        // Create repositories
        const assetRepository = new SupabaseAssetRepository(supabase);
        const folderRepository = new SupabaseFolderRepository(supabase);
        
        // Create use case
        const moveAssetUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
        
        // Execute use case
        await moveAssetUseCase.execute({
          assetId: params.assetId,
          targetFolderId: params.targetFolderId,
          organizationId: activeOrgId
        });
        
        revalidatePath('/dam', 'layout');
        return { success: true };
      } catch (error: any) {
        console.error('moveAsset: Use Case Error', error);
        return { success: false, error: error.message || 'Failed to move asset.' };
      }
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
    executeCoreLogic: async ({ activeOrgId, supabase, params }) => {
      try {
        // Create repositories and services
        const assetRepository = new SupabaseAssetRepository(supabase);
        const storageService = new SupabaseStorageService(supabase);
        
        // Create use case
        const deleteAssetUseCase = new DeleteAssetUseCase(assetRepository, storageService);
        
        // Execute use case
        const result = await deleteAssetUseCase.execute({
          assetId: params.assetId,
          organizationId: activeOrgId
        });
        
        revalidatePath('/dam', 'layout');
        if (result.folderId) {
          revalidatePath(`/dam/folders/${result.folderId}`, 'layout');
        }
        return { success: true, data: { folderId: result.folderId } };
      } catch (error: any) {
        console.error('deleteAsset: Use Case Error', error);
        return { success: false, error: error.message || 'Failed to delete asset.' };
      }
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
    executeCoreLogic: async ({ activeOrgId, supabase, params }) => {
      try {
        // Create repository
        const assetRepository = new SupabaseAssetRepository(supabase);
        
        // Create use case
        const renameAssetUseCase = new RenameAssetUseCase(assetRepository);
        
        // Execute use case
        const result = await renameAssetUseCase.execute({
          assetId: params.assetId,
          newName: params.newName,
          organizationId: activeOrgId
        });
        
        revalidatePath('/dam', 'layout');
        return { success: true, data: result };
      } catch (error: any) {
        console.error('renameAssetClient: Use Case Error', error);
        return { success: false, error: error.message || 'Failed to rename asset.' };
      }
    },
  });
}

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
    executeCoreLogic: async ({ activeOrgId, userId, supabase, params }) => {
      try {
        // Create repositories
        const assetRepository = new SupabaseAssetRepository(supabase);
        const tagRepository = new SupabaseTagRepository(supabase);
        const assetTagRepository = new SupabaseAssetTagRepository(supabase);
        
        // Create use case
        const addTagToAssetUseCase = new AddTagToAssetUseCase(
          assetRepository,
          tagRepository,
          assetTagRepository
        );
        
        // Execute use case
        await addTagToAssetUseCase.execute({
          assetId: params.assetId,
          tagId: params.tagId,
          organizationId: activeOrgId,
          userId: userId
        });
        
        revalidatePath('/dam', 'layout');
        return { success: true };
      } catch (error: any) {
        console.error('addTagToAsset: Use Case Error', error);
        return { success: false, error: error.message || 'Failed to add tag to asset.' };
      }
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
    executeCoreLogic: async ({ activeOrgId, supabase, params }) => {
      try {
        // Create repositories
        const assetRepository = new SupabaseAssetRepository(supabase);
        const tagRepository = new SupabaseTagRepository(supabase);
        const assetTagRepository = new SupabaseAssetTagRepository(supabase);
        
        // Create use case
        const removeTagFromAssetUseCase = new RemoveTagFromAssetUseCase(
          assetRepository,
          tagRepository,
          assetTagRepository
        );
        
        // Execute use case
        await removeTagFromAssetUseCase.execute({
          assetId: params.assetId,
          tagId: params.tagId,
          organizationId: activeOrgId
        });
        
        revalidatePath('/dam', 'layout');
        return { success: true };
      } catch (error: any) {
        console.error('removeTagFromAsset: Use Case Error', error);
        return { success: false, error: error.message || 'Failed to remove tag from asset.' };
      }
    },
  });
} 