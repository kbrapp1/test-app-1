import { Folder } from '../../domain/entities/Folder';
import { Asset } from '../../domain/entities/Asset';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError } from '@/lib/errors/base';

interface ListFolderChildrenUseCaseParams {
  folderId: string; // ID of the parent folder whose children are to be listed
  organizationId: string;
  // Future considerations: pagination, sorting, filtering by type (asset/folder)
}

export class ListFolderChildrenUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ 
    folderId, 
    organizationId 
  }: ListFolderChildrenUseCaseParams): Promise<(Folder | Asset)[]> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required to list children.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // Optional: Check if the parent folder itself exists before fetching children
    // This adds an extra DB call but can provide a clearer NotFoundError for the parent.
    // const parentFolder = await this.folderRepository.findById(folderId);
    // if (!parentFolder || parentFolder.organizationId !== organizationId) { // Ensure folder belongs to the org
    //   throw new NotFoundError(`Parent folder with ID "${folderId}" not found in this organization.`);
    // }

    try {
      const children = await this.folderRepository.findChildren(folderId, organizationId);
      return children;
    } catch (error) {
      // Log or handle specific errors
      console.error(`Error listing children for folder ${folderId} in use case:`, error);
      throw error; // Re-throw or wrap in an ApplicationError
    }
  }
} 