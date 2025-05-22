import { randomUUID } from 'crypto';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IStorageService } from '../../domain/repositories/IStorageService';
import { Asset } from '../../domain/entities/Asset';
import { AppError, ValidationError, DatabaseError, ExternalServiceError } from '@/lib/errors/base';

const DEFAULT_TEXT_MIME_TYPE = 'text/plain';
const DEFAULT_TEXT_EXTENSION = '.txt';

interface CreateTextAssetUseCaseRequest {
  organizationId: string;
  userId: string;
  content: string;
  desiredName: string;
  folderId?: string | null;
}

interface CreateTextAssetUseCaseResponse {
  newAssetId: string;
}

export class CreateTextAssetUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private storageService: IStorageService
  ) {}

  public async execute(request: CreateTextAssetUseCaseRequest): Promise<CreateTextAssetUseCaseResponse> {
    const { organizationId, userId, content, desiredName, folderId } = request;

    if (!organizationId) throw new ValidationError('Organization ID is required.');
    if (!userId) throw new ValidationError('User ID is required.');
    if (!desiredName || desiredName.trim() === '') {
      throw new ValidationError('Asset name cannot be empty.');
    }

    const newAssetId = randomUUID();
    let finalName = desiredName.trim();
    if (!finalName.endsWith(DEFAULT_TEXT_EXTENSION)) {
      finalName += DEFAULT_TEXT_EXTENSION;
    }

    // Construct storage path carefully, ensuring no leading slashes if bucket handles root
    const storagePath = `${organizationId}/${userId}/text_assets/${newAssetId}${DEFAULT_TEXT_EXTENSION}`;
    
    const blob = new Blob([content], { type: DEFAULT_TEXT_MIME_TYPE });
    const fileToUpload = new File([blob], finalName, { type: DEFAULT_TEXT_MIME_TYPE });
    const fileSize = blob.size;

    let uploadedPath: string | null = null;

    try {
      const uploadResult = await this.storageService.uploadFile(fileToUpload, storagePath, false); // upsert = false
      uploadedPath = uploadResult.storagePath; // Keep track for potential cleanup

      const assetToCreate: Omit<Asset, 'createdAt' | 'updatedAt'> & { createdAt?: Date, updatedAt?: Date } = {
        id: newAssetId,
        name: finalName,
        storagePath: uploadedPath,
        mimeType: DEFAULT_TEXT_MIME_TYPE,
        size: fileSize,
        userId,
        organizationId,
        folderId: (folderId && folderId !== 'null' && folderId.trim() !== '') ? folderId : null,
        // createdAt and updatedAt will be handled by the repository or database
      };

      const savedAsset = await this.assetRepository.save(assetToCreate as Asset); // Type assertion

      return { newAssetId: savedAsset.id.toString() };

    } catch (error: any) {
      console.error(`Error in CreateTextAssetUseCase for "${finalName}":`, error);
      // Attempt to clean up uploaded file if DB insert fails or other errors occur after upload
      if (uploadedPath) {
        try {
          await this.storageService.removeFile(uploadedPath);
          console.info(`Cleaned up stored file ${uploadedPath} after error.`);
        } catch (cleanupError: any) {
          console.error(`Failed to clean up stored file ${uploadedPath} after error:`, cleanupError);
          // Potentially log this to an error monitoring service as it indicates an orphaned file
        }
      }

      if (error instanceof AppError) {
        throw error;
      }
      if (error.message.includes('upload')) { // Crude check, make more specific if possible
         throw new ExternalServiceError(`Storage upload failed: ${error.message}`, 'STORAGE_UPLOAD_FAILED');
      }
      throw new DatabaseError(`Failed to create text asset record: ${error.message}`, 'CREATE_ASSET_RECORD_FAILED');
    }
  }
} 