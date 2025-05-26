import { createClient } from '@/lib/supabase/server';

/**
 * BatchDeleteOperation - Infrastructure Layer Operation
 * 
 * Single Responsibility: Handle batch file deletion from storage
 * Follows DDD principles by focusing on one specific operation type
 */
export class BatchDeleteOperation {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  /**
   * Execute batch delete operation with fallback strategy
   */
  async execute(filePaths: string[]): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (filePaths.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Try batch delete first (Supabase supports this)
      const { data, error } = await this.supabase.storage
        .from('assets')
        .remove(filePaths);

      if (error) {
        // Fallback to individual deletes if batch fails
        return this.executeIndividualDeletes(filePaths);
      } else {
        // Batch delete succeeded
        successful.push(...filePaths);
        return { successful, failed, errors };
      }

    } catch (error) {
      // Complete failure - mark all as failed
      failed.push(...filePaths);
      errors.push(`Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  /**
   * Fallback strategy: individual file deletions
   */
  private async executeIndividualDeletes(filePaths: string[]): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const { error } = await this.supabase.storage
          .from('assets')
          .remove([filePath]);

        if (error) {
          failed.push(filePath);
          errors.push(`Failed to delete ${filePath}: ${error.message}`);
        } else {
          successful.push(filePath);
        }
      } catch (err) {
        failed.push(filePath);
        errors.push(`Failed to delete ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return { successful, failed, errors };
  }
} 