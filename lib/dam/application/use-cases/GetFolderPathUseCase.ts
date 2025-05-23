import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError } from '@/lib/errors/base';

interface GetFolderPathUseCaseParams {
  folderId: string;
  organizationId: string; // Required for security and validation
}

interface PathSegment {
  id: string;
  name: string;
}

export class GetFolderPathUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute({ folderId, organizationId }: GetFolderPathUseCaseParams): Promise<string> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required to get its path.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to get folder path.');
    }

    // Optional: Check if the folder exists first. 
    // The RPC 'get_folder_path' might return empty or error if folderId is invalid.
    // const folder = await this.folderRepository.findById(folderId);
    // if (!folder) {
    //   throw new NotFoundError(`Folder with ID "${folderId}" not found.`);
    // }

    try {
      const path = await this.folderRepository.getPath(folderId, organizationId);
      if (path === '/' && folderId !== 'root') { // If we get root path but folderId isn't root
        // Check if folder exists to throw NotFoundError if it doesn't exist.
        const folderExists = await this.folderRepository.findById(folderId, organizationId);
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