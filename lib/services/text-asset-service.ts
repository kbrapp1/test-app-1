import {
  listTextAssetsFromDb,
  type AssetDbRecord,
  getAssetByIdFromDb,
  createAssetRecordInDb,
  updateAssetMetadataInDb,
} from '@/lib/repositories/asset.db.repo';
import {
  downloadAssetBlobFromStorage,
  uploadToStorage,
  removeAssetFromStorage, // Needed for cleanup in saveAsNew
} from '@/lib/repositories/asset.storage.repo';
import { type ServiceResult } from '@/types/services';
import { ErrorCodes } from '@/lib/errors/constants';
import { randomUUID } from 'crypto';

const DAM_TEXT_MIME_TYPES_SERVICE = [
    'text/plain', 
    'text/markdown', 
    'application/json', 
    'text/html', 
    'text/css', 
    'text/javascript'
] as const;
type TextMimeTypeService = typeof DAM_TEXT_MIME_TYPES_SERVICE[number];

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
    const assetMetaResult = await getAssetByIdFromDb(assetId, organizationId);
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
    const assetMetaResult = await getAssetByIdFromDb(assetId, organizationId);
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
      metadata: { size: newSize } // Only update size on content change
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
  // Define storagePath outside try block for potential cleanup
  let storagePath: string | null = null; 
  try {
    const mimeType = 'text/plain'; // Default to plain text
    const fileExtension = '.txt'; 
    const finalName = desiredName.endsWith(fileExtension) ? desiredName.trim() : `${desiredName.trim()}${fileExtension}`;
    const newAssetId = randomUUID();
    storagePath = `${organizationId}/${userId}/text_assets/${newAssetId}${fileExtension}`;
    const contentBuffer = Buffer.from(content, 'utf8');
    const size = contentBuffer.byteLength;

    const uploadResult = await uploadToStorage({
        storagePath,
        fileBody: contentBuffer,
        contentType: mimeType,
        upsert: false, 
    });
    if (uploadResult.error) { 
      return { success: false, error: `Storage upload failed: ${uploadResult.error.message}`, errorCode: ErrorCodes.EXTERNAL_SERVICE_ERROR }; 
    }

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
      console.error('saveAsNewTextAssetService: DB insert error, attempting cleanup', createRecordResult.error);
      // Attempt to clean up the uploaded file if DB insert fails
      if (storagePath) {
        await removeAssetFromStorage(storagePath);
      }
      return { success: false, error: `Database insert failed: ${createRecordResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    if (!createRecordResult.data) {
        // Should not happen if no error, but handle defensively
        console.error('saveAsNewTextAssetService: DB insert returned no data, attempting cleanup');
        if (storagePath) {
           await removeAssetFromStorage(storagePath); // Cleanup
        }
        return { success: false, error: 'Asset record not created in DB after successful upload.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
    }

    return { success: true, data: { newAssetId } };
  } catch (err: any) {
    console.error('saveAsNewTextAssetService: Unexpected Error, attempting cleanup', err);
    // Attempt cleanup on unexpected errors too, if storagePath was set
    if (storagePath) {
        try { await removeAssetFromStorage(storagePath); } catch (cleanupErr) { console.error('Cleanup failed after unexpected error:', cleanupErr); }
    }
    return { success: false, error: err.message || 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 