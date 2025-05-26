import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { IStorageService } from '../../../domain/repositories/IStorageService';
import { BulkOperationValidation } from '../../../domain/value-objects/BulkOperationValidation';
import { BulkOperationFactory } from '../../../domain/value-objects/BulkOperationFactory';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface BulkDownloadAssetsUseCaseRequest {
  assetIds: string[];
  folderIds: string[];
  organizationId: string;
  userId: string;
  format?: 'zip' | 'individual';
  includeMetadata?: boolean;
}

interface BulkDownloadAssetsUseCaseResponse {
  downloadUrls: string[];
  zipBlob?: Blob;
  zipFileName?: string;
  failedAssetIds: string[];
  failedFolderIds: string[];
  errors: string[];
}

/**
 * Bulk Download Assets Use Case - Application Layer
 * 
 * Handles generating download URLs for multiple assets and folders.
 * Can create individual URLs or a ZIP archive.
 * For folders, collects all assets within the folder hierarchy.
 */
export class BulkDownloadAssetsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService
  ) {}

  public async execute(request: BulkDownloadAssetsUseCaseRequest): Promise<BulkDownloadAssetsUseCaseResponse> {
    const { assetIds, folderIds, organizationId, userId, format = 'zip', includeMetadata = false } = request;

    // Validate input
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (assetIds.length === 0 && folderIds.length === 0) {
      throw new ValidationError('At least one asset or folder must be selected for download');
    }
    if (!['zip', 'individual'].includes(format)) {
      throw new ValidationError('Format must be either "zip" or "individual"');
    }

    // Create and validate bulk operation
    const downloadOperation = BulkOperationFactory.createDownloadOperation(format, includeMetadata);
    const operationValidation = BulkOperationValidation.validateOperation(downloadOperation);
    if (!operationValidation.isValid) {
      throw new ValidationError(`Invalid download operation: ${operationValidation.errors.join(', ')}`);
    }

    const selectionValidation = BulkOperationValidation.isValidForSelection(downloadOperation, assetIds, folderIds);
    if (!selectionValidation.isValid) {
      throw new ValidationError(`Invalid selection for download: ${selectionValidation.errors.join(', ')}`);
    }

    const result: BulkDownloadAssetsUseCaseResponse = {
      downloadUrls: [],
      failedAssetIds: [],
      failedFolderIds: [],
      errors: []
    };

    try {
      // Collect all assets from direct selection and folder contents
      const allAssets: Array<{ id: string; storagePath: string; name: string; folderPath?: string }> = [];
      
      // Add directly selected assets
      if (assetIds.length > 0) {
        const directAssets = await this.collectDirectAssets(assetIds, organizationId, result);
        allAssets.push(...directAssets);
      }

      // Add assets from selected folders and collect folder names
      const folderNames: string[] = [];
      if (folderIds.length > 0) {
        const { assets: folderAssets, folderNames: collectedFolderNames } = await this.collectFolderAssetsWithNames(folderIds, organizationId, result);
        allAssets.push(...folderAssets);
        folderNames.push(...collectedFolderNames);
      }

      if (allAssets.length === 0) {
        throw new ValidationError('No valid assets found for download');
      }

      // For single asset, provide direct download URL instead of ZIP
      if (allAssets.length === 1 && folderIds.length === 0) {
        const downloadUrls = await this.createIndividualDownloads(allAssets);
        result.downloadUrls = downloadUrls;
        return result;
      }

      // Determine selection type for filename generation
      const selectionType = this.determineSelectionType(assetIds.length, folderIds.length);

      // For multiple assets or folder downloads, create ZIP
      const zipResult = await this.createZipDownload(allAssets, organizationId, userId, {
        folderNames,
        selectionType
      });
      result.zipBlob = zipResult.zipBlob;
      result.zipFileName = zipResult.zipFileName;

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(`Bulk download operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async collectDirectAssets(
    assetIds: string[], 
    organizationId: string, 
    result: BulkDownloadAssetsUseCaseResponse
  ): Promise<Array<{ id: string; storagePath: string; name: string }>> {
      const validAssets: Array<{ id: string; storagePath: string; name: string }> = [];
      
      for (const assetId of assetIds) {
        try {
          const asset = await this.assetRepository.findById(assetId);
          if (!asset) {
            result.failedAssetIds.push(assetId);
            result.errors.push(`Asset ${assetId} not found`);
            continue;
          }

          // Validate organization ownership
          if (asset.organizationId !== organizationId) {
            result.failedAssetIds.push(assetId);
            result.errors.push(`Asset ${assetId} does not belong to organization`);
            continue;
          }

          validAssets.push({
            id: asset.id,
            storagePath: asset.storagePath,
            name: asset.name
          });

        } catch (error) {
          result.failedAssetIds.push(assetId);
          result.errors.push(`Failed to validate asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    return validAssets;
  }

  private async collectFolderAssets(
    folderIds: string[], 
    organizationId: string, 
    result: BulkDownloadAssetsUseCaseResponse
  ): Promise<Array<{ id: string; storagePath: string; name: string; folderPath: string }>> {
    const allFolderAssets: Array<{ id: string; storagePath: string; name: string; folderPath: string }> = [];
    
    for (const folderId of folderIds) {
      try {
        const folder = await this.folderRepository.findById(folderId, organizationId);
        if (!folder) {
          result.failedFolderIds.push(folderId);
          result.errors.push(`Folder ${folderId} not found`);
          continue;
        }

        // Validate organization ownership
        if (folder.organizationId !== organizationId) {
          result.failedFolderIds.push(folderId);
          result.errors.push(`Folder ${folderId} does not belong to organization`);
          continue;
        }

        // Recursively collect all assets from this folder and its subfolders
        const folderAssets = await this.collectAssetsFromFolderRecursively(folderId, organizationId, folder.name);
        allFolderAssets.push(...folderAssets);

        if (folderAssets.length === 0) {
          result.errors.push(`Folder "${folder.name}" contains no assets`);
        }

      } catch (error) {
        result.failedFolderIds.push(folderId);
        result.errors.push(`Failed to process folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return allFolderAssets;
  }

  private async collectFolderAssetsWithNames(
    folderIds: string[], 
    organizationId: string, 
    result: BulkDownloadAssetsUseCaseResponse
  ): Promise<{ assets: Array<{ id: string; storagePath: string; name: string; folderPath: string }>; folderNames: string[] }> {
    const allFolderAssets: Array<{ id: string; storagePath: string; name: string; folderPath: string }> = [];
    const folderNames: string[] = [];
    
    for (const folderId of folderIds) {
      try {
        const folder = await this.folderRepository.findById(folderId, organizationId);
        if (!folder) {
          result.failedFolderIds.push(folderId);
          result.errors.push(`Folder ${folderId} not found`);
          continue;
        }

        // Validate organization ownership
        if (folder.organizationId !== organizationId) {
          result.failedFolderIds.push(folderId);
          result.errors.push(`Folder ${folderId} does not belong to organization`);
          continue;
        }

        // Collect folder name for filename generation
        folderNames.push(folder.name);

        // Recursively collect all assets from this folder and its subfolders
        const folderAssets = await this.collectAssetsFromFolderRecursively(folderId, organizationId, folder.name);
        allFolderAssets.push(...folderAssets);

        if (folderAssets.length === 0) {
          result.errors.push(`Folder "${folder.name}" contains no assets`);
        }

      } catch (error) {
        result.failedFolderIds.push(folderId);
        result.errors.push(`Failed to process folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { assets: allFolderAssets, folderNames };
  }

  private determineSelectionType(assetCount: number, folderCount: number): 'assets' | 'folders' | 'mixed' {
    if (assetCount > 0 && folderCount > 0) {
      return 'mixed';
    } else if (folderCount > 0) {
      return 'folders';
      } else {
      return 'assets';
    }
  }

  private async collectAssetsFromFolderRecursively(
    folderId: string, 
    organizationId: string, 
    folderPath: string = ''
  ): Promise<Array<{ id: string; storagePath: string; name: string; folderPath: string }>> {
    const assets: Array<{ id: string; storagePath: string; name: string; folderPath: string }> = [];
    
    try {
      // Get all assets in this folder
      const folderAssets = await this.assetRepository.findByFolderId(folderId, organizationId);
      for (const asset of folderAssets) {
        assets.push({
          id: asset.id,
          storagePath: asset.storagePath,
          name: asset.name,
          folderPath
        });
      }

      // Get all subfolders and recursively collect their assets
      const subfolders = await this.folderRepository.findChildren(folderId, organizationId);
      for (const subfolder of subfolders) {
        const subfolderPath = folderPath ? `${folderPath}/${subfolder.name}` : subfolder.name;
        const subfolderAssets = await this.collectAssetsFromFolderRecursively(
          subfolder.id, 
          organizationId, 
          subfolderPath
        );
        assets.push(...subfolderAssets);
      }

    } catch (error) {
      // Error collecting assets from folder - continue with other folders
    }

    return assets;
  }

  private async createIndividualDownloads(
    assets: Array<{ id: string; storagePath: string; name: string; folderPath?: string }>
  ): Promise<string[]> {
    const downloadUrls: string[] = [];

    for (const asset of assets) {
      try {
        // Generate signed URL for download (typically expires in 1 hour)
        const downloadUrl = await this.storageService.getSignedUrl(asset.storagePath, 3600, true, asset.name);
        downloadUrls.push(downloadUrl);
      } catch (error) {
        // Error generating download URL - continue with other assets
      }
    }

    return downloadUrls;
  }

  private async createZipDownload(
    assets: Array<{ id: string; storagePath: string; name: string; folderPath?: string }>,
    organizationId: string,
    userId: string,
    options?: { folderNames?: string[]; selectionType?: 'assets' | 'folders' | 'mixed' }
  ): Promise<{ zipBlob?: Blob; zipFileName?: string }> {
    try {
      // Use storage service to create ZIP
      const storageService = this.storageService as any;
      if (storageService.createZipArchive) {
        const result = await storageService.createZipArchive(assets, organizationId, options);
        if (result.success) {
          return {
            zipBlob: result.zipBlob,
            zipFileName: result.zipFileName
          };
        } else {
          throw new Error(result.error || 'ZIP creation failed');
        }
      } else {
        throw new Error('ZIP creation not supported by storage service');
      }

    } catch (error) {
      throw new DatabaseError(`Failed to create ZIP download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 