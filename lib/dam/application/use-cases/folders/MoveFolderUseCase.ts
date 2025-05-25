import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/base';

interface MoveFolderUseCaseParams {
  folderId: string;
  targetParentFolderId: string | null; // null means move to root
  organizationId: string;
}

export class MoveFolderUseCase {
  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(params: MoveFolderUseCaseParams): Promise<void> {
    const { folderId, targetParentFolderId, organizationId } = params;

    // 1. Validate input
    if (!folderId) {
      throw new ValidationError('Folder ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 2. Verify folder exists and belongs to the specified organization
    const folder = await this.folderRepository.findById(folderId, organizationId);
    if (!folder) {
      throw new NotFoundError(`Folder with ID ${folderId} not found.`);
    }
    if (folder.organizationId !== organizationId) {
      throw new NotFoundError(`Folder with ID ${folderId} not found in this organization.`);
    }

    // 3. If already in the target parent folder, do nothing
    if (folder.parentFolderId === targetParentFolderId) {
      return; // No change needed
    }

    // 4. Prevent moving folder into itself
    if (folderId === targetParentFolderId) {
      throw new ValidationError('A folder cannot be moved into itself.');
    }

    // 5. If moving to a parent folder (not root), verify the target folder exists and belongs to the organization
    if (targetParentFolderId !== null) {
      const targetFolder = await this.folderRepository.findById(targetParentFolderId, organizationId);
      if (!targetFolder) {
        throw new NotFoundError(`Target folder with ID ${targetParentFolderId} not found.`);
      }
      if (targetFolder.organizationId !== organizationId) {
        throw new NotFoundError(`Target folder with ID ${targetParentFolderId} not found in this organization.`);
      }

      // 6. Prevent circular dependencies - check if target folder is a descendant of the folder being moved
      const targetPath = await this.folderRepository.getPath(targetParentFolderId, organizationId);
      if (targetPath.includes(`/${folder.name}/`)) {
        throw new ValidationError('Cannot move a folder into one of its own subfolders.');
      }
    }

    // 7. Check for name conflicts in the target location
    const conflictingFolder = await this.folderRepository.findByName(
      folder.name,
      organizationId,
      targetParentFolderId
    );
    if (conflictingFolder && conflictingFolder.id !== folderId) {
      throw new ConflictError(
        `A folder named "${folder.name}" already exists in the target location.`
      );
    }

    // 8. Update the folder's parent ID
    try {
      await this.folderRepository.update(folderId, { parentFolderId: targetParentFolderId }, organizationId);
    } catch (error) {
      console.error('Error moving folder:', error);
      throw new Error(
        `Failed to move folder "${folder.name}" to the target location.`
      );
    }
  }
} 
