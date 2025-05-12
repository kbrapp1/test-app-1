import {
  type AssetDbRecord,
  getAssetByIdFromDb,
  updateAssetFolderInDb,
  deleteAssetRecordFromDb,
  removeAssetFromStorage,
  listTextAssetsFromDb,
  downloadAssetBlobFromStorage,
  uploadToStorage,
  updateAssetMetadataInDb,
  createAssetRecordInDb,
  getAssetSignedUrlFromStorage,
} from '@/lib/repositories/asset-repo';
import { getFolderById } from '@/lib/repositories/folder-repo'; // For moveAssetService
import { type Asset } from '@/types/dam';
import { AppError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';
import { randomUUID } from 'crypto';
import type { ServiceResult } from '@/types/services'; // Updated path

const DAM_TEXT_MIME_TYPES_SERVICE = ['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript'] as const;
type TextMimeTypeService = typeof DAM_TEXT_MIME_TYPES_SERVICE[number];

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

interface TextAssetSummary {
  id: string;
  name: string;
  created_at: string;
}

function dbAssetToTextSummary(dbRecord: { id: string; name: string; created_at: string }): TextAssetSummary {
    return {
        id: dbRecord.id,
        name: dbRecord.name,
        created_at: dbRecord.created_at,
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

export async function listTextAssetsService(
  organizationId: string
): Promise<ServiceResult<{ assets: TextAssetSummary[] }>> {
  try {
    const repoResult = await listTextAssetsFromDb(organizationId);
    if (repoResult.error) {
      console.error('listTextAssetsService: DB Query Error', repoResult.error);
      return { success: false, error: `Database query failed: ${repoResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    const summarizedData = repoResult.data?.map(dbAssetToTextSummary) || [];
    return { success: true, data: { assets: summarizedData } };
  } catch (err: any) {
    console.error('listTextAssetsService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function getAssetContentService(
  organizationId: string,
  assetId: string
): Promise<ServiceResult<{ content: string }>> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  try {
    const assetMetaResult = await getAssetByIdFromDb(assetId, organizationId, 'storage_path, mime_type');
    if (assetMetaResult.error) {
      return { success: false, error: `Failed to fetch asset metadata: ${assetMetaResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    if (!assetMetaResult.data || !assetMetaResult.data.storage_path || !assetMetaResult.data.mime_type) {
      return { success: false, error: 'Asset not found, access denied, or key metadata missing.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    const asset = assetMetaResult.data;
    if (!DAM_TEXT_MIME_TYPES_SERVICE.includes(asset.mime_type as TextMimeTypeService)) {
      return { success: false, error: 'Asset is not a downloadable text file.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }
    const blobResult = await downloadAssetBlobFromStorage(asset.storage_path);
    if (blobResult.error) {
      return { success: false, error: `Failed to download asset content: ${blobResult.error.message}`, errorCode: ErrorCodes.EXTERNAL_SERVICE_ERROR };
    }
    if (!blobResult.data) {
      return { success: false, error: 'No content found for asset.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    const content = await blobResult.data.text();
    return { success: true, data: { content } };
  } catch (err: any) {
    console.error('getAssetContentService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function updateAssetTextService(
  organizationId: string,
  assetId: string,
  newContent: string
): Promise<ServiceResult<null>> {
  if (!assetId) { return { success: false, error: 'Asset ID is required for update.', errorCode: ErrorCodes.VALIDATION_ERROR }; }
  try {
    const assetMetaResult = await getAssetByIdFromDb(assetId, organizationId, 'storage_path, mime_type, name');
    if (assetMetaResult.error) { return { success: false, error: `Failed to fetch asset metadata: ${assetMetaResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR }; }
    if (!assetMetaResult.data || !assetMetaResult.data.storage_path || !assetMetaResult.data.mime_type) { 
      return { success: false, error: 'Asset not found, access denied, or key metadata missing.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND }; 
    }
    const asset = assetMetaResult.data;
    if (!DAM_TEXT_MIME_TYPES_SERVICE.includes(asset.mime_type as TextMimeTypeService)) {
      return { success: false, error: 'Cannot update content: Asset is not a recognized text file type.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }
    const newContentBuffer = Buffer.from(newContent, 'utf8');
    const newSize = newContentBuffer.byteLength;
    const uploadResult = await uploadToStorage({
        storagePath: asset.storage_path,
        fileBody: newContentBuffer,
        contentType: asset.mime_type,
        upsert: true, 
    });
    if (uploadResult.error) { return { success: false, error: `Failed to upload new content: ${uploadResult.error.message}`, errorCode: ErrorCodes.EXTERNAL_SERVICE_ERROR }; }
    const dbUpdateResult = await updateAssetMetadataInDb({
      assetId,
      organizationId: organizationId,
      metadata: { size: newSize }
    });
    if (dbUpdateResult.error) { return { success: false, error: `Failed to update asset metadata: ${dbUpdateResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR }; }
    return { success: true };
  } catch (err: any) {
    console.error('updateAssetTextService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function saveAsNewTextAssetService(
  userId: string,
  organizationId: string,
  content: string,
  desiredName: string,
  folderId?: string | null
): Promise<ServiceResult<{ newAssetId: string }>> {
  if (!desiredName || desiredName.trim() === '') { 
    return { success: false, error: 'Asset name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR }; 
  }
  try {
    const mimeType = 'text/plain';
    const fileExtension = '.txt'; 
    const finalName = desiredName.endsWith(fileExtension) ? desiredName.trim() : `${desiredName.trim()}${fileExtension}`;
    const newAssetId = randomUUID();
    const storagePath = `${organizationId}/${userId}/text_assets/${newAssetId}${fileExtension}`;
    const contentBuffer = Buffer.from(content, 'utf8');
    const size = contentBuffer.byteLength;
    const uploadResult = await uploadToStorage({
        storagePath,
        fileBody: contentBuffer,
        contentType: mimeType,
        upsert: false, 
    });
    if (uploadResult.error) { return { success: false, error: `Storage upload failed: ${uploadResult.error.message}`, errorCode: ErrorCodes.EXTERNAL_SERVICE_ERROR }; }
    const createRecordResult = await createAssetRecordInDb({
      id: newAssetId,
      name: finalName,
      storagePath,
      mimeType,
      size,
      userId,
      organizationId,
      folderId: (folderId && folderId !== 'null' && folderId.trim() !== '') ? folderId : null,
    });
    if (createRecordResult.error) {
      console.error('saveAsNewTextAssetService: DB insert error', createRecordResult.error);
      await removeAssetFromStorage(storagePath);
      return { success: false, error: `Database insert failed: ${createRecordResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }
    if (!createRecordResult.data) {
        await removeAssetFromStorage(storagePath); // Cleanup
        return { success: false, error: 'Asset record not created in DB after successful upload.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
    }
    return { success: true, data: { newAssetId } };
  } catch (err: any) {
    console.error('saveAsNewTextAssetService: Unexpected Error', err);
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