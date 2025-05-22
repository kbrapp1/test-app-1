import { Folder } from '../../domain/entities/Folder';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError } from '@/lib/errors/base';

interface ListFoldersUseCaseParams {
  parentId: string | null; // ID of the parent folder, or null for root folders
  organizationId: string;
  // Future: pagination, sorting
}

export class ListFoldersUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ 
    parentId,
    organizationId 
  }: ListFoldersUseCaseParams): Promise<Folder[]> {
    // parentId can be null, which is fine. Organization ID is required.
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    try {
      // This relies on a new method in IFolderRepository
      const folders = await this.folderRepository.findFoldersByParentId(parentId, organizationId);
      return folders;
    } catch (error) {
      console.error(`Error listing folders for parent ${parentId} in use case:`, error);
      throw error; // Re-throw or wrap
    }
  }
} 