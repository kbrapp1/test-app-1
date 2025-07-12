'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { UpdateFolderUseCase, DeleteFolderUseCase, CreateFolderUseCase } from '../use-cases/folders';
import { SupabaseFolderRepository } from '../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { AppError } from '@/lib/errors/base';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';
import { checkDamFeatureFlag } from '../services/DamFeatureFlagService';

/**
 * Server Actions: Folder Management
 * 
 * DDD-compliant server actions for folder operations.
 * All actions delegate to use cases following clean architecture patterns.
 */

export interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: any; // Plain folder object for serialization
}

function revalidatePathsAfterFolderMutation(
  parentFolderId?: string | null,
  folderId?: string
) {
  // Remove revalidatePath('/dam', 'layout') since we're using client-side fetching
  // revalidatePath('/dam', 'layout'); // REMOVED - causes unnecessary POST /dam calls
  if (parentFolderId) {
    revalidateTag(`folder-${parentFolderId}-children`);
  }
  if (folderId) {
    revalidateTag(`folder-${folderId}-details`);
  }
}

export async function renameFolderAction(
  folderId: string,
  newName: string
): Promise<FolderActionResult> {
  // 🔄 Apply deduplication to prevent rapid rename actions
  return await apiDeduplicationService.deduplicateServerAction(
    'renameFolderAction',
    [folderId, newName],
    async () => {
      try {
        await checkDamFeatureFlag();
        
        if (!folderId) {
          return { success: false, error: 'Folder ID is required.' };
        }
        if (!newName || newName.trim() === '') {
          return { success: false, error: 'New folder name cannot be empty.' };
        }

        const supabase = createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: 'User not authenticated.' };
        }

        const organizationId = await getActiveOrganizationId();
        if (!organizationId) {
          return { success: false, error: 'Active organization not found.' };
        }

        // Set up dependencies and execute use case
        const folderRepository = new SupabaseFolderRepository(supabase);
        const currentFolder = await folderRepository.findById(folderId, organizationId);
        const oldParentFolderId = currentFolder?.parentFolderId;

        const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
        const updatedFolder = await updateFolderUseCase.execute({
          folderId,
          name: newName.trim(),
          organizationId,
        });

        // Cache invalidation
        revalidatePathsAfterFolderMutation(oldParentFolderId, updatedFolder.id);

        return { 
          success: true, 
          folder: updatedFolder.toPlainObject(),
          folderId: updatedFolder.id,
          parentFolderId: updatedFolder.parentFolderId
        };

      } catch (err: any) {
        console.error('renameFolderAction Error:', err);
        if (err instanceof AppError) {
          return { success: false, error: err.message };
        }
        return { success: false, error: err.message || 'Failed to rename folder.' };
      }
    },
    'dam-operations' // Use DAM operations domain timeout
  );
}

export async function deleteFolderAction(
  folderId: string
): Promise<FolderActionResult> {
  // 🔄 Apply deduplication to prevent accidental double-deletions
  return await apiDeduplicationService.deduplicateServerAction(
    'deleteFolderAction',
    [folderId],
    async () => {
      try {
        await checkDamFeatureFlag();
        
        if (!folderId) {
          return { success: false, error: 'Folder ID is required for deletion.' };
        }

        const supabase = createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: 'User not authenticated.' };
        }

        const organizationId = await getActiveOrganizationId();
        if (!organizationId) {
          return { success: false, error: 'Active organization not found.' };
        }

        // Set up dependencies and execute use case
        const folderRepository = new SupabaseFolderRepository(supabase);
        
        // Get parentFolderId for revalidation before deleting
        const folderToDelete = await folderRepository.findById(folderId, organizationId);
        if (!folderToDelete) {
          return { success: false, error: 'Folder not found for deletion.' };
        }
        const parentIdForReval = folderToDelete.parentFolderId;

        const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);
        await deleteFolderUseCase.execute({
          folderId,
          organizationId,
        });

        // Cache invalidation
        revalidatePathsAfterFolderMutation(parentIdForReval, folderId);

        return { 
          success: true, 
          folderId, 
          parentFolderId: parentIdForReval 
        };

      } catch (err: any) {
        console.error('deleteFolderAction Error:', err);
        if (err instanceof AppError) {
          return { success: false, error: err.message };
        }
        return { success: false, error: err.message || 'Failed to delete folder.' };
      }
    },
    'dam-operations' // Use DAM operations domain timeout
  );
}

export async function createFolderAction(
  name: string,
  parentFolderId?: string | null
): Promise<FolderActionResult> {
  // 🔄 Apply deduplication to prevent rapid folder creation
  return await apiDeduplicationService.deduplicateServerAction(
    'createFolderAction',
    [name, parentFolderId],
    async () => {
      try {
        await checkDamFeatureFlag();
        
        if (!name || name.trim() === '') {
          return { success: false, error: 'Folder name cannot be empty.' };
        }

        const supabase = createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: 'User not authenticated.' };
        }

        const organizationId = await getActiveOrganizationId();
        if (!organizationId) {
          return { success: false, error: 'Active organization not found.' };
        }

        // Set up dependencies and execute use case
        const folderRepository = new SupabaseFolderRepository(supabase);
        const createFolderUseCase = new CreateFolderUseCase(folderRepository);
        
        const newFolder = await createFolderUseCase.execute({
          name: name.trim(),
          parentFolderId: parentFolderId || null,
          organizationId,
          userId: user.id,
        });

        // Cache invalidation
        revalidatePathsAfterFolderMutation(parentFolderId, newFolder.id);

        return { 
          success: true, 
          folder: newFolder.toPlainObject(),
          folderId: newFolder.id,
          parentFolderId: newFolder.parentFolderId
        };

      } catch (err: any) {
        console.error('createFolderAction Error:', err);
        if (err instanceof AppError) {
          return { success: false, error: err.message };
        }
        return { success: false, error: err.message || 'Failed to create folder.' };
      }
    },
    'dam-operations' // Use DAM operations domain timeout
  );
}

// Legacy action compatibility aliases
export const renameFolderClientAction = renameFolderAction;
export const deleteFolderClientAction = deleteFolderAction; 
