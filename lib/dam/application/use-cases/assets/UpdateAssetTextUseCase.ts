import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { AppError, ValidationError, NotFoundError, ExternalServiceError, DatabaseError } from '@/lib/errors/base';

// Copied from ListTextAssetsUseCase - consider centralizing
const TEXT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html',
  'text/css',
  'text/javascript',
] as const;
type TextMimeType = typeof TEXT_MIME_TYPES[number];

interface UpdateAssetTextUseCaseRequest {
  assetId: string;
  organizationId: string;
  newContent: string;
}

export class UpdateAssetTextUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private storageService: IStorageService
  ) {}

  public async execute(request: UpdateAssetTextUseCaseRequest): Promise<void> {
    const { assetId, organizationId, newContent } = request;

    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required for context.');
    }
    // newContent can be an empty string, so no check for emptiness here unless business rule dictates otherwise.

    try {
      const asset = await this.assetRepository.findById(assetId);

      if (!asset) {
        throw new NotFoundError(`Asset with ID "${assetId}" not found.`);
      }
      if (asset.organizationId !== organizationId) {
        throw new NotFoundError(`Asset with ID "${assetId}" not found for the specified organization.`);
      }
      if (!asset.storagePath) {
        throw new NotFoundError(`Storage path for asset "${assetId}" is missing. Cannot update content.`);
      }
      if (!asset.mimeType || !TEXT_MIME_TYPES.includes(asset.mimeType as TextMimeType)) {
        throw new ValidationError(
          `Asset "${assetId}" is not a supported text file type (mime: ${asset.mimeType || 'unknown'}). Cannot update content.`
        );
      }

      // Convert newContent string to a File object
      const blob = new Blob([newContent], { type: asset.mimeType });
      // Extract filename from storagePath or use asset.name
      const filename = asset.name || asset.storagePath.substring(asset.storagePath.lastIndexOf('/') + 1);
      const fileToUpload = new File([blob], filename, { type: asset.mimeType });

      try {
        await this.storageService.uploadFile(fileToUpload, asset.storagePath, true); // upsert = true
      } catch (storageError: unknown) {
        console.error(`Storage error updating asset ${assetId} at ${asset.storagePath}:`, storageError);
        const errorMessage = storageError instanceof Error ? storageError.message : 'Unknown storage error';
        throw new ExternalServiceError(
          `Failed to upload updated asset content to storage: ${errorMessage}`,
          'STORAGE_UPLOAD_FAILED',
          { assetId, storagePath: asset.storagePath }
        );
      }

      // Update asset metadata (size and updatedAt)
      const newSize = blob.size;
      const updatedAsset = await this.assetRepository.update(assetId, {
        size: newSize,
        updatedAt: new Date(),
      });

      if (!updatedAsset) {
        // This might indicate that the asset was deleted between the findById and update calls, or another issue.
        throw new DatabaseError(
          `Failed to update asset metadata for "${assetId}" after content update.`,
          'ASSET_METADATA_UPDATE_FAILED'
        );
      }

    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Unexpected error in UpdateAssetTextUseCase for asset ${assetId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(
        `An unexpected error occurred while updating asset text: ${errorMessage}`,
        'UPDATE_ASSET_TEXT_UNEXPECTED_ERROR'
      );
    }
  }
} 
