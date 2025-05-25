import * as crypto from 'crypto';
import { Asset } from '../../../domain/entities/Asset';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { UploadAssetDTO } from '../../dto/UploadAssetDTO';

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
      let storagePath: string | null = null;
      
      try {
        // Build a unique storage path
        const uniqueId = crypto.randomUUID();
        storagePath = `${organizationId}/${userId}/${uniqueId}-${file.name}`;
        
        // Upload the file to storage
        await this.storageService.uploadFile(file, storagePath);
        
        // Prepare data for repository save
        const assetData = {
          userId,
          name: file.name,
          storagePath,
          mimeType: file.type,
          size: file.size,
          folderId,
          organizationId
        };
        
        // Persist metadata in DB
        const created = await this.assetRepository.save(assetData);
        createdAssets.push(created);
        
      } catch (error) {
        // Clean up uploaded file if database save fails
        if (storagePath) {
          try {
            await this.storageService.removeFile(storagePath);
          } catch (cleanupError) {
            console.error(`Failed to cleanup file ${storagePath}:`, cleanupError);
          }
        }
        
        // Re-throw with better error context
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }
    
    return createdAssets;
  }
} 
