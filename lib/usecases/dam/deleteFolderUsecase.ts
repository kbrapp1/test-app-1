import { deleteFolderService } from '@/lib/services/folder-service';
import { ErrorCodes } from '@/lib/errors/constants';

interface DeleteFolderUsecaseParams {
  organizationId: string;
  folderId: string;
}

interface DeleteFolderUsecaseResultData {
  deletedFolderId: string;
  parentFolderId: string | null;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function deleteFolderUsecase({
  organizationId,
  folderId,
}: DeleteFolderUsecaseParams): Promise<UsecaseResult<DeleteFolderUsecaseResultData>> {
  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required.',
      errorCode: ErrorCodes.UNAUTHORIZED,
    };
  }

  // Service handles folderId validation and the logic of fetching parent_folder_id.

  const serviceResult = await deleteFolderService(organizationId, folderId);

  if (!serviceResult.success || !serviceResult.data) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to delete folder via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // The service already returns the data structure needed by the action layer
  return {
    success: true,
    data: serviceResult.data, // Contains deletedFolderId and parentFolderId
  };
} 