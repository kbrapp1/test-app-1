import { Folder } from '../../../domain/entities/Folder';
import { IFolderRepository, UpdateFolderData } from '../../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/base';

interface UpdateFolderUseCaseParams {
  folderId: string;
  name?: string; // Optional: new name for the folder
  parentFolderId?: string | null; // Optional: new parent folder ID (null for root)
  organizationId: string; // Required for validation, e.g., checking new parent is in the same org
  // userId?: string; // Potentially for audit logging if the use case handles that
}

export class UpdateFolderUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({
    folderId,
    name,
    parentFolderId,
    organizationId,
  }: UpdateFolderUseCaseParams): Promise<Folder> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required for update.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required for context during update.');
    }
    if (name === undefined && parentFolderId === undefined) {
      throw new ValidationError('Nothing to update. Provide at least a name or a new parent folder.');
    }
    if (name !== undefined && name.trim() === '') {
      throw new ValidationError('Folder name cannot be empty if provided.');
    }

    // 1. Fetch the existing folder to ensure it exists and for context
    const existingFolder = await this.folderRepository.findById(folderId, organizationId);
    if (!existingFolder || existingFolder.organizationId !== organizationId) {
      throw new NotFoundError(`Folder with ID "${folderId}" not found in this organization.`);
    }

    // 2. Validate parentFolderId if it's being changed
    if (parentFolderId !== undefined) {
      if (parentFolderId === folderId) {
        throw new ValidationError('A folder cannot be its own parent.');
      }
      if (parentFolderId !== null) {
        const newParent = await this.folderRepository.findById(parentFolderId, organizationId);
        if (!newParent || newParent.organizationId !== organizationId) {
          throw new ValidationError(
            `New parent folder with ID "${parentFolderId}" not found in this organization.`
          );
        }
        // Additional check: prevent circular dependencies (e.g. moving a parent into its own child)
        // This might involve checking the entire path of the newParent to ensure folderId is not in it.
        // For simplicity, this is omitted here but is important for robust folder structures.
        const parentPath = await this.folderRepository.getPath(parentFolderId, organizationId);
        if (parentPath.includes(`/${existingFolder.name}/`)) { // Simple circular dependency check
          throw new ValidationError('Cannot move a folder into one of its own subfolders.');
        }
      }
    }

    // 3. Check for name conflict if name is being changed or if moving to a new parent
    const effectiveName = name !== undefined ? name.trim() : existingFolder.name;
    const effectiveParentId = parentFolderId !== undefined ? parentFolderId : existingFolder.parentFolderId;

    if (name !== undefined || parentFolderId !== undefined) { // Only check if name or location changes
      const conflictingFolder = await this.folderRepository.findByName(
        effectiveName,
        organizationId,
        effectiveParentId
      );
      // If a conflicting folder exists and it's not the folder we are currently updating
      if (conflictingFolder && conflictingFolder.id !== folderId) {
        throw new ConflictError(
          `A folder named "${effectiveName}" already exists in the target location.`
        );
      }
    }

    // 4. Prepare update data - use the new UpdateFolderData interface
    const updateData: UpdateFolderData = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (parentFolderId !== undefined) {
      updateData.parentFolderId = parentFolderId;
    }

    // 5. Perform the update
    try {
      const updatedFolder = await this.folderRepository.update(folderId, updateData, organizationId);
      if (!updatedFolder) {
        // This might happen if RLS prevents update or row is gone, already handled by findById check mostly
        throw new NotFoundError(`Folder with ID "${folderId}" could not be updated or was not found after update.`);
      }
      return updatedFolder;
    } catch (error) {
      console.error(`Error updating folder ${folderId} in use case:`, error);
      throw error; // Re-throw or wrap
    }
  }
} 
