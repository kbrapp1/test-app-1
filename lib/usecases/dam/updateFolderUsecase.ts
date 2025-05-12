import { updateFolderService } from '@/lib/services/folder-service';
import { Folder } from '@/types/dam';
import { ErrorCodes } from '@/lib/errors/constants';

interface UpdateFolderUsecaseParams {
  organizationId: string;
  folderId: string;
  newName: string;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function updateFolderUsecase({
  organizationId,
  folderId,
  newName,
}: UpdateFolderUsecaseParams): Promise<UsecaseResult<{ folder: Folder }>> {
  if (!organizationId) {
    // This check might be redundant if activeOrgId is always fetched by the action,
    // but good for usecase robustness if it could be called from other contexts.
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED, // Or appropriate error
    };
  }

  // Service handles folderId and newName validation.

  const serviceResult = await updateFolderService(
    organizationId,
    folderId,
    newName // Service will trim
  );

  if (!serviceResult.success || !serviceResult.data) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to update folder via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  return {
    success: true,
    data: { folder: serviceResult.data.folder },
  };
} 