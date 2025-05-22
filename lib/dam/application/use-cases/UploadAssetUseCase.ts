import crypto from 'crypto';
import { Asset } from '../../domain/entities/Asset';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../domain/repositories/IStorageService';
import { UploadAssetDTO } from '../dto/UploadAssetDTO';

/**
 * Use case for uploading files and saving them as Asset metadata.
 */
export class UploadAssetUseCase {
  constructor(
    private storageService: IStorageService,
    private assetRepository: IAssetRepository
  ) {}

  /**
   * Executes the upload process:
   * 1. Uploads each file via the storage service
   * 2. Persists asset metadata via the asset repository
   * @param dtos Array of upload parameters per file
   * @returns Array of created Asset domain entities
   */
  async execute(dtos: UploadAssetDTO[]): Promise<Asset[]> {
    const createdAssets: Asset[] = [];
    for (const { file, folderId, userId, organizationId } of dtos) {
      // Build a unique storage path
      const uniqueId = crypto.randomUUID();
      const storagePath = `${organizationId}/${userId}/${uniqueId}-${file.name}`;
      // Upload the file to storage
      await this.storageService.uploadFile(file, storagePath);
      
      // Prepare domain Asset for persistence
      const assetToSave: Asset = {
        id: '', // will be set by the repository
        userId,
        name: file.name,
        storagePath,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date(), // placeholder, overwritten by repository mapping
        updatedAt: undefined,
        folderId,
        organizationId
      };
      // Persist metadata in DB
      const created = await this.assetRepository.save(assetToSave);
      createdAssets.push(created);
    }
    return createdAssets;
  }
} 