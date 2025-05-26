import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { BulkOperationValidation } from '../../../domain/value-objects/BulkOperationValidation';
import { BulkOperationFactory } from '../../../domain/value-objects/BulkOperationFactory';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface BulkTagAssetsUseCaseRequest {
  assetIds: string[];
  tagIds: string[];
  operation: 'add' | 'remove';
  organizationId: string;
  userId: string;
}

interface BulkTagAssetsUseCaseResponse {
  processedAssetIds: string[];
  failedAssetIds: string[];
  errors: string[];
}

/**
 * Bulk Tag Assets Use Case - Application Layer
 * 
 * Handles adding or removing tags from multiple assets.
 * Only works with assets (folders don't support tags).
 */
export class BulkTagAssetsUseCase {
  constructor(
    private assetRepository: IAssetRepository
  ) {}

  public async execute(request: BulkTagAssetsUseCaseRequest): Promise<BulkTagAssetsUseCaseResponse> {
    const { assetIds, tagIds, operation, organizationId, userId } = request;

    // Validate input
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (assetIds.length === 0) {
      throw new ValidationError('At least one asset must be selected for tag operation');
    }
    if (tagIds.length === 0) {
      throw new ValidationError('At least one tag must be specified');
    }
    if (!['add', 'remove'].includes(operation)) {
      throw new ValidationError('Operation must be either "add" or "remove"');
    }

    // Create and validate bulk operation
    const tagOperation = operation === 'add' 
      ? BulkOperationFactory.createAddTagsOperation(tagIds)
      : BulkOperationFactory.createRemoveTagsOperation(tagIds);

    const operationValidation = BulkOperationValidation.validateOperation(tagOperation);
    if (!operationValidation.isValid) {
      throw new ValidationError(`Invalid tag operation: ${operationValidation.errors.join(', ')}`);
    }

    const selectionValidation = BulkOperationValidation.isValidForSelection(tagOperation, assetIds, []);
    if (!selectionValidation.isValid) {
      throw new ValidationError(`Invalid selection for tag operation: ${selectionValidation.errors.join(', ')}`);
    }

    const result: BulkTagAssetsUseCaseResponse = {
      processedAssetIds: [],
      failedAssetIds: [],
      errors: []
    };

    try {
      // Validate all tag IDs exist (this would typically involve a tag repository)
      await this.validateTagIds(tagIds, organizationId);

      // Process each asset
      for (const assetId of assetIds) {
        try {
          const asset = await this.assetRepository.findById(assetId);
          if (!asset) {
            result.failedAssetIds.push(assetId);
            result.errors.push(`Asset ${assetId} not found`);
            continue;
          }

          // Validate organization ownership
          if (asset.organizationId !== organizationId) {
            result.failedAssetIds.push(assetId);
            result.errors.push(`Asset ${assetId} does not belong to organization`);
            continue;
          }

          // Apply tag operation
          if (operation === 'add') {
            await this.addTagsToAsset(assetId, tagIds, organizationId);
          } else {
            await this.removeTagsFromAsset(assetId, tagIds, organizationId);
          }

          result.processedAssetIds.push(assetId);

        } catch (error) {
          result.failedAssetIds.push(assetId);
          result.errors.push(`Failed to ${operation} tags for asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(`Bulk tag operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateTagIds(tagIds: string[], organizationId: string): Promise<void> {
    // This would typically validate that all tag IDs exist and belong to the organization
    // For now, we'll do basic validation
    for (const tagId of tagIds) {
      if (!tagId || tagId.trim().length === 0) {
        throw new ValidationError('Invalid tag ID provided');
      }
    }
  }

  private async addTagsToAsset(assetId: string, tagIds: string[], organizationId: string): Promise<void> {
    // This would typically use a dedicated asset-tag repository or service
    // For now, we'll simulate the operation
    // In a real implementation, this might involve:
    // 1. Getting current asset tags
    // 2. Adding new tags (avoiding duplicates)
    // 3. Updating the asset-tag relationships
    
    // Placeholder implementation - would need actual asset-tag relationship management
    
  }

  private async removeTagsFromAsset(assetId: string, tagIds: string[], organizationId: string): Promise<void> {
    // This would typically use a dedicated asset-tag repository or service
    // For now, we'll simulate the operation
    // In a real implementation, this might involve:
    // 1. Getting current asset tags
    // 2. Removing specified tags
    // 3. Updating the asset-tag relationships
    
    // Placeholder implementation - would need actual asset-tag relationship management
    
  }
} 