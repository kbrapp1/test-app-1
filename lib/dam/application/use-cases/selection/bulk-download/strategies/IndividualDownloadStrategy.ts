/**
 * Strategy: Individual Download
 * 
 * Single Responsibility: Handles individual asset download URL generation
 * Implements strategy pattern for different download types
 */

import type { IStorageService } from '../../../../../domain/repositories/IStorageService';
import type { AssetInfo } from '../types';

export class IndividualDownloadStrategy {
  constructor(private storageService: IStorageService) {}

  /**
   * Creates individual download URLs for assets
   * @param assets - Array of assets to create download URLs for
   * @returns Promise resolving to array of download URLs
   */
  async createDownloads(assets: AssetInfo[]): Promise<string[]> {
    const downloadUrls: string[] = [];

    for (const asset of assets) {
      try {
        // Generate signed URL for download (expires in 1 hour)
        const downloadUrl = await this.storageService.getSignedUrl(
          asset.storagePath, 
          3600, // 1 hour expiration
          true, // for download
          asset.name
        );
        downloadUrls.push(downloadUrl);
      } catch (error) {
        // Error generating download URL - continue with other assets
        // Errors are handled at the application service level
      }
    }

    return downloadUrls;
  }

  /**
   * Checks if this strategy can handle the download request
   * @param assets - Assets to download
   * @param folderCount - Number of folders selected
   * @returns True if strategy is applicable
   */
  static canHandle(assets: AssetInfo[], folderCount: number): boolean {
    return assets.length === 1 && folderCount === 0;
  }
} 