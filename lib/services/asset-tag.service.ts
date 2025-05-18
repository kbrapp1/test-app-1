import {
  addTagToAssetInDb,
  removeTagFromAssetInDb,
} from '@/lib/repositories/asset-tag.repo';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services';

export async function addTagToAssetService(
  organizationId: string, 
  assetId: string,
  tagId: string
): Promise<ServiceResult<null>> { 
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!tagId) {
    return { success: false, error: 'Tag ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required for context.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  try {
    const insertResult = await addTagToAssetInDb(assetId, tagId);

    if (insertResult.error) {
      console.error('addTagToAssetService: DB Insert Error', insertResult.error);
      const errorCode = (insertResult.error as any).code;
      if (errorCode === '23503') { 
        return { success: false, error: 'Invalid asset or tag ID provided.', errorCode: ErrorCodes.VALIDATION_ERROR }; 
      }
      if (errorCode === '23505') { 
        return { success: false, error: 'This asset is already associated with this tag.', errorCode: ErrorCodes.DUPLICATE_ENTRY };
      }
      return { success: false, error: `Failed to associate tag with asset: ${insertResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    return { success: true, data: null }; 

  } catch (err: any) {
    console.error('addTagToAssetService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while associating the tag.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
}

export async function removeTagFromAssetService(
  organizationId: string, 
  assetId: string,
  tagId: string
): Promise<ServiceResult<null>> { 
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!tagId) {
    return { success: false, error: 'Tag ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required for context.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  try {
    const deleteResult = await removeTagFromAssetInDb(assetId, tagId);

    if (deleteResult.error) {
      console.error('removeTagFromAssetService: DB Delete Error', deleteResult.error);
      return { success: false, error: `Failed to remove tag from asset: ${deleteResult.error.message}`, errorCode: ErrorCodes.DATABASE_ERROR };
    }

    return { success: true, data: null };

  } catch (err: any) {
    console.error('removeTagFromAssetService: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while removing the tag.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 