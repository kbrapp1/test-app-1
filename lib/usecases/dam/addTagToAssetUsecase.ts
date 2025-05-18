import { addTagToAssetService } from '@/lib/services/asset-tag.service';
import { ErrorCodes } from '@/lib/errors/constants';
// Assuming UsecaseResult will be similar to other use cases, returning null data on success for this one.

interface AddTagToAssetUsecaseParams {
  organizationId: string;
  assetId: string;
  tagId: string;
}

interface UsecaseResult<T = null> { // T will be null for this usecase on success
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function addTagToAssetUsecase({
  organizationId,
  assetId,
  tagId,
}: AddTagToAssetUsecaseParams): Promise<UsecaseResult<null>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.VALIDATION_ERROR, 
    };
  }
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!tagId) {
    return { success: false, error: 'Tag ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  const serviceResult = await addTagToAssetService(
    organizationId,
    assetId,
    tagId
  );

  if (!serviceResult.success) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to add tag to asset via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  return { success: true, data: null }; // serviceResult.data is null on success
} 