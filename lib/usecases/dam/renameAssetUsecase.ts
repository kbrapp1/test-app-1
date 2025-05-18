import { renameAssetService } from '@/lib/services/asset-core.service';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services'; // Assuming UsecaseResult will be similar

interface RenameAssetUsecaseParams {
  organizationId: string;
  assetId: string;
  newName: string;
}

interface UsecaseResultData {
  id: string;
  name: string;
}

// Mirroring ServiceResult structure for consistency, but can be simpler if not all fields used
interface UsecaseResult<T = UsecaseResultData> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string; // From ErrorCodes
}

export async function renameAssetUsecase({
  organizationId,
  assetId,
  newName,
}: RenameAssetUsecaseParams): Promise<UsecaseResult<UsecaseResultData>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required for renaming an asset.',
      errorCode: ErrorCodes.VALIDATION_ERROR, // Or UNAUTHORIZED if it implies auth context
    };
  }
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!newName || newName.trim().length === 0) {
    return { success: false, error: 'New name is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  const serviceResult = await renameAssetService(
    organizationId,
    assetId,
    newName.trim() // Pass trimmed name to service
  );

  if (!serviceResult.success) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to rename asset via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // On success, serviceResult.data contains { id, name }
  return { 
    success: true, 
    data: serviceResult.data // data will be { id: string, name: string }
  };
} 