import { deleteAssetService } from '@/lib/services/asset-service';
import { ErrorCodes } from '@/lib/errors/constants';

interface DeleteAssetUsecaseParams {
  organizationId: string;
  assetId: string;
}

interface DeleteAssetUsecaseResultData {
  deletedAssetId: string;
  folderId: string | null; // For revalidation path
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function deleteAssetUsecase({
  organizationId,
  assetId,
}: DeleteAssetUsecaseParams): Promise<UsecaseResult<DeleteAssetUsecaseResultData>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }
  // AssetId validation is handled by the service.

  const serviceResult = await deleteAssetService(organizationId, assetId);

  if (!serviceResult.success || !serviceResult.data) {
    // Note: deleteAssetService returns data even on partial success (DB delete ok, storage fail)
    // but the current action layer treats any serviceResult.success = false as a full failure for return.
    // This usecase will mirror that. If more nuanced handling is needed, service/usecase return types would change.
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to delete asset via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // The service returns the necessary data for the action layer (deletedAssetId, folderId)
  return {
    success: true,
    data: serviceResult.data, 
  };
} 