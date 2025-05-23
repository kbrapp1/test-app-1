import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/base'; // Assuming DatabaseError might be thrown from repo

interface DeleteFolderUseCaseParams {
  folderId: string;
  organizationId: string; // For validation and ensuring the folder belongs to the org
  // userId?: string; // For audit logging if needed
}

export class DeleteFolderUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ folderId, organizationId }: DeleteFolderUseCaseParams): Promise<boolean> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required for deletion.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required for context during deletion.');
    }

    // 1. Verify the folder exists and belongs to the organization before attempting to delete.
    const folderToDelete = await this.folderRepository.findById(folderId, organizationId);
    if (!folderToDelete || folderToDelete.organizationId !== organizationId) {
      // Important to throw NotFoundError here, because the repository's delete 
      // might just return false if RLS prevents access or row doesn't exist,
      // which could be ambiguous.
      throw new NotFoundError(`Folder with ID "${folderId}" not found in this organization.`);
    }

    // 2. Attempt to delete the folder using the repository.
    // The repository's delete method should handle checks for children (assets/subfolders)
    // and throw an error (e.g., a specific DatabaseError or ConflictError) if it cannot be deleted.
    try {
      await this.folderRepository.delete(folderId, organizationId);
      return true;
    } catch (error) {
      // The repository's delete method might throw a DatabaseError or ConflictError if it contains children.
      // We can re-throw it or handle it specifically if needed.
      console.error(`Error deleting folder ${folderId} in use case:`, error);
      // Example: if (error instanceof ConflictError && error.message.includes('contains sub-folders')) ...
      throw error; // Re-throw the original error (could be ConflictError from repo)
    }
  }
} 