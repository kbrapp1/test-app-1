import { Folder } from '../../../domain/entities/Folder';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { ValidationError } from '@/lib/errors/base';
import type { DamSortParameters, DamFilterParameters } from '../../../application/dto/SearchCriteriaDTO';

interface ListFoldersUseCaseParams {
  parentId: string | null; // ID of the parent folder, or null for root folders
  organizationId: string;
  sortParams?: DamSortParameters;
  filters?: DamFilterParameters;
}

export class ListFoldersUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ 
    parentId,
    organizationId,
    sortParams,
    filters,
  }: ListFoldersUseCaseParams): Promise<Folder[]> {
    // parentId can be null, which is fine. Organization ID is required.
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    try {
      const folders = await this.folderRepository.findFoldersByParentId(
        parentId, 
        organizationId,
        sortParams,
        filters
      );
      
      return folders;
    } catch (error) {
      console.error(`❌ ListFoldersUseCase: Error listing folders for parent ${parentId}:`, error);
      throw error; // Re-throw or wrap
    }
  }
} 
