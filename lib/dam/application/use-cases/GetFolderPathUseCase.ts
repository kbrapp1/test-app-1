import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError } from '@/lib/errors/base';

interface GetFolderPathUseCaseParams {
  folderId: string;
  // organizationId might be relevant if getPath needs to be scoped, 
  // but IFolderRepository.getPath currently only takes folderId.
}

interface PathSegment {
  id: string;
  name: string;
}

export class GetFolderPathUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ folderId }: GetFolderPathUseCaseParams): Promise<PathSegment[]> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required to get its path.');
    }

    // Optional: Check if the folder exists first. 
    // The RPC 'get_folder_path' might return empty or error if folderId is invalid.
    // const folder = await this.folderRepository.findById(folderId);
    // if (!folder) {
    //   throw new NotFoundError(`Folder with ID "${folderId}" not found.`);
    // }

    try {
      const path = await this.folderRepository.getPath(folderId);
      if (path.length === 0 && folderId !== 'root') { // Assuming 'root' isn't a real ID but a concept for root
        // This check depends on how get_folder_path RPC behaves for non-existent IDs.
        // If RPC returns empty for invalid ID, check if folder exists to throw NotFoundError.
        const folderExists = await this.folderRepository.findById(folderId);
        if(!folderExists) {
            throw new NotFoundError(`Folder with ID "${folderId}" not found, cannot get path.`);
        }
      }
      return path;
    } catch (error) {
      console.error(`Error getting path for folder ${folderId} in use case:`, error);
      // If the error from repository is a DatabaseError because RPC failed specifically for not found,
      // it might be better to catch that and throw a NotFoundError.
      // For now, re-throwing.
      throw error;
    }
  }
} 