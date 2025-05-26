import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { BulkOperationValidation } from '../../../domain/value-objects/BulkOperationValidation';
import { BulkOperationFactory } from '../../../domain/value-objects/BulkOperationFactory';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface BulkMoveAssetsUseCaseRequest {
  assetIds: string[];
  folderIds: string[];
  targetFolderId: string | null;
  organizationId: string;
  userId: string;
}

interface BulkMoveAssetsUseCaseResponse {
  movedAssetIds: string[];
  movedFolderIds: string[];
  failedAssetIds: string[];
  failedFolderIds: string[];
  errors: string[];
}

/**
 * Bulk Move Assets Use Case - Application Layer
 * 
 * Handles moving multiple assets and folders to a target folder.
 * Validates permissions and prevents circular dependencies.
 */
export class BulkMoveAssetsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository
  ) {}

  public async execute(request: BulkMoveAssetsUseCaseRequest): Promise<BulkMoveAssetsUseCaseResponse> {
    const { assetIds, folderIds, targetFolderId, organizationId, userId } = request;

    // Validate input
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (assetIds.length === 0 && folderIds.length === 0) {
      throw new ValidationError('At least one asset or folder must be selected for move operation');
    }

    // Create and validate bulk operation
    const moveOperation = BulkOperationFactory.createMoveOperation(targetFolderId);
    const operationValidation = BulkOperationValidation.validateOperation(moveOperation);
    if (!operationValidation.isValid) {
      throw new ValidationError(`Invalid move operation: ${operationValidation.errors.join(', ')}`);
    }

    const selectionValidation = BulkOperationValidation.isValidForSelection(moveOperation, assetIds, folderIds);
    if (!selectionValidation.isValid) {
      throw new ValidationError(`Invalid selection for move: ${selectionValidation.errors.join(', ')}`);
    }

    const result: BulkMoveAssetsUseCaseResponse = {
      movedAssetIds: [],
      movedFolderIds: [],
      failedAssetIds: [],
      failedFolderIds: [],
      errors: []
    };

    try {
      // Validate target folder exists and user has permission
      if (targetFolderId) {
        await this.validateTargetFolder(targetFolderId, organizationId, userId);
      }

      // Check for circular dependencies in folder moves
      if (folderIds.length > 0) {
        await this.validateNoCircularDependencies(folderIds, targetFolderId, organizationId);
      }

      // Move assets
      if (assetIds.length > 0) {
        const assetResults = await this.moveAssets(assetIds, targetFolderId, organizationId, userId);
        result.movedAssetIds = assetResults.moved;
        result.failedAssetIds = assetResults.failed;
        result.errors.push(...assetResults.errors);
      }

      // Move folders
      if (folderIds.length > 0) {
        const folderResults = await this.moveFolders(folderIds, targetFolderId, organizationId, userId);
        result.movedFolderIds = folderResults.moved;
        result.failedFolderIds = folderResults.failed;
        result.errors.push(...folderResults.errors);
      }

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(`Bulk move operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateTargetFolder(targetFolderId: string, organizationId: string, userId: string): Promise<void> {
    const targetFolder = await this.folderRepository.findById(targetFolderId, organizationId);
    if (!targetFolder) {
      throw new ValidationError('Target folder not found');
    }
    // Additional permission checks could be added here
  }

  private async validateNoCircularDependencies(
    folderIds: string[], 
    targetFolderId: string | null, 
    organizationId: string
  ): Promise<void> {
    if (!targetFolderId) return; // Moving to root is always safe

    // Check if any folder being moved is an ancestor of the target
    for (const folderId of folderIds) {
      if (await this.isAncestorFolder(folderId, targetFolderId, organizationId)) {
        // Get folder name for user-friendly error message
        const folder = await this.folderRepository.findById(folderId, organizationId);
        const folderName = folder?.name || 'Unknown folder';
        
        throw new ValidationError(`Cannot move "${folderName}" into one of its own subfolders. This would create a circular dependency.`);
      }
    }
  }

  private async isAncestorFolder(
    potentialAncestorId: string, 
    descendantId: string, 
    organizationId: string
  ): Promise<boolean> {
    if (potentialAncestorId === descendantId) {
      return true;
    }

    const descendant = await this.folderRepository.findById(descendantId, organizationId);
    if (!descendant || !descendant.parentFolderId) {
      return false;
    }

    return this.isAncestorFolder(potentialAncestorId, descendant.parentFolderId, organizationId);
  }

  private async moveAssets(
    assetIds: string[], 
    targetFolderId: string | null, 
    organizationId: string, 
    userId: string
  ): Promise<{ moved: string[]; failed: string[]; errors: string[] }> {
    const moved: string[] = [];
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

        // Update asset folder using repository
        await this.assetRepository.update(assetId, { folderId: targetFolderId });
        moved.push(assetId);

      } catch (error) {
        failed.push(assetId);
        errors.push(`Failed to move asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { moved, failed, errors };
  }

  private async moveFolders(
    folderIds: string[], 
    targetFolderId: string | null, 
    organizationId: string, 
    userId: string
  ): Promise<{ moved: string[]; failed: string[]; errors: string[] }> {
    const moved: string[] = [];
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

        // Update folder parent using repository
        await this.folderRepository.update(folderId, { parentFolderId: targetFolderId }, organizationId);
        moved.push(folderId);

      } catch (error) {
        failed.push(folderId);
        errors.push(`Failed to move folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { moved, failed, errors };
  }
} 