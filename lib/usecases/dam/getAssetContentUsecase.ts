import { getAssetContentService } from '@/lib/services/text-asset-service';
import { ErrorCodes } from '@/lib/errors/constants';

interface GetAssetContentUsecaseParams {
  organizationId: string;
  assetId: string;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function getAssetContentUsecase({
  organizationId,
  assetId,
}: GetAssetContentUsecaseParams): Promise<UsecaseResult<{ content: string }>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }
  // AssetId validation is handled by the service.

  const serviceResult = await getAssetContentService(organizationId, assetId);

  if (!serviceResult.success || !serviceResult.data) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to get asset content via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // The service returns data in the shape { content: string }
  return {
    success: true,
    data: serviceResult.data, 
  };
} 