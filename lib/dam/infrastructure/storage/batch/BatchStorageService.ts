import { createClient } from '@/lib/supabase/server';
import { 
  BatchDeleteOperation,
  BatchDownloadOperation,
  BatchCopyOperation,
  BatchStatsOperation
} from './operations';

/**
 * BatchStorageService - Infrastructure Layer Coordinator
 * 
 * Single Responsibility: Orchestrate batch storage operations
 * Follows DDD principles by coordinating specialized operation classes
 */
export class BatchStorageService {
  private deleteOperation: BatchDeleteOperation;
  private downloadOperation: BatchDownloadOperation;
  private copyOperation: BatchCopyOperation;
  private statsOperation: BatchStatsOperation;

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.deleteOperation = new BatchDeleteOperation(supabase);
    this.downloadOperation = new BatchDownloadOperation(supabase);
    this.copyOperation = new BatchCopyOperation(supabase);
    this.statsOperation = new BatchStatsOperation(supabase);
  }

  /**
   * Delete multiple files from storage
   */
  async batchDeleteFiles(filePaths: string[]): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    return this.deleteOperation.execute(filePaths);
  }

  /**
   * Generate download URLs for multiple files
   */
  async batchGenerateDownloadUrls(
    filePaths: string[],
    expiresIn: number = 3600
  ): Promise<{
    successful: Array<{ path: string; url: string }>;
    failed: string[];
    errors: string[];
  }> {
    return this.downloadOperation.generateUrls(filePaths, expiresIn);
  }

  /**
   * Create ZIP archive for bulk download
   */
  async createZipArchive(
    assetData: Array<{ id: string; name: string; storagePath: string; folderPath?: string }>,
    organizationId: string,
    options?: { folderNames?: string[]; selectionType?: 'assets' | 'folders' | 'mixed' }
  ): Promise<{
    success: boolean;
    zipBlob?: Blob;
    zipFileName?: string;
    error?: string;
  }> {
    return this.downloadOperation.createZipArchive(assetData, organizationId, options);
  }

  /**
   * Copy multiple files to new locations
   */
  async batchCopyFiles(
    copyOperations: Array<{ sourcePath: string; destinationPath: string }>
  ): Promise<{
    successful: Array<{ source: string; destination: string }>;
    failed: Array<{ source: string; destination: string }>;
    errors: string[];
  }> {
    return this.copyOperation.execute(copyOperations);
  }

  /**
   * Get storage statistics for multiple files
   */
  async getBatchOperationStats(filePaths: string[]): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    errors: string[];
  }> {
    return this.statsOperation.getStats(filePaths);
  }
} 