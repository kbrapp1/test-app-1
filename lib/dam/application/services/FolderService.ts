import { Folder } from '../../domain/entities/Folder';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services';

interface DeleteFolderServiceResultData {
  deletedFolderId: string;
  parentFolderId: string | null;
}

export class FolderService {
  constructor(
    private readonly folderRepository: IFolderRepository
  ) {}

  async createFolder(
    userId: string,
    organizationId: string,
    folderName: string,
    parentFolderId: string | null
  ): Promise<ServiceResult<{ folder: Folder }>> {
    if (!folderName || folderName.trim() === '') {
      return { success: false, error: 'Folder name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Check if a folder with the same name already exists at this location
      const existingFolder = await this.folderRepository.findByName(
        folderName.trim(), 
        organizationId, 
        parentFolderId
      );

      if (existingFolder) {
        return { 
          success: false, 
          error: 'A folder with this name already exists in this location.', 
          errorCode: ErrorCodes.DUPLICATE_ENTRY 
        };
      }

      const newFolder = await this.folderRepository.save({
        name: folderName.trim(),
        parentFolderId,
        userId,
        organizationId,
      });

      return { success: true, data: { folder: newFolder } };
    } catch (err: any) {
      console.error('createFolder: Unexpected Error', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }

  async updateFolder(
    organizationId: string,
    folderId: string,
    newName: string
  ): Promise<ServiceResult<{ folder: Folder }>> {
    if (!folderId) {
      return { success: false, error: 'Folder ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }
    if (!newName || newName.trim() === '') {
      return { success: false, error: 'New folder name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Get the folder to check ownership and parent folder ID
      const folder = await this.folderRepository.findById(folderId);
      if (!folder) {
        return { 
          success: false, 
          error: 'Folder not found or you do not have permission to update it.', 
          errorCode: ErrorCodes.RESOURCE_NOT_FOUND 
        };
      }
      
      if (folder.organizationId !== organizationId) {
        return { 
          success: false, 
          error: 'Folder not found or you do not have permission to update it.', 
          errorCode: ErrorCodes.RESOURCE_NOT_FOUND 
        };
      }

      // Check if a folder with the same name already exists at this location
      const existingFolder = await this.folderRepository.findByName(
        newName.trim(),
        organizationId,
        folder.parentFolderId
      );

      if (existingFolder && existingFolder.id !== folderId) {
        return { 
          success: false, 
          error: 'A folder with this name already exists in this location.', 
          errorCode: ErrorCodes.DUPLICATE_ENTRY 
        };
      }

      const updatedFolder = await this.folderRepository.update(folderId, { 
        name: newName.trim() 
      });

      if (!updatedFolder) {
        return { 
          success: false, 
          error: 'Folder not found or you do not have permission to update it.', 
          errorCode: ErrorCodes.RESOURCE_NOT_FOUND 
        };
      }

      return { success: true, data: { folder: updatedFolder } };
    } catch (err: any) {
      console.error('updateFolder: Unexpected Error', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }

  async deleteFolder(
    organizationId: string,
    folderId: string
  ): Promise<ServiceResult<DeleteFolderServiceResultData>> {
    if (!folderId) {
      return { success: false, error: 'Folder ID is required for deletion.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Get the folder to check ownership and parent folder ID
      const folder = await this.folderRepository.findById(folderId);
      if (!folder) {
        return { 
          success: false, 
          error: 'Folder not found or you do not have permission to delete it.', 
          errorCode: ErrorCodes.RESOURCE_NOT_FOUND 
        };
      }
      
      if (folder.organizationId !== organizationId) {
        return { 
          success: false, 
          error: 'Folder not found or you do not have permission to delete it.', 
          errorCode: ErrorCodes.RESOURCE_NOT_FOUND 
        };
      }

      const parentFolderId = folder.parentFolderId ?? null;

      // The repository.delete method already checks for children and throws if found
      const deleted = await this.folderRepository.delete(folderId);
      if (!deleted) {
        return { 
          success: false, 
          error: 'Failed to delete folder.', 
          errorCode: ErrorCodes.DATABASE_ERROR 
        };
      }

      return { 
        success: true, 
        data: { 
          deletedFolderId: folderId,
          parentFolderId
        }
      };
    } catch (err: any) {
      console.error('deleteFolder: Unexpected Error', err);

      // Handle specific error cases
      if (err.message && (
        err.message.includes('contains sub-folders') || 
        err.message.includes('contains assets')
      )) {
        return { 
          success: false, 
          error: 'Cannot delete folder. It may not be empty or is referenced elsewhere.', 
          errorCode: ErrorCodes.RESOURCE_CONFLICT 
        };
      }

      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }
} 