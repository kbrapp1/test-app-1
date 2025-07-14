import { Asset as _Asset } from '../../domain/entities/Asset';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository'; 
import { IStorageService } from '../../domain/repositories/IStorageService';
import { ValidationError as _ValidationError, NotFoundError as _NotFoundError, DatabaseError as _DatabaseError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';
import type { ServiceResult } from '@/types/services';

interface DeleteAssetData {
  deletedAssetId: string;
  folderId: string | null;
}

export class AssetService {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly folderRepository: IFolderRepository,
    private readonly storageService: IStorageService
  ) {}

  async moveAsset(
    organizationId: string,
    assetId: string,
    targetFolderId: string | null
  ): Promise<ServiceResult<null>> {
    if (!assetId) {
      return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Find the asset
      const asset = await this.assetRepository.findById(assetId);
      if (!asset) {
        return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }
      if (asset.organizationId !== organizationId) {
        return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }

      // If moving to a folder, verify the folder exists
      if (targetFolderId !== null) {
        const folder = await this.folderRepository.findById(targetFolderId, organizationId);
        if (!folder) {
          return { success: false, error: 'Target folder not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
        }
        if (folder.organizationId !== organizationId) {
          return { success: false, error: 'Target folder not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
        }
      }

      // Update the asset's folder
      await this.assetRepository.update(assetId, { folderId: targetFolderId });
      return { success: true };
    } catch (err: unknown) {
      console.error('moveAsset: Unexpected Error', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }

  async deleteAsset(
    organizationId: string,
    assetId: string
  ): Promise<ServiceResult<DeleteAssetData>> {
    if (!assetId) {
      return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Find the asset to get its storage path and folder ID
      const asset = await this.assetRepository.findById(assetId);
      if (!asset) {
        return { success: false, error: 'Asset not found or access denied.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }
      if (asset.organizationId !== organizationId) {
        return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }

      // Get the storage path for deletion
      const storagePath = asset.storagePath;
      const folderId = asset.folderId;

      // Delete from storage (ignore errors, prioritize database record deletion)
      try {
        await this.storageService.removeFile(storagePath);
      } catch (storageError) {
        console.warn('deleteAsset: Storage deletion error - IGNORING:', storageError);
      }

      // Delete from database
      const deleted = await this.assetRepository.delete(assetId);
      if (!deleted) {
        return { 
          success: false, 
          error: 'Failed to delete asset from database.', 
          errorCode: ErrorCodes.DATABASE_ERROR 
        };
      }

      return { 
        success: true, 
        data: { 
          deletedAssetId: assetId, 
          folderId: folderId || null
        } 
      };
    } catch (err: unknown) {
      console.error('deleteAsset: Unexpected Error', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }

  async getAssetDownloadUrl(
    organizationId: string,
    assetId: string,
    _forceDownload: boolean = true
  ): Promise<ServiceResult<{ downloadUrl: string }>> {
    if (!assetId) {
      return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Get the asset to verify ownership and get the storage path
      const asset = await this.assetRepository.findById(assetId);
      if (!asset) {
        return { success: false, error: 'Asset not found or access denied.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }
      if (asset.organizationId !== organizationId) {
        return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }

      // Get the signed URL using the storage service
      const downloadUrl = await this.storageService.getSignedUrl(
        asset.storagePath, 
        60 * 5, // 5 minute expiry
        true,   // forceDownload flag
        asset.name // fileName
      );
      
      if (!downloadUrl) {
        return { success: false, error: 'Could not retrieve download URL.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
      }

      return { success: true, data: { downloadUrl } };
    } catch (err: unknown) {
      console.error('getAssetDownloadUrl: Unexpected Error', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }

  async renameAsset(
    organizationId: string,
    assetId: string,
    newName: string
  ): Promise<ServiceResult<{ id: string; name: string }>> {
    if (!assetId) {
      return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }
    if (!newName || newName.trim().length === 0) {
      return { success: false, error: 'New name is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
    }

    try {
      // Check if asset exists and belongs to organization
      const asset = await this.assetRepository.findById(assetId);
      if (!asset) {
        return { success: false, error: 'Asset not found or access denied.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }
      if (asset.organizationId !== organizationId) {
        return { success: false, error: 'Asset not found in this organization.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
      }

      // Update the asset name
      const trimmedName = newName.trim();
      try {
        const updatedAsset = await this.assetRepository.update(assetId, { name: trimmedName });
        if (!updatedAsset) {
          return { success: false, error: 'Asset not found or rename not permitted.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
        }

        return { success: true, data: { id: updatedAsset.id, name: updatedAsset.name } };
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('duplicate')) {
          return { success: false, error: 'An asset with this name already exists in this folder/organization.', errorCode: ErrorCodes.DUPLICATE_ENTRY };
        }
        throw error; // Re-throw for the outer catch
      }
    } catch (err: unknown) {
      console.error('renameAsset: Unexpected Error', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred during asset rename.', 
        errorCode: ErrorCodes.UNEXPECTED_ERROR 
      };
    }
  }
} 
