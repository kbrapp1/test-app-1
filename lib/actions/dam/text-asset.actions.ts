'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';

// Import Usecases
import { listTextAssetsUsecase, TextAssetSummary as UsecaseTextAssetSummary } from '@/lib/usecases/dam/listTextAssetsUsecase';
import { getAssetContentUsecase } from '@/lib/usecases/dam/getAssetContentUsecase';
import { updateAssetTextUsecase } from '@/lib/usecases/dam/updateAssetTextUsecase';
import { saveAsNewTextAssetUsecase } from '@/lib/usecases/dam/saveAsNewTextAssetUsecase';

// Use the imported UsecaseTextAssetSummary for the return type
export async function listTextAssets(): Promise<{ success: boolean; data?: UsecaseTextAssetSummary[]; error?: string }> {
  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      console.error('listTextAssets Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('listTextAssets Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found.' };
    }

    const usecaseResult = await listTextAssetsUsecase({ organizationId: activeOrgId });

    if (!usecaseResult.success || !usecaseResult.data) {
      console.error('listTextAssets Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to list text assets via usecase.' };
    }

    return { success: true, data: usecaseResult.data.assets }; 

  } catch (err: any) {
    console.error('listTextAssets Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function getAssetContent(assetId: string): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }
  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Call the usecase
    const usecaseResult = await getAssetContentUsecase({ 
      organizationId: activeOrgId, 
      assetId 
    });

    // The usecase returns { content: string } in its data field upon success.
    if (!usecaseResult.success || typeof usecaseResult.data?.content !== 'string') {
      console.error('getAssetContent Action: Usecase Error or no content', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to get asset content via usecase or content missing.' };
    }

    return { success: true, content: usecaseResult.data.content };

  } catch (err: any) {
    console.error('getAssetContent Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updateAssetText(
  assetId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  if (!assetId) { return { success: false, error: 'Asset ID is required for update.' }; }
  
  const supabaseAuthClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) { return { success: false, error: 'User not authenticated.' }; }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) { return { success: false, error: 'Active organization not found.' }; }

    const usecaseResult = await updateAssetTextUsecase({
      organizationId: activeOrgId,
      assetId,
      newContent,
    });

    if (!usecaseResult.success) {
      console.error('updateAssetText Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to update asset text via usecase.' };
    }

    revalidatePath('/dam', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('updateAssetText Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function saveAsNewTextAsset(
  content: string,
  desiredName: string,
  folderId?: string | null
): Promise<{ success: boolean; error?: string; data?: { newAssetId: string } }> {
  try {
    const usecaseResult = await saveAsNewTextAssetUsecase({
      content,
      desiredName,
      folderId,
    });

    if (!usecaseResult.success || !usecaseResult.newAssetId) {
      console.error('saveAsNewTextAsset Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to save new text asset via usecase.' };
    }

    revalidatePath('/dam', 'layout');
    // Revalidate specific folder if asset was added to one
    if (folderId) {
      revalidatePath(`/dam/folders/${folderId}`, 'layout');
    }

    return { success: true, data: { newAssetId: usecaseResult.newAssetId } };
  } catch (err: any) {
    console.error('saveAsNewTextAsset Action: Unexpected error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
} 