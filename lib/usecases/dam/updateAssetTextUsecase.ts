import { updateAssetTextService } from '@/lib/services/text-asset-service';
import { ErrorCodes } from '@/lib/errors/constants';

interface UpdateAssetTextUsecaseParams {
  organizationId: string;
  assetId: string;
  newContent: string;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T; // Will be null for this usecase on success
  error?: string;
  errorCode?: string;
}

export async function updateAssetTextUsecase({
  organizationId,
  assetId,
  newContent,
}: UpdateAssetTextUsecaseParams): Promise<UsecaseResult<null>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }
  // AssetId and newContent validation is handled by the service.

  const serviceResult = await updateAssetTextService(
    organizationId,
    assetId,
    newContent
  );

  if (!serviceResult.success) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to update asset text via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  return { success: true, data: null }; // Service returns null data on success
} 