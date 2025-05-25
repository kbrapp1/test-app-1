import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { Asset } from '../../../domain/entities/Asset';
import { AppError, ValidationError, NotFoundError, ExternalServiceError } from '@/lib/errors/base';

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

interface GetAssetContentUseCaseRequest {
  assetId: string;
  organizationId: string;
}

interface GetAssetContentUseCaseResponse {
  content: string;
}

export class GetAssetContentUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private storageService: IStorageService
  ) {}

  public async execute(
    request: GetAssetContentUseCaseRequest
  ): Promise<GetAssetContentUseCaseResponse> {
    const { assetId, organizationId } = request;

    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!organizationId) {
      // This check is important if RLS isn't solely relied upon or for defense-in-depth
      throw new ValidationError('Organization ID is required for context.');
    }

    try {
      const asset = await this.assetRepository.findById(assetId);

      if (!asset) {
        throw new NotFoundError(`Asset with ID "${assetId}" not found.`);
      }

      // Verify organization ownership - essential if findById doesn't already guarantee this via RLS for the calling user context
      // If Supabase RLS for assetRepository.findById is already scoped to the user's org, this explicit check might be redundant
      // but serves as an additional safeguard or if the repository method is more generic.
      if (asset.organizationId !== organizationId) {
        // This case should ideally be caught by RLS, making the asset appear as not found.
        // If it gets here, it implies a potential RLS misconfiguration or a broader scope for findById.
        console.warn(`Asset ${assetId} organization mismatch. Expected ${organizationId}, got ${asset.organizationId}.`);
        throw new NotFoundError(`Asset with ID "${assetId}" not found for the specified organization.`);
      }

      if (!asset.storagePath) {
        throw new NotFoundError(`Storage path for asset "${assetId}" is missing.`);
      }

      if (!asset.mimeType || !TEXT_MIME_TYPES.includes(asset.mimeType as TextMimeType)) {
        throw new ValidationError(`Asset "${assetId}" is not a supported text file type (mime: ${asset.mimeType || 'unknown'}).`);
      }

      let blob: Blob;
      try {
        blob = await this.storageService.downloadFileAsBlob(asset.storagePath);
      } catch (storageError: any) {
        console.error(`Storage error downloading asset ${assetId} from ${asset.storagePath}:`, storageError);
        throw new ExternalServiceError(
          `Failed to download asset content from storage: ${storageError.message}`,
          'STORAGE_DOWNLOAD_FAILED',
          { assetId, storagePath: asset.storagePath }
        );
      }

      const content = await blob.text();
      return { content };

    } catch (error: any) {
      if (error instanceof AppError) { // Re-throw known app errors
        throw error;
      }
      console.error(`Unexpected error in GetAssetContentUseCase for asset ${assetId}:`, error);
      throw new AppError(
        `An unexpected error occurred while getting asset content: ${error.message}`,
        'GET_ASSET_CONTENT_UNEXPECTED_ERROR'
      );
    }
  }
} 
