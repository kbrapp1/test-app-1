import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/base';

interface DeleteAssetUseCaseParams {
  assetId: string;
  organizationId: string;
}

interface DeleteAssetResult {
  deletedAssetId: string;
  folderId: string | null; // For revalidation path
}

export class DeleteAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(params: DeleteAssetUseCaseParams): Promise<DeleteAssetResult> {
    const { assetId, organizationId } = params;

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

    // Store folderId for return value (needed for path revalidation)
    const folderId = asset.folderId ?? null;

    // 3. Get the storage path before deleting the asset from the database
    const storagePath = await this.assetRepository.getStoragePath(assetId);
    
    // 4. Delete the asset from the database
    try {
      const deleted = await this.assetRepository.delete(assetId);
      if (!deleted) {
        throw new DatabaseError(`Failed to delete asset with ID ${assetId} from database.`);
      }
    } catch (error) {
      console.error('Error deleting asset from database:', error);
      throw new DatabaseError(
        'Failed to delete asset from database.',
        (error as Error).message
      );
    }

    // 5. Delete the asset from storage if a storage path was found
    if (storagePath) {
      try {
        await this.storageService.removeFile(storagePath);
      } catch (error) {
        // Log the error but don't fail the operation if the storage deletion fails
        // The database record is already deleted at this point
        console.error(`Error deleting asset file from storage at path ${storagePath}:`, error);
        // We could consider throwing here, but that would leave the database and storage out of sync
        // Instead, we log the error and continue, possibly flagging for cleanup later
      }
    }

    // 6. Return success with the deleted asset ID and folder ID
    return {
      deletedAssetId: assetId,
      folderId
    };
  }
} 
