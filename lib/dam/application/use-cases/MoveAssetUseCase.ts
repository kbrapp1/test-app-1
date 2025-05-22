import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/base';

interface MoveAssetUseCaseParams {
  assetId: string;
  targetFolderId: string | null; // null means move to root
  organizationId: string;
}

export class MoveAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly folderRepository: IFolderRepository
  ) {}

  async execute(params: MoveAssetUseCaseParams): Promise<void> {
    const { assetId, targetFolderId, organizationId } = params;

    // 1. Validate input
    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 2. Verify asset exists and belongs to the specified organization
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${assetId} not found.`);
    }
    if (asset.organizationId !== organizationId) {
      throw new NotFoundError(`Asset with ID ${assetId} not found in this organization.`);
    }

    // 3. If already in the target folder, do nothing
    if (asset.folderId === targetFolderId) {
      return; // No change needed
    }

    // 4. If moving to a folder (not root), verify the target folder exists and belongs to the organization
    if (targetFolderId !== null) {
      const targetFolder = await this.folderRepository.findById(targetFolderId);
      if (!targetFolder) {
        throw new NotFoundError(`Target folder with ID ${targetFolderId} not found.`);
      }
      if (targetFolder.organizationId !== organizationId) {
        throw new NotFoundError(`Target folder with ID ${targetFolderId} not found in this organization.`);
      }
    }

    // 5. Update the asset's folder ID
    try {
      const updated = await this.assetRepository.update(assetId, { folderId: targetFolderId });
      if (!updated) {
        throw new DatabaseError(`Failed to update asset with ID ${assetId}.`);
      }
    } catch (error) {
      console.error('Error moving asset:', error);
      throw new DatabaseError(
        'Failed to move asset to the target folder.',
        (error as Error).message
      );
    }
  }
} 