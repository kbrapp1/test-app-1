/**
 * Strategy: ZIP Download
 * 
 * Single Responsibility: Handles ZIP archive creation for multiple assets
 * Implements strategy pattern for ZIP download operations
 */

import { DatabaseError } from '@/lib/errors/base';
import type { IStorageService } from '../../../../../domain/repositories/IStorageService';
import type { AssetInfo, ZipOptions, ZipCreationResult } from '../types';

export class ZipDownloadStrategy {
  constructor(private storageService: IStorageService) {}

  /**
   * Creates a ZIP archive for multiple assets
   * @param assets - Array of assets to include in ZIP
   * @param organizationId - Organization ID for the operation
   * @param userId - User ID performing the operation
   * @param options - ZIP creation options including folder names and selection type
   * @returns Promise resolving to ZIP blob and filename
   */
  async createZipDownload(
    assets: AssetInfo[],
    organizationId: string,
    userId: string,
    options?: ZipOptions
  ): Promise<ZipCreationResult> {
    try {
      // Use storage service to create ZIP
      const storageService = this.storageService as IStorageService & { createZipArchive?: (assetData: Array<{ id: string; name: string; storagePath: string; folderPath?: string }>, organizationId: string, options?: { folderNames?: string[]; selectionType?: 'assets' | 'folders' | 'mixed' }) => Promise<{ success: boolean; zipBlob?: Blob; zipFileName?: string; error?: string }> };
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

  /**
   * Checks if this strategy can handle the download request
   * @param assets - Assets to download
   * @param folderCount - Number of folders selected
   * @returns True if strategy is applicable
   */
  static canHandle(assets: AssetInfo[], folderCount: number): boolean {
    return assets.length > 1 || folderCount > 0;
  }

  /**
   * Validates that ZIP creation is supported
   * @param storageService - Storage service to check
   * @returns True if ZIP creation is supported
   */
  static isSupported(storageService: IStorageService): boolean {
    const storageServiceExtended = storageService as IStorageService & { createZipArchive?: (...args: unknown[]) => Promise<unknown> };
    return typeof storageServiceExtended.createZipArchive === 'function';
  }
} 