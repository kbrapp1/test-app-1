import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { ValidationError, NotFoundError, DatabaseError, ConflictError } from '@/lib/errors/base';

interface RenameAssetUseCaseParams {
  assetId: string;
  newName: string;
  organizationId: string;
}

interface RenameAssetResult {
  id: string;
  name: string;
}

export class RenameAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository
  ) {}

  async execute(params: RenameAssetUseCaseParams): Promise<RenameAssetResult> {
    const { assetId, newName, organizationId } = params;

    // 1. Validate input
    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!newName || newName.trim() === '') {
      throw new ValidationError('New name cannot be empty.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    const trimmedNewName = newName.trim();

    // 2. Verify asset exists and belongs to the specified organization
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${assetId} not found.`);
    }
    if (asset.organizationId !== organizationId) {
      throw new NotFoundError(`Asset with ID ${assetId} not found in this organization.`);
    }

    // 3. Check if the name is actually changing
    if (asset.name === trimmedNewName) {
      // No change needed, return the existing asset details
      return {
        id: asset.id,
        name: asset.name
      };
    }

    // 4. Check for duplicate names in the same folder
    const existingAssetsWithSameName = await this.assetRepository.findByName(
      trimmedNewName,
      organizationId,
      asset.folderId
    );

    if (existingAssetsWithSameName.length > 0 && 
        existingAssetsWithSameName.some(existingAsset => existingAsset.id !== assetId)) {
      throw new ConflictError(`An asset named "${trimmedNewName}" already exists in this folder.`);
    }

    // 5. Update the asset name
    try {
      const updatedAsset = await this.assetRepository.update(assetId, { name: trimmedNewName });
      if (!updatedAsset) {
        throw new DatabaseError(`Failed to update asset with ID ${assetId}.`);
      }

      return {
        id: updatedAsset.id,
        name: updatedAsset.name
      };
    } catch (error) {
      console.error('Error renaming asset:', error);
      throw new DatabaseError(
        'Failed to rename asset.',
        (error as Error).message
      );
    }
  }
} 