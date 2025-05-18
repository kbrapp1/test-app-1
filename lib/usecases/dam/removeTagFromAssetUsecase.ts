import { removeTagFromAssetService } from '@/lib/services/asset-tag.service';
import { ErrorCodes } from '@/lib/errors/constants';

interface RemoveTagFromAssetUsecaseParams {
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

export async function removeTagFromAssetUsecase({
  organizationId,
  assetId,
  tagId,
}: RemoveTagFromAssetUsecaseParams): Promise<UsecaseResult<null>> {
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

  const serviceResult = await removeTagFromAssetService(
    organizationId,
    assetId,
    tagId
  );

  if (!serviceResult.success) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to remove tag from asset via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  return { success: true, data: null }; // serviceResult.data is null on success
} 