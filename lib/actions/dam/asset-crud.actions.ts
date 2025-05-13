'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';

// Import Usecases
import { moveAssetUsecase } from '@/lib/usecases/dam/moveAssetUsecase';
import { deleteAssetUsecase } from '@/lib/usecases/dam/deleteAssetUsecase';

export async function moveAsset(
  assetId: string,
  targetFolderId: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Missing asset ID.' };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const usecaseResult = await moveAssetUsecase({
      organizationId: activeOrgId,
      assetId,
      targetFolderId,
    });

    if (!usecaseResult.success) {
      console.error('moveAsset Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to move asset via usecase.' };
    }

    revalidatePath('/dam', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('moveAsset Action: Unexpected error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function deleteAsset(
  assetId: string
): Promise<{ success: boolean; error?: string, data?: { folderId: string | null } }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      console.error('deleteAsset Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('deleteAsset Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot delete asset.' };
    }

    const usecaseResult = await deleteAssetUsecase({
      organizationId: activeOrgId,
      assetId,
    });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('deleteAsset Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to delete asset via usecase.' };
    }

    revalidatePath('/dam', 'layout');
    if (usecaseResult.data.folderId) {
        revalidatePath(`/dam/folders/${usecaseResult.data.folderId}`, 'layout');
    }
    return { success: true, data: { folderId: usecaseResult.data.folderId || null } }; 

  } catch (err: any) {
    console.error('deleteAsset Action: Unexpected error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while deleting the asset.' };
  }
} 