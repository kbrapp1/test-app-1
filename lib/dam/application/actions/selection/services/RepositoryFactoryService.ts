/**
 * Domain Service: Repository Factory
 * 
 * Single Responsibility: Creates repositories and use cases for selection actions
 * Encapsulates dependency injection and repository creation logic
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAssetRepository } from '../../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '../../../../infrastructure/storage/SupabaseStorageService';
import { SupabaseBatchStorageService } from '../../../../infrastructure/storage/SupabaseBatchStorageService';
import { UpdateSelectionUseCase } from '../../../use-cases/selection/UpdateSelectionUseCase';
import { BulkMoveAssetsUseCase } from '../../../use-cases/selection/BulkMoveAssetsUseCase';
import { BulkDeleteAssetsUseCase } from '../../../use-cases/selection/BulkDeleteAssetsUseCase';
import { BulkDownloadAssetsUseCase } from '../../../use-cases/selection/BulkDownloadAssetsUseCase';

export class RepositoryFactoryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates asset repository
   * @returns Configured asset repository
   */
  createAssetRepository(): SupabaseAssetRepository {
    return new SupabaseAssetRepository(this.supabase);
  }

  /**
   * Creates folder repository
   * @returns Configured folder repository
   */
  createFolderRepository(): SupabaseFolderRepository {
    return new SupabaseFolderRepository(this.supabase);
  }

  /**
   * Creates storage service
   * @returns Configured storage service
   */
  createStorageService(): SupabaseStorageService {
    return new SupabaseStorageService(this.supabase);
  }

  /**
   * Creates batch storage service
   * @returns Configured batch storage service
   */
  createBatchStorageService(): SupabaseBatchStorageService {
    return new SupabaseBatchStorageService(this.supabase);
  }

  /**
   * Creates composite storage service with ZIP functionality
   * @returns Composite storage service
   */
  createCompositeStorageService() {
    const storageService = this.createStorageService();
    const batchStorageService = this.createBatchStorageService();

    return {
      // Include all methods from the base storage service
      uploadFile: storageService.uploadFile.bind(storageService),
      removeFile: storageService.removeFile.bind(storageService),
      getSignedUrl: storageService.getSignedUrl.bind(storageService),
      downloadFileAsBlob: storageService.downloadFileAsBlob.bind(storageService),
      // Add ZIP functionality from batch service
      createZipArchive: batchStorageService.createZipArchive.bind(batchStorageService)
    };
  }

  /**
   * Creates selection update use case
   * @returns Configured use case
   */
  createUpdateSelectionUseCase(): UpdateSelectionUseCase {
    return new UpdateSelectionUseCase();
  }

  /**
   * Creates bulk move use case
   * @returns Configured use case
   */
  createBulkMoveUseCase(): BulkMoveAssetsUseCase {
    const assetRepository = this.createAssetRepository();
    const folderRepository = this.createFolderRepository();
    return new BulkMoveAssetsUseCase(assetRepository, folderRepository);
  }

  /**
   * Creates bulk delete use case
   * @returns Configured use case
   */
  createBulkDeleteUseCase(): BulkDeleteAssetsUseCase {
    const assetRepository = this.createAssetRepository();
    const folderRepository = this.createFolderRepository();
    const storageService = this.createStorageService();
    return new BulkDeleteAssetsUseCase(assetRepository, folderRepository, storageService);
  }

  /**
   * Creates bulk download use case
   * @returns Configured use case
   */
  createBulkDownloadUseCase(): BulkDownloadAssetsUseCase {
    const assetRepository = this.createAssetRepository();
    const folderRepository = this.createFolderRepository();
    const compositeStorageService = this.createCompositeStorageService();
    return new BulkDownloadAssetsUseCase(assetRepository, folderRepository, compositeStorageService as any);
  }
} 