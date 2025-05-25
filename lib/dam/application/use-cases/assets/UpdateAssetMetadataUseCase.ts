import { Asset } from '../../../domain/entities';
import { IAssetRepository } from '../../../domain/repositories';

/**
 * UpdateAssetMetadataUseCase - Update Asset Properties
 * 
 * This use case handles asset metadata updates:
 * - Rename assets with business rule validation
 * - Move assets between folders
 * - Update asset properties
 * - Ensure domain constraints are met
 */

export interface UpdateAssetMetadataRequest {
  assetId: string;
  updates: {
    name?: string;
    folderId?: string | null;
  };
}

export interface UpdateAssetMetadataResponse {
  success: boolean;
  asset: Asset;
  message: string;
}

export class UpdateAssetMetadataUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(request: UpdateAssetMetadataRequest): Promise<UpdateAssetMetadataResponse> {
    const { assetId, updates } = request;

    // Fetch the current asset
    const currentAsset = await this.assetRepository.findById(assetId);
    if (!currentAsset) {
      throw new Error(`Asset with ID ${assetId} not found`);
    }

    // Validate updates using domain business rules
    if (updates.name !== undefined) {
      if (!currentAsset.canBeRenamedTo(updates.name)) {
        throw new Error(`Asset cannot be renamed to "${updates.name}". Name is invalid or unchanged.`);
      }
    }

    if (updates.folderId !== undefined) {
      if (!currentAsset.canBeMovedTo(updates.folderId)) {
        throw new Error(`Asset cannot be moved to the specified folder. Same folder or invalid target.`);
      }
    }

    // Prepare update data
    const updateData: any = {};
    let changeDescription = '';

    if (updates.name !== undefined && updates.name !== currentAsset.name) {
      updateData.name = updates.name.trim();
      changeDescription += `renamed to "${updates.name}"`;
    }

    if (updates.folderId !== undefined && updates.folderId !== currentAsset.folderId) {
      updateData.folderId = updates.folderId;
      const folderDescription = updates.folderId ? `folder ${updates.folderId}` : 'root';
      if (changeDescription) changeDescription += ' and ';
      changeDescription += `moved to ${folderDescription}`;
    }

    // If no changes, return current asset
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        asset: currentAsset,
        message: 'No changes were made to the asset.',
      };
    }

    // Add timestamp for update
    updateData.updatedAt = new Date();

    // Update the asset in the repository
    const updatedAsset = await this.assetRepository.update(assetId, updateData);

    if (!updatedAsset) {
      throw new Error('Failed to update asset. Asset may have been deleted.');
    }

    return {
      success: true,
      asset: updatedAsset,
      message: `Asset successfully ${changeDescription}.`,
    };
  }

  /**
   * Validates that the asset name meets business requirements
   * This could be expanded with more sophisticated validation
   */
  private validateAssetName(name: string): void {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      throw new Error('Asset name cannot be empty');
    }

    if (trimmedName.length > 255) {
      throw new Error('Asset name cannot exceed 255 characters');
    }

    // Check for invalid characters (this could be expanded)
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      throw new Error('Asset name contains invalid characters');
    }
  }

  /**
   * Validates folder movement
   * This could include checking folder permissions, hierarchy rules, etc.
   */
  private async validateFolderMove(assetId: string, targetFolderId: string | null): Promise<void> {
    // For now, basic validation
    // In a real system, you might check:
    // - Folder exists and user has write access
    // - Folder hierarchy constraints
    // - Organization-level rules
    
    if (targetFolderId) {
      // Could validate that folder exists and is accessible
      // const folder = await this.folderRepository.findById(targetFolderId);
      // if (!folder) throw new Error('Target folder not found');
    }
  }
}

export default UpdateAssetMetadataUseCase; 
