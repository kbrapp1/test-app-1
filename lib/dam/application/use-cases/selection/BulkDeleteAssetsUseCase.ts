import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { BulkOperationValidation } from '../../../domain/value-objects/BulkOperationValidation';
import { BulkOperationFactory } from '../../../domain/value-objects/BulkOperationFactory';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface BulkDeleteAssetsUseCaseRequest {
  assetIds: string[];
  folderIds: string[];
  organizationId: string;
  userId: string;
  confirmationRequired?: boolean;
}

interface BulkDeleteAssetsUseCaseResponse {
  deletedAssetIds: string[];
  deletedFolderIds: string[];
  failedAssetIds: string[];
  failedFolderIds: string[];
  errors: string[];
}

/**
 * Bulk Delete Assets Use Case - Application Layer
 * 
 * Handles deleting multiple assets and folders.
 * Validates permissions and handles storage cleanup.
 */
export class BulkDeleteAssetsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService
  ) {}

  public async execute(request: BulkDeleteAssetsUseCaseRequest): Promise<BulkDeleteAssetsUseCaseResponse> {
    const { assetIds, folderIds, organizationId, userId, confirmationRequired = true } = request;

    // Validate input
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (assetIds.length === 0 && folderIds.length === 0) {
      throw new ValidationError('At least one asset or folder must be selected for delete operation');
    }

    // Create and validate bulk operation
    const deleteOperation = BulkOperationFactory.createDeleteOperation(confirmationRequired);
    const operationValidation = BulkOperationValidation.validateOperation(deleteOperation);
    if (!operationValidation.isValid) {
      throw new ValidationError(`Invalid delete operation: ${operationValidation.errors.join(', ')}`);
    }

    const selectionValidation = BulkOperationValidation.isValidForSelection(deleteOperation, assetIds, folderIds);
    if (!selectionValidation.isValid) {
      throw new ValidationError(`Invalid selection for delete: ${selectionValidation.errors.join(', ')}`);
    }

    const result: BulkDeleteAssetsUseCaseResponse = {
      deletedAssetIds: [],
      deletedFolderIds: [],
      failedAssetIds: [],
      failedFolderIds: [],
      errors: []
    };

    try {
      // Validate folder dependencies (check if folders have children)
      if (folderIds.length > 0) {
        await this.validateFolderDependencies(folderIds, organizationId);
      }

      // Delete assets first (to avoid orphaned assets)
      if (assetIds.length > 0) {
        const assetResults = await this.deleteAssets(assetIds, organizationId, userId);
        result.deletedAssetIds = assetResults.deleted;
        result.failedAssetIds = assetResults.failed;
        result.errors.push(...assetResults.errors);
      }

      // Delete folders
      if (folderIds.length > 0) {
        const folderResults = await this.deleteFolders(folderIds, organizationId, userId);
        result.deletedFolderIds = folderResults.deleted;
        result.failedFolderIds = folderResults.failed;
        result.errors.push(...folderResults.errors);
      }

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(`Bulk delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateFolderDependencies(folderIds: string[], organizationId: string): Promise<void> {
    for (const folderId of folderIds) {
      const folder = await this.folderRepository.findById(folderId, organizationId);
      if (!folder) {
        continue; // Will be handled in delete operation
      }

      // Check if folder has children
      const children = await this.folderRepository.findChildren(folderId, organizationId);
      if (children.length > 0) {
        throw new ValidationError(`Cannot delete folder ${folderId}: folder contains ${children.length} items`);
      }
    }
  }

  private async deleteAssets(
    assetIds: string[], 
    organizationId: string, 
    userId: string
  ): Promise<{ deleted: string[]; failed: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const assetId of assetIds) {
      try {
        const asset = await this.assetRepository.findById(assetId);
        if (!asset) {
          failed.push(assetId);
          errors.push(`Asset ${assetId} not found`);
          continue;
        }

        // Validate organization ownership
        if (asset.organizationId !== organizationId) {
          failed.push(assetId);
          errors.push(`Asset ${assetId} does not belong to organization`);
          continue;
        }

        // Delete from storage first
        try {
          await this.storageService.removeFile(asset.storagePath);
        } catch (storageError) {
          // Log storage error but continue with database deletion
          errors.push(`Warning: Failed to delete storage file for asset ${assetId}: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
        }

        // Delete from database
        const deleteSuccess = await this.assetRepository.delete(assetId);
        if (deleteSuccess) {
          deleted.push(assetId);
        } else {
          failed.push(assetId);
          errors.push(`Failed to delete asset ${assetId} from database`);
        }

      } catch (error) {
        failed.push(assetId);
        errors.push(`Failed to delete asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { deleted, failed, errors };
  }

  private async deleteFolders(
    folderIds: string[], 
    organizationId: string, 
    userId: string
  ): Promise<{ deleted: string[]; failed: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const folderId of folderIds) {
      try {
        const folder = await this.folderRepository.findById(folderId, organizationId);
        if (!folder) {
          failed.push(folderId);
          errors.push(`Folder ${folderId} not found`);
          continue;
        }

        // Validate organization ownership
        if (folder.organizationId !== organizationId) {
          failed.push(folderId);
          errors.push(`Folder ${folderId} does not belong to organization`);
          continue;
        }

        // Delete folder from database
        await this.folderRepository.delete(folderId, organizationId);
        deleted.push(folderId);

      } catch (error) {
        failed.push(folderId);
        errors.push(`Failed to delete folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { deleted, failed, errors };
  }
} 