'use server';

import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';
import { AssetService } from '@/lib/dam/application/services/AssetService';

// Renamed from getDamAssetDownloadUrl
export async function getAssetDownloadUrl(
  assetId: string,
  forceDownload: boolean = true
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }

  try {
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }
    
    const supabase = createSupabaseServerClient();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);
    
    const assetService = new AssetService(
      assetRepository,
      folderRepository,
      storageService
    );

    const result = await assetService.getAssetDownloadUrl(activeOrgId, assetId, forceDownload);

    if (!result.success) {
      console.error('getAssetDownloadUrl Action: Service Error', result.error);
      return { success: false, error: result.error || 'Failed to get download URL via service.' };
    }

    if (!result.data || !result.data.downloadUrl) {
      console.error('getAssetDownloadUrl Action: Service succeeded but returned no download URL.');
      return { success: false, error: 'Failed to retrieve download URL despite service success.' };
    }

    return { success: true, downloadUrl: result.data.downloadUrl };

  } catch (err: any) {
    console.error('getAssetDownloadUrl Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while getting the download URL.' };
  }
} 