/**
 * Bulk Download Assets Use Case - Application Layer
 * 
 * Single Responsibility: Orchestrates bulk download operations
 * Coordinates domain services and strategies following DDD principles
 * Handles generating download URLs for multiple assets and folders
 */

import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';
import type { IAssetRepository } from '../../../../domain/repositories/IAssetRepository';
import type { IFolderRepository } from '../../../../domain/repositories/IFolderRepository';
import type { IStorageService } from '../../../../domain/repositories/IStorageService';

import { DownloadValidationService } from './services/DownloadValidationService';
import { AssetCollectionService } from './services/AssetCollectionService';
import { FolderCollectionService } from './services/FolderCollectionService';
import { IndividualDownloadStrategy } from './strategies/IndividualDownloadStrategy';
import { ZipDownloadStrategy } from './strategies/ZipDownloadStrategy';
import type {
  BulkDownloadAssetsUseCaseRequest,
  BulkDownloadAssetsUseCaseResponse,
  DownloadRequest,
  DownloadResult,
  AssetInfo
} from './types';

export class BulkDownloadAssetsUseCase {
  private assetCollectionService: AssetCollectionService;
  private folderCollectionService: FolderCollectionService;
  private individualDownloadStrategy: IndividualDownloadStrategy;
  private zipDownloadStrategy: ZipDownloadStrategy;

  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService
  ) {
    // Initialize services
    this.assetCollectionService = new AssetCollectionService(assetRepository);
    this.folderCollectionService = new FolderCollectionService(
      folderRepository, 
      this.assetCollectionService
    );
    
    // Initialize strategies
    this.individualDownloadStrategy = new IndividualDownloadStrategy(storageService);
    this.zipDownloadStrategy = new ZipDownloadStrategy(storageService);
  }

  public async execute(request: BulkDownloadAssetsUseCaseRequest): Promise<BulkDownloadAssetsUseCaseResponse> {
    // 1. Create domain request object
    const downloadRequest: DownloadRequest = {
      assetIds: request.assetIds,
      folderIds: request.folderIds,
      organizationId: request.organizationId,
      userId: request.userId,
      format: request.format || 'zip',
      includeMetadata: request.includeMetadata || false
    };

    // 2. Validate request using domain service
    DownloadValidationService.validateRequest(downloadRequest);

    // 3. Initialize result object
    const result: DownloadResult = {
      downloadUrls: [],
      failedAssetIds: [],
      failedFolderIds: [],
      errors: []
    };

    try {
      // 4. Collect all assets from direct selection and folder contents
      const { assets: allAssets, folderNames } = await this.collectAllAssets(downloadRequest, result);

      if (allAssets.length === 0) {
        throw new ValidationError('No valid assets found for download');
      }

      // 5. Determine download strategy and execute
      const downloadResult = await this.executeDownloadStrategy(
        allAssets,
        downloadRequest,
        folderNames
      );

      return {
        ...result,
        ...downloadResult
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(`Bulk download operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Collects all assets from direct selection and folders
   * @param request - Download request
   * @param result - Result object to track failures
   * @returns Promise resolving to all collected assets with folder names
   */
  private async collectAllAssets(
    request: DownloadRequest, 
    result: DownloadResult
  ): Promise<{ assets: AssetInfo[]; folderNames: string[] }> {
    const allAssets: AssetInfo[] = [];
    let folderNames: string[] = [];

    // Add directly selected assets
    if (request.assetIds.length > 0) {
      const directAssets = await this.assetCollectionService.collectDirectAssets(
        request.assetIds, 
        request.organizationId, 
        result
      );
      allAssets.push(...directAssets);
    }

    // Add assets from selected folders and collect folder names
    if (request.folderIds.length > 0) {
      const folderResult = await this.folderCollectionService.collectFolderAssetsWithNames(
        request.folderIds, 
        request.organizationId, 
        result
      );
      allAssets.push(...folderResult.assets);
      folderNames = folderResult.folderNames;
    }

    return { assets: allAssets, folderNames };
  }

  /**
   * Executes the appropriate download strategy
   * @param assets - Assets to download
   * @param request - Download request
   * @param folderNames - Folder names for ZIP organization
   * @returns Promise resolving to download result
   */
  private async executeDownloadStrategy(
    assets: AssetInfo[],
    request: DownloadRequest,
    folderNames: string[]
  ): Promise<Partial<DownloadResult>> {
    const folderCount = request.folderIds.length;

    // Check if single asset download should be used
    if (DownloadValidationService.shouldUseSingleDownload(assets.length, folderCount)) {
      const downloadUrls = await this.individualDownloadStrategy.createDownloads(assets);
      return { downloadUrls };
    }

    // Use ZIP strategy for multiple assets or folder downloads
    const selectionType = DownloadValidationService.determineSelectionType(
      request.assetIds.length, 
      folderCount
    );
    
    const zipResult = await this.zipDownloadStrategy.createZipDownload(
      assets,
      request.organizationId,
      request.userId,
      { folderNames, selectionType }
    );

    return {
      zipBlob: zipResult.zipBlob,
      zipFileName: zipResult.zipFileName
    };
  }
} 