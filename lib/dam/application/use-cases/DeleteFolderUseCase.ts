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
    const folderToDelete = await this.folderRepository.findById(folderId);
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
      const success = await this.folderRepository.delete(folderId);
      // If delete returns false without throwing, it might indicate a non-exceptional failure (e.g. RLS silently prevented it)
      // However, our repo throws DatabaseError if children exist. If it returns false for other reasons, we might want to clarify.
      if (!success) {
          // This case might be rare if repo throws for known delete blockers.
          // Could indicate a subtle issue or an RLS restriction not resulting in a thrown error by Supabase client.
          console.warn(`Deletion of folder ${folderId} returned false from repository without throwing an error.`);
          throw new Error(`Deletion of folder "${folderToDelete.name}" failed for an unspecified reason.`);
      }
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