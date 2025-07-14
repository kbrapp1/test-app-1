/**
 * Domain Service: Asset Collection
 * 
 * Single Responsibility: Collects assets from direct selection
 * Encapsulates asset collection logic with proper error handling
 */

import type { IAssetRepository } from '../../../../../domain/repositories/IAssetRepository';
import type { AssetInfo, DownloadResult } from '../types';

export class AssetCollectionService {
  constructor(private assetRepository: IAssetRepository) {}

  /**
   * Collects assets directly selected by their IDs
   * @param assetIds - Array of asset IDs to collect
   * @param organizationId - Organization ID for validation
   * @param result - Result object to track failures and errors
   * @returns Promise resolving to collected asset information
   */
  async collectDirectAssets(
    assetIds: string[], 
    organizationId: string, 
    result: DownloadResult
  ): Promise<AssetInfo[]> {
    const validAssets: AssetInfo[] = [];
    
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

      } catch (_error) {
        result.failedAssetIds.push(assetId);
        result.errors.push(`Failed to validate asset ${assetId}: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
      }
    }

    return validAssets;
  }

  /**
   * Collects assets from a specific folder
   * @param folderId - Folder ID to collect assets from
   * @param organizationId - Organization ID for validation
   * @param folderPath - Folder path for file organization
   * @returns Promise resolving to collected asset information
   */
  async collectAssetsFromFolder(
    folderId: string, 
    organizationId: string, 
    folderPath: string = ''
  ): Promise<AssetInfo[]> {
    const assets: AssetInfo[] = [];
    
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

          } catch (_error) {
      // Error collecting assets from folder - return empty array
      // Errors are handled at the caller level
    }

    return assets;
  }
} 