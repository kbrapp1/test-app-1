/**
 * Domain Service: Folder Collection
 * 
 * Single Responsibility: Collects assets from folder hierarchies
 * Orchestrates folder validation and recursive asset collection
 */

import type { IFolderRepository } from '../../../../../domain/repositories/IFolderRepository';
import type { AssetCollectionService } from './AssetCollectionService';
import type { AssetInfo, DownloadResult } from '../types';

export class FolderCollectionService {
  constructor(
    private folderRepository: IFolderRepository,
    private assetCollectionService: AssetCollectionService
  ) {}

  /**
   * Collects assets from selected folders
   * @param folderIds - Array of folder IDs to process
   * @param organizationId - Organization ID for validation
   * @param result - Result object to track failures and errors
   * @returns Promise resolving to collected assets
   */
  async collectFolderAssets(
    folderIds: string[], 
    organizationId: string, 
    result: DownloadResult
  ): Promise<AssetInfo[]> {
    const allFolderAssets: AssetInfo[] = [];
    
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
        const folderAssets = await this.collectAssetsFromFolderRecursively(
          folderId, 
          organizationId, 
          folder.name
        );
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

  /**
   * Collects assets from folders with folder names for ZIP organization
   * @param folderIds - Array of folder IDs to process
   * @param organizationId - Organization ID for validation
   * @param result - Result object to track failures and errors
   * @returns Promise resolving to assets and folder names
   */
  async collectFolderAssetsWithNames(
    folderIds: string[], 
    organizationId: string, 
    result: DownloadResult
  ): Promise<{ assets: AssetInfo[]; folderNames: string[] }> {
    const allFolderAssets: AssetInfo[] = [];
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
        const folderAssets = await this.collectAssetsFromFolderRecursively(
          folderId, 
          organizationId, 
          folder.name
        );
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

  /**
   * Recursively collects assets from a folder and all its subfolders
   * @param folderId - Folder ID to collect from
   * @param organizationId - Organization ID for validation
   * @param folderPath - Current folder path for file organization
   * @returns Promise resolving to collected assets with folder paths
   */
  private async collectAssetsFromFolderRecursively(
    folderId: string, 
    organizationId: string, 
    folderPath: string = ''
  ): Promise<AssetInfo[]> {
    const assets: AssetInfo[] = [];
    
    try {
      // Get all assets in this folder
      const folderAssets = await this.assetCollectionService.collectAssetsFromFolder(
        folderId, 
        organizationId, 
        folderPath
      );
      assets.push(...folderAssets);

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
} 