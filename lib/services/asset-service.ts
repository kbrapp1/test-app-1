import {
  type AssetDbRecord,
  getAssetByIdFromDb,
  updateAssetFolderInDb,
  deleteAssetRecordFromDb,
  removeAssetFromStorage,
  getAssetSignedUrlFromStorage,
} from '@/lib/repositories/asset-repo';
import { getFolderById } from '@/lib/repositories/folder-repo'; // For moveAssetService
import { type Asset } from '@/types/dam';
import { AppError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services'; // Updated path

function dbRecordToAppAsset(dbRecord: AssetDbRecord): Asset {
  if (!dbRecord) {
    throw new AppError(ErrorCodes.UNEXPECTED_ERROR, 'DB record is null, cannot map to Asset.');
  }
  return {
    id: dbRecord.id,
    created_at: dbRecord.created_at,
    name: dbRecord.name,
    user_id: dbRecord.user_id,
    organization_id: dbRecord.organization_id,
    folder_id: dbRecord.folder_id,
    type: 'asset',
    storage_path: dbRecord.storage_path,
    mime_type: dbRecord.mime_type,
    size: dbRecord.size,
    publicUrl: '', // Placeholder
  };
}

export async function moveAssetService(
  organizationId: string,
  assetId: string,
  targetFolderId: string | null
): Promise<ServiceResult<null>> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  try {
    const assetResult = await getAssetByIdFromDb(assetId, organizationId, 'id, folder_id, organization_id');
    if (assetResult.error) {
      console.error('moveAssetService: Asset fetch error', assetResult.error);
      return { success: false, error: `Error finding asset: ${assetResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    if (!assetResult.data) {
      return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    if (targetFolderId !== null) {
      const folderResult = await getFolderById(targetFolderId, organizationId);
      if (folderResult.error) {
        console.error('moveAssetService: Target folder fetch error', folderResult.error);
        return { success: false, error: `Error finding target folder: ${folderResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
      }
      if (!folderResult.data) {
        return { success: false, error: 'Target folder not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }
    }
    const updateResult = await updateAssetFolderInDb(assetId, targetFolderId, organizationId);
    if (updateResult.error) {
      console.error('moveAssetService: Update asset folder error', updateResult.error);
      return { success: false, error: `Failed to update asset folder: ${updateResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    return { success: true };
  } catch (err: any) {
    console.error('moveAssetService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

interface DeleteAssetServiceData {
  deletedAssetId: string;
  folderId: string | null;
}
export async function deleteAssetService(
  organizationId: string,
  assetId: string
): Promise<ServiceResult<DeleteAssetServiceData>> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  try {
    const assetResult = await getAssetByIdFromDb(assetId, organizationId, 'id, storage_path, folder_id');
    if (assetResult.error) {
      console.error('deleteAssetService: Metadata fetch error', assetResult.error);
      return { success: false, error: `Failed to fetch asset metadata: ${assetResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    if (!assetResult.data || !assetResult.data.storage_path) {
      return { success: false, error: 'Asset not found, access denied, or storage path missing.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    const assetToDelete = assetResult.data;
    const storageResult = await removeAssetFromStorage(assetToDelete.storage_path);
    if (storageResult.error) {
      console.warn('deleteAssetService: Supabase storage deletion error - IGNORING:', storageResult.error);
    }
    const dbDeleteResult = await deleteAssetRecordFromDb(assetId, organizationId);
    if (dbDeleteResult.error) {
      console.error('deleteAssetService: Database deletion error:', dbDeleteResult.error);
      return { success: false, error: `Failed to delete asset from database: ${dbDeleteResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    return { success: true, data: { deletedAssetId: assetToDelete.id, folderId: assetToDelete.folder_id } };
  } catch (err: any) {
    console.error('deleteAssetService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function getAssetDownloadUrlService(
  organizationId: string,
  assetId: string
): Promise<ServiceResult<{ downloadUrl: string }>> {
  if (!assetId) { 
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  try {
    const assetMetaResult = await getAssetByIdFromDb(assetId, organizationId, 'storage_path');
    if (assetMetaResult.error) { return { success: false, error: `Failed to fetch asset metadata: ${assetMetaResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR }; }
    if (!assetMetaResult.data || !assetMetaResult.data.storage_path) { 
      return { success: false, error: 'Asset not found, access denied, or storage path missing.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND }; 
    }
    const urlResult = await getAssetSignedUrlFromStorage(assetMetaResult.data.storage_path, 60 * 5);
    if (urlResult.error) { return { success: false, error: `Failed to get download URL: ${urlResult.error.message}`, errorCode: ErrorCodes.EXTERNAL_SERVICE_ERROR }; }
    if (!urlResult.data || !urlResult.data.signedUrl) { return { success: false, error: 'Could not retrieve download URL.', errorCode: ErrorCodes.UNEXPECTED_ERROR }; }
    return { success: true, data: { downloadUrl: urlResult.data.signedUrl } };
  } catch (err: any) {
    console.error('getAssetDownloadUrlService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 