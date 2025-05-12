import { createFolderService } from '@/lib/services/folder-service';
import { Folder } from '@/types/dam';
import { ErrorCodes } from '@/lib/errors/constants';

interface CreateFolderUsecaseParams {
  userId: string;
  organizationId: string;
  folderName: string;
  parentFolderId: string | null;
}

interface UsecaseResult<T = null> {
  success: boolean;
  data?: T;
  error?: string; // User-friendly error message
  errorCode?: string; // For specific error handling
}

export async function createFolderUsecase({
  userId,
  organizationId,
  folderName,
  parentFolderId,
}: CreateFolderUsecaseParams): Promise<UsecaseResult<{ folder: Folder }>> {
  // Usecases can contain more complex business logic, orchestrating multiple services,
  // or handling pre/post conditions. For this simple case, it largely delegates.

  if (!userId || !organizationId) {
    return {
      success: false,
      error: 'User and Organization ID are required.',
      errorCode: ErrorCodes.UNAUTHORIZED, // Corrected error code
    };
  }

  // The service already handles folderName validation.
  // If there were additional usecase-specific validations, they would go here.

  const serviceResult = await createFolderService(
    userId,
    organizationId,
    folderName, // Service will trim
    parentFolderId
  );

  if (!serviceResult.success || !serviceResult.data) {
    return {
      success: false,
      error: serviceResult.error || 'Usecase failed to create folder via service.',
      errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
    };
  }

  // Any post-service logic or data transformation specific to this usecase would go here.
  // For example, logging, audit trails, or more complex object mapping if needed.

  return {
    success: true,
    data: { folder: serviceResult.data.folder },
  };
} 