import { createClient } from '@/lib/supabase/server';
import { DatabaseError as _DatabaseError } from '@/lib/errors/base';
import { BatchValidationService } from '../services/BatchValidationService';
import type { BatchOperationResult } from '../types';

/**
 * Batch Move Operation - Infrastructure Service
 * 
 * Handles move operations for assets and folders.
 * Follows SRP by focusing solely on move operations.
 */
export class BatchMoveOperation {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private validationService: BatchValidationService
  ) {}

  /**
   * Move assets to target folder
   */
  async moveAssets(
    assetIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: [],
      failed: [],
      errors: []
    };

    if (assetIds.length === 0) {
      return result;
    }

    try {
      // Validate assets
      const validation = await this.validationService.validateAssets(assetIds, organizationId);
      
      result.failed.push(...validation.invalid);
      result.errors.push(...validation.errors);

      if (validation.valid.length === 0) {
        return result;
      }

      const validAssetIds = validation.valid.map(asset => asset.id);

      // Perform batch update
      const { data: updatedAssets, error: updateError } = await this.supabase
        .from('assets')
        .update({ folder_id: targetFolderId })
        .in('id', validAssetIds)
        .select('id');

      if (updateError) {
        result.failed.push(...validAssetIds);
        result.errors.push(`Batch update failed: ${updateError.message}`);
        return result;
      }

      result.successful.push(...(updatedAssets?.map(asset => asset.id) || []));
      return result;

    } catch (error) {
      result.failed.push(...assetIds);
      result.errors.push(`Batch move assets failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Move folders to target folder
   */
  async moveFolders(
    folderIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: [],
      failed: [],
      errors: []
    };

    if (folderIds.length === 0) {
      return result;
    }

    try {
      // Validate folders
      const validation = await this.validationService.validateFolders(folderIds, organizationId);
      
      result.failed.push(...validation.invalid);
      result.errors.push(...validation.errors);

      if (validation.valid.length === 0) {
        return result;
      }

      // Check for circular dependencies
      if (targetFolderId) {
        for (const folder of validation.valid) {
          if (await this.validationService.wouldCreateCircularDependency(folder.id, targetFolderId, organizationId)) {
            const folderName = folder.name ? `"${folder.name}"` : 'folder';
            result.failed.push(folder.id);
            result.errors.push(`Cannot move ${folderName} into one of its own subfolders`);
          }
        }
      }

      const safeToMoveIds = validation.valid
        .filter(folder => !result.failed.includes(folder.id))
        .map(folder => folder.id);

      if (safeToMoveIds.length === 0) {
        return result;
      }

      // Perform batch update
      const { data: updatedFolders, error: updateError } = await this.supabase
        .from('folders')
        .update({ parent_folder_id: targetFolderId })
        .in('id', safeToMoveIds)
        .select('id');

      if (updateError) {
        result.failed.push(...safeToMoveIds);
        result.errors.push(`Batch folder update failed: ${updateError.message}`);
        return result;
      }

      result.successful.push(...(updatedFolders?.map(folder => folder.id) || []));
      return result;

    } catch (error) {
      result.failed.push(...folderIds);
      result.errors.push(`Batch move folders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
} 