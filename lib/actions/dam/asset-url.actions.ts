'use server';

import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { getAssetDownloadUrlUsecase } from '@/lib/usecases/dam/getAssetDownloadUrlUsecase';
import { getAssetDownloadUrlService } from '@/lib/services/asset-service'; // Keep service for the second action

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

// Kept this action as it's used by useTtsDamIntegration and requires orgId for its service
export async function getDamAssetDownloadUrl(
  assetId: string
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }

  try {
    // Need organization context for the service call
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const result = await getAssetDownloadUrlService(activeOrgId, assetId);

    if (!result.success) {
      console.error('getDamAssetDownloadUrl Action: Service Error', result.error);
      return { success: false, error: result.error || 'Failed to get download URL via service.' };
    }

    // Explicitly check for data presence on success
    if (!result.data || !result.data.downloadUrl) {
      console.error('getDamAssetDownloadUrl Action: Service succeeded but returned no download URL.');
      return { success: false, error: 'Failed to retrieve download URL despite service success.' };
    }

    return { success: true, downloadUrl: result.data.downloadUrl };

  } catch (err: any) {
    console.error('getDamAssetDownloadUrl Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while getting the download URL.' };
  }
} 