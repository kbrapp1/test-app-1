import { Folder } from '../../domain/entities/Folder';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ConflictError, ValidationError, DatabaseError } from '@/lib/errors/base'; // Assuming these custom error types exist

interface CreateFolderUseCaseParams {
  name: string;
  parentFolderId: string | null; // null for root folders
  organizationId: string;
  userId: string; // Creator of the folder
}

export class CreateFolderUseCase {
  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(params: CreateFolderUseCaseParams): Promise<Folder> {
    const { name, parentFolderId, organizationId, userId } = params;

    // 1. Validate input
    if (!name || name.trim() === '') {
      throw new ValidationError('Folder name cannot be empty.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }
    if (!userId) {
      throw new ValidationError('User ID is required for creating a folder.');
    }

    // 2. Check for existing folder with the same name under the same parent
    try {
      const existingFolder = await this.folderRepository.findByName(name, organizationId, parentFolderId);
      if (existingFolder) {
        let message = `A folder named "${name}" already exists`;
        if (parentFolderId) {
          message += ` in this location.`;
        } else {
          message += ` at the root level.`;
        }
        throw new ConflictError(message);
      }
    } catch (error) {
      // If findByName throws an error that is not a NotFoundError (which is expected if no folder is found),
      // then it's an unexpected database issue.
      if (!(error instanceof DatabaseError && error.message.toLowerCase().includes('not found'))) { // A bit simplistic check
        console.error('Error checking for existing folder:', error);
        throw new DatabaseError('Failed to check for existing folder before creation.', (error as Error).message);
      }
      // Otherwise, if it's a true not found, that's good, we can proceed.
    }
    

    // 3. Create the folder - use plain object structure for repository
    const folderToCreate = {
      name: name.trim(),
      parentFolderId,
      organizationId,
      userId,
    };

    try {
      const createdFolder = await this.folderRepository.create(folderToCreate);
      return createdFolder;
    } catch (error) {
      console.error('Error saving folder in use case:', error);
      // Assuming folderRepository.save throws a DatabaseError on failure
      throw new DatabaseError('Failed to create folder.', (error as Error).message);
    }
  }
} 