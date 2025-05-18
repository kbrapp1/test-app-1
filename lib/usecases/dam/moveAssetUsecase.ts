import { moveAssetService } from '@/lib/services/asset-core.service';
import { ErrorCodes } from '@/lib/errors/constants';

interface MoveAssetUsecaseParams {
  organizationId: string;
  assetId: string;
  targetFolderId: string | null;
}

// moveAssetService returns ServiceResult<null> so data will be null on success.
interface UsecaseResult<T = null> {
  success: boolean;
  data?: T; // Will be null for this usecase on success
  error?: string;
  errorCode?: string;
}

export async function moveAssetUsecase({
  organizationId,
  assetId,
  targetFolderId,
}: MoveAssetUsecaseParams): Promise<UsecaseResult<null>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }
  // AssetId validation is handled by the service.
  // targetFolderId can be null, service handles this.

  const serviceResult = await moveAssetService(
    organizationId,
    assetId,
    targetFolderId
  );

  if (!serviceResult.success) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to move asset via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // On success, serviceResult.data is null for moveAssetService
  return { success: true, data: null };
} 