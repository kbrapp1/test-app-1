import { createClient } from '@/lib/supabase/server';

/**
 * BatchStatsOperation - Infrastructure Layer Operation
 * 
 * Single Responsibility: Handle batch statistics gathering
 * Follows DDD principles by focusing on stats-specific operations
 */
export class BatchStatsOperation {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  /**
   * Get storage statistics for multiple files
   */
  async getStats(filePaths: string[]): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    errors: string[];
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      errors: [] as string[]
    };

    if (filePaths.length === 0) {
      return stats;
    }

    try {
      for (const filePath of filePaths) {
        const result = await this.getFileStats(filePath);
        
        if (result.success && result.size) {
          stats.totalFiles++;
          stats.totalSize += result.size;
        } else {
          stats.errors.push(result.error || `Could not get stats for ${filePath}`);
        }
      }

      // Calculate average
      stats.averageSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;

      return stats;

    } catch (error) {
      stats.errors.push(`Batch stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return stats;
    }
  }

  /**
   * Get statistics for a single file
   */
  private async getFileStats(filePath: string): Promise<{
    success: boolean;
    size?: number;
    error?: string;
  }> {
    try {
      // Extract directory path and filename
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop();
      const directoryPath = pathParts.join('/');

      if (!fileName) {
        return { success: false, error: `Invalid file path: ${filePath}` };
      }

      // List files in directory to find our specific file
      const { data, error } = await this.supabase.storage
        .from('assets')
        .list(directoryPath || '', {
          search: fileName
        });

      if (error || !data || data.length === 0) {
        return { 
          success: false, 
          error: `Could not find file info for ${filePath}: ${error?.message || 'File not found'}` 
        };
      }

      // Find exact match
      const fileInfo = data.find(item => item.name === fileName);
      if (!fileInfo) {
        return { success: false, error: `Exact match not found for ${fileName}` };
      }

      // Extract size from metadata
      const size = fileInfo.metadata?.size;
      if (typeof size !== 'number') {
        return { success: false, error: `No size information available for ${fileName}` };
      }

      return { success: true, size };

    } catch (err) {
      return { 
        success: false, 
        error: `Error getting stats for ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  }
} 