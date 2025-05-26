import { createClient } from '@/lib/supabase/server';
import { BatchMoveOperation } from './operations/BatchMoveOperation';
import { BatchDeleteOperation } from './operations/BatchDeleteOperation';
import { BatchValidationService } from './services/BatchValidationService';
import type { BatchOperationResult } from './types';

/**
 * Supabase Batch Repository - Infrastructure Layer
 * 
 * Main coordinator for batch operations following DDD principles.
 * Delegates specific operations to specialized services.
 */
export class SupabaseBatchRepository {
  private moveOperation: BatchMoveOperation;
  private deleteOperation: BatchDeleteOperation;
  private validationService: BatchValidationService;

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.validationService = new BatchValidationService(supabase);
    this.moveOperation = new BatchMoveOperation(supabase, this.validationService);
    this.deleteOperation = new BatchDeleteOperation(supabase, this.validationService);
  }

  /**
   * Batch move assets to a target folder
   */
  async batchMoveAssets(
    assetIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<BatchOperationResult> {
    return this.moveOperation.moveAssets(assetIds, targetFolderId, organizationId);
  }

  /**
   * Batch delete assets
   */
  async batchDeleteAssets(
    assetIds: string[],
    organizationId: string
  ): Promise<BatchOperationResult> {
    return this.deleteOperation.deleteAssets(assetIds, organizationId);
  }

  /**
   * Batch move folders to a target folder
   */
  async batchMoveFolders(
    folderIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<BatchOperationResult> {
    return this.moveOperation.moveFolders(folderIds, targetFolderId, organizationId);
  }

  /**
   * Batch delete folders
   */
  async batchDeleteFolders(
    folderIds: string[],
    organizationId: string
  ): Promise<BatchOperationResult> {
    return this.deleteOperation.deleteFolders(folderIds, organizationId);
  }
} 