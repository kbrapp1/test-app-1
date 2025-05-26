import { createClient } from '@/lib/supabase/server';

/**
 * BatchCopyOperation - Infrastructure Layer Operation
 * 
 * Single Responsibility: Handle batch file copy operations
 * Follows DDD principles by focusing on copy-specific operations
 */
export class BatchCopyOperation {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  /**
   * Execute batch copy operations
   */
  async execute(
    copyOperations: Array<{ sourcePath: string; destinationPath: string }>
  ): Promise<{
    successful: Array<{ source: string; destination: string }>;
    failed: Array<{ source: string; destination: string }>;
    errors: string[];
  }> {
    const successful: Array<{ source: string; destination: string }> = [];
    const failed: Array<{ source: string; destination: string }> = [];
    const errors: string[] = [];

    if (copyOperations.length === 0) {
      return { successful, failed, errors };
    }

    // Process each copy operation individually
    for (const operation of copyOperations) {
      const result = await this.executeSingleCopy(operation);
      
      if (result.success) {
        successful.push({ 
          source: operation.sourcePath, 
          destination: operation.destinationPath 
        });
      } else {
        failed.push({ 
          source: operation.sourcePath, 
          destination: operation.destinationPath 
        });
        errors.push(result.error);
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Execute single copy operation (download + upload pattern)
   */
  private async executeSingleCopy(
    operation: { sourcePath: string; destinationPath: string }
  ): Promise<{ success: boolean; error: string }> {
    try {
      // Step 1: Download source file
      const { data: sourceData, error: downloadError } = await this.supabase.storage
        .from('assets')
        .download(operation.sourcePath);

      if (downloadError || !sourceData) {
        return {
          success: false,
          error: `Failed to download source ${operation.sourcePath}: ${downloadError?.message || 'No data'}`
        };
      }

      // Step 2: Upload to destination
      const { error: uploadError } = await this.supabase.storage
        .from('assets')
        .upload(operation.destinationPath, sourceData, {
          upsert: false
        });

      if (uploadError) {
        return {
          success: false,
          error: `Failed to upload to ${operation.destinationPath}: ${uploadError.message}`
        };
      }

      return { success: true, error: '' };

    } catch (err) {
      return {
        success: false,
        error: `Copy operation failed for ${operation.sourcePath}: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  }
} 