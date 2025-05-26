import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/errors/base';
import { BatchValidationService } from '../services/BatchValidationService';
import type { BatchOperationResult } from '../types';

/**
 * Batch Delete Operation - Infrastructure Service
 * 
 * Handles delete operations for assets and folders.
 * Follows SRP by focusing solely on delete operations.
 */
export class BatchDeleteOperation {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private validationService: BatchValidationService
  ) {}

  /**
   * Delete assets
   */
  async deleteAssets(
    assetIds: string[],
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

      // Delete assets from database
      const { error: deleteError } = await this.supabase
        .from('assets')
        .delete()
        .in('id', validAssetIds);

      if (deleteError) {
        result.failed.push(...validAssetIds);
        result.errors.push(`Batch delete failed: ${deleteError.message}`);
        return result;
      }

      result.successful.push(...validAssetIds);
      return result;

    } catch (error) {
      result.failed.push(...assetIds);
      result.errors.push(`Batch delete assets failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Delete folders (only if empty)
   */
  async deleteFolders(
    folderIds: string[],
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
      // Validate folders exist
      const validation = await this.validationService.validateFolders(folderIds, organizationId);
      
      result.failed.push(...validation.invalid);
      result.errors.push(...validation.errors);

      if (validation.valid.length === 0) {
        return result;
      }

      // Check if folders are empty
      const emptyFolderIds: string[] = [];
      
      for (const folder of validation.valid) {
        const hasChildren = await this.validationService.folderHasChildren(folder.id, organizationId);
        if (hasChildren) {
          result.failed.push(folder.id);
          result.errors.push(`Folder ${folder.id} is not empty and cannot be deleted`);
        } else {
          emptyFolderIds.push(folder.id);
        }
      }

      if (emptyFolderIds.length === 0) {
        return result;
      }

      // Delete empty folders
      const { error: deleteError } = await this.supabase
        .from('folders')
        .delete()
        .in('id', emptyFolderIds)
        .eq('organization_id', organizationId);

      if (deleteError) {
        result.failed.push(...emptyFolderIds);
        result.errors.push(`Batch folder delete failed: ${deleteError.message}`);
        return result;
      }

      result.successful.push(...emptyFolderIds);
      return result;

    } catch (error) {
      result.failed.push(...folderIds);
      result.errors.push(`Batch delete folders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
} 