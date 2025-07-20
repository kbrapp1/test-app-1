// DAM Integration Service Interfaces - DDD Application Layer
// Single Responsibility: Define contracts for DAM integration without infrastructure dependencies
// Following Golden Rule: Application layer defines interfaces, infrastructure implements them

import { Result, success, error } from '../../domain/value-objects';
import { 
  SaveAssetToDAMDto, 
  DAMAssetDto, 
  FileUploadDto, 
  FileUploadResultDto 
} from '../dto/DAMIntegrationDto';

/**
 * Storage Service Interface for DAM integration
 * Application layer contract - infrastructure will implement
 */
export interface IDAMStorageService {
  uploadFile(uploadDto: FileUploadDto): Promise<FileUploadResultDto>;
  getFileUrl(storagePath: string): Promise<string>;
  deleteFile(storagePath: string): Promise<boolean>;
}

/**
 * Asset Repository Interface for DAM integration  
 * Application layer contract - infrastructure will implement
 */
export interface IDAMAssetRepository {
  save(assetDto: SaveAssetToDAMDto): Promise<DAMAssetDto>;
  findById(assetId: string): Promise<DAMAssetDto | null>;
  deleteById(assetId: string): Promise<boolean>;
}

/**
 * DAM Integration Application Service
 * Single Responsibility: Orchestrate DAM operations for image generation use cases
 * Following Golden Rule: No infrastructure dependencies, only domain and application layer
 */
export class DAMIntegrationApplicationService {
  constructor(
    private readonly storageService: IDAMStorageService,
    private readonly assetRepository: IDAMAssetRepository
  ) {}

  async saveGeneratedImageToDAM(
    imageUrl: string,
    organizationId: string,
    userId: string,
    displayTitle: string,
    generationId: string,
    folderId?: string
  ): Promise<Result<DAMAssetDto, string>> {
    try {
      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return error('Failed to download generated image');
      }
      
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], `generated-${generationId}.webp`, {
        type: 'image/webp'
      });

      // Generate storage path following organization structure
      const storagePath = `${organizationId}/${userId}/generated-images/${imageFile.name}`;
      
      // Upload to storage
      const uploadResult = await this.storageService.uploadFile({
        file: imageFile,
        storagePath
      });
      
      // Save asset metadata
      const assetDto: SaveAssetToDAMDto = {
        userId,
        organizationId,
        name: displayTitle,
        storagePath: uploadResult.storagePath,
        mimeType: 'image/webp',
        size: uploadResult.size,
        folderId: folderId || null,
      };

      const savedAsset = await this.assetRepository.save(assetDto);
      
      return success(savedAsset);
    } catch (err) {
      return error(`Failed to save image to DAM: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
} 