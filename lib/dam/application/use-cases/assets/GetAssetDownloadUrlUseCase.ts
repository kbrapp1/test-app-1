import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { ValidationError, NotFoundError } from '@/lib/errors/base';

interface GetAssetDownloadUrlUseCaseParams {
  assetId: string;
  organizationId: string;
  forceDownload?: boolean;
}

interface GetAssetDownloadUrlResult {
  downloadUrl: string;
}

export class GetAssetDownloadUrlUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(params: GetAssetDownloadUrlUseCaseParams): Promise<GetAssetDownloadUrlResult> {
    const { assetId, organizationId, forceDownload = true } = params;

    // 1. Validate input
    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 2. Get the asset to verify ownership and get the storage path
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${assetId} not found.`);
    }
    if (asset.organizationId !== organizationId) {
      throw new ValidationError('Asset does not belong to the specified organization.');
    }

    // 3. Get the signed URL using the storage service
    const downloadUrl = await this.storageService.getSignedUrl(
      asset.storagePath, 
      60 * 5, // 5 minute expiry
      forceDownload,
      asset.name // fileName
    );
    
    if (!downloadUrl) {
      throw new Error('Could not retrieve download URL.');
    }

    return { downloadUrl };
  }
} 
