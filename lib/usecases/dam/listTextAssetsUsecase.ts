import { listTextAssetsService } from '@/lib/services/text-asset-service';
import { ErrorCodes } from '@/lib/errors/constants';

// This interface should match the TextAssetSummary defined or used by the service
export interface TextAssetSummary {
  id: string;
  name: string;
  created_at: string;
}

interface ListTextAssetsUsecaseParams {
  organizationId: string;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function listTextAssetsUsecase({
  organizationId,
}: ListTextAssetsUsecaseParams): Promise<UsecaseResult<{ assets: TextAssetSummary[] }>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }

  const serviceResult = await listTextAssetsService(organizationId);

  if (!serviceResult.success || !serviceResult.data) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to list text assets via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // The service returns data in the shape { assets: TextAssetSummary[] }
  return {
    success: true,
    data: serviceResult.data, 
  };
} 