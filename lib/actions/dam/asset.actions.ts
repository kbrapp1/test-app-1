'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
// randomUUID is now used in the service layer
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server'; // For auth

// Import Usecases
import { moveAssetUsecase } from '@/lib/usecases/dam/moveAssetUsecase';
import { deleteAssetUsecase } from '@/lib/usecases/dam/deleteAssetUsecase';
import { listTextAssetsUsecase, TextAssetSummary as UsecaseTextAssetSummary } from '@/lib/usecases/dam/listTextAssetsUsecase'; // Import Usecase and its type
import { getAssetContentUsecase } from '@/lib/usecases/dam/getAssetContentUsecase';
import { updateAssetTextUsecase } from '@/lib/usecases/dam/updateAssetTextUsecase';
import { saveAsNewTextAssetUsecase } from '@/lib/usecases/dam/saveAsNewTextAssetUsecase';
import { getAssetDownloadUrlUsecase } from '@/lib/usecases/dam/getAssetDownloadUrlUsecase';

// Import remaining services for actions not yet refactored
// All services should be removed once all actions use usecases
// import {
// } from '@/lib/services/dam-service';

// Asset type from @/types/dam might be needed if actions return full Asset objects,
// but many of these return simpler structures or just success/error.
// import { Asset } from '@/types/dam';

// TextMimeType and TextAssetSummary are now defined/handled in the service or types consumed by service.
// dbTextAssetToSummary helper is removed.

// Import types for the new action
import { Asset, Folder, CombinedItem } from '@/types/dam';

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

export async function getAssetDownloadUrl(
  assetId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }

  try {
    const usecaseResult = await getAssetDownloadUrlUsecase({ assetId });

    if (!usecaseResult.success || !usecaseResult.downloadUrl) {
      console.error('getAssetDownloadUrl Action: Usecase Error', usecaseResult.error);
      return { success: false, error: usecaseResult.error || 'Failed to get asset download URL via usecase.' };
    }

    return { success: true, url: usecaseResult.downloadUrl };
  } catch (err: any) {
    console.error('getAssetDownloadUrl Action: Unexpected error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

// Action to fetch combined assets and folders for the gallery view
export async function getAssetsAndFoldersForGallery(
  currentFolderId: string | null
): Promise<{ success: boolean; data?: { combinedItems: CombinedItem[] }; error?: string }> {
  // console.log(`[Action] Fetching gallery for folder: ${currentFolderId}`);
  const supabaseUserClient = createSupabaseUserClient();
  try {
    // Auth Check (using user client)
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      console.error('getAssetsAndFoldersForGallery Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('getAssetsAndFoldersForGallery Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization context not found.' };
    }

    // Use Admin client for data fetching to bypass RLS if necessary for broader view,
    // or stick to User client if RLS should apply strictly.
    // For simplicity, let's use the User client here, assuming RLS is set up correctly.
    const supabase = supabaseUserClient; 

    // --- Fetch Folders ---
    let folderQuery = supabase.from('folders').select('*');
    if (currentFolderId === null) {
      folderQuery = folderQuery.is('parent_folder_id', null);
    } else {
      folderQuery = folderQuery.eq('parent_folder_id', currentFolderId);
    }
    // Ensure query is scoped by organization
    folderQuery = folderQuery.eq('organization_id', activeOrgId);
    const { data: foldersData, error: foldersError } = await folderQuery.order('name', { ascending: true });

    if (foldersError) {
      console.error('getAssetsAndFoldersForGallery: Error fetching folders:', foldersError);
      return { success: false, error: `Error loading folders: ${foldersError.message}` };
    }
    const folders: Folder[] = (foldersData || []).map(f => ({ ...f, type: 'folder' }));

    // --- Fetch Assets ---
    let assetQuery = supabase.from('assets').select('*');
    if (currentFolderId === null) {
      assetQuery = assetQuery.is('folder_id', null);
    } else {
      assetQuery = assetQuery.eq('folder_id', currentFolderId);
    }
    // Ensure query is scoped by organization
    assetQuery = assetQuery.eq('organization_id', activeOrgId);
    const { data: assetsData, error: assetsError } = await assetQuery.order('created_at', { ascending: false });

    if (assetsError) {
      console.error('getAssetsAndFoldersForGallery: Error fetching assets:', assetsError);
      return { success: false, error: `Error loading assets: ${assetsError.message}` };
    }

    // --- Generate Public URLs for Assets ---
    // Public URLs might be better generated client-side if they expire or for performance.
    // However, doing it here keeps the original logic.
    // We need a Supabase client instance that can access storage.
    // If RLS prevents the user client, we might need the admin client here.
    // Assuming user client is sufficient for getPublicUrl based on bucket policies.
    const assetsWithUrls: Asset[] = (assetsData || []).map((assetData: any) => {
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(assetData.storage_path);
      return {
        ...assetData,
        type: 'asset',
        publicUrl: urlData?.publicUrl || '/placeholder.png',
      } as Asset;
    });

    // --- Combine Data ---
    const combinedItems: CombinedItem[] = [
      ...(folders as CombinedItem[]),
      ...(assetsWithUrls as CombinedItem[])
    ];

    // console.log(`[Action] Fetched ${combinedItems.length} items for folder: ${currentFolderId}`);
    return { success: true, data: { combinedItems } };

  } catch (err: any) {
    console.error('getAssetsAndFoldersForGallery Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred fetching gallery data.' };
  }
} 