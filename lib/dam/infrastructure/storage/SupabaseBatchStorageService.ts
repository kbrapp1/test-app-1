import { createClient } from '@/lib/supabase/server';
import { AppError, DatabaseError, ValidationError } from '@/lib/errors/base';
import JSZip from 'jszip';

/**
 * Supabase Batch Storage Service - Infrastructure Layer
 * 
 * Handles batch storage operations for assets using Supabase Storage.
 * Implements batch file operations and ZIP archive creation.
 */
export class SupabaseBatchStorageService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  // Batch delete files from storage
  async batchDeleteFiles(filePaths: string[]): Promise<{
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
      // Supabase storage supports batch delete
      const { data, error } = await this.supabase.storage
        .from('assets')
        .remove(filePaths);

      if (error) {
        // If batch delete fails, try individual deletes
        for (const filePath of filePaths) {
          try {
            const { error: individualError } = await this.supabase.storage
              .from('assets')
              .remove([filePath]);

            if (individualError) {
              failed.push(filePath);
              errors.push(`Failed to delete ${filePath}: ${individualError.message}`);
            } else {
              successful.push(filePath);
            }
          } catch (err) {
            failed.push(filePath);
            errors.push(`Failed to delete ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      } else {
        // Batch delete succeeded
        successful.push(...filePaths);
      }

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...filePaths);
      errors.push(`Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Batch generate download URLs
  async batchGenerateDownloadUrls(
    filePaths: string[],
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{
    successful: Array<{ path: string; url: string }>;
    failed: string[];
    errors: string[];
  }> {
    const successful: Array<{ path: string; url: string }> = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (filePaths.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Generate signed URLs for each file
      for (const filePath of filePaths) {
        try {
          const { data, error } = await this.supabase.storage
            .from('assets')
            .createSignedUrl(filePath, expiresIn);

          if (error || !data?.signedUrl) {
            failed.push(filePath);
            errors.push(`Failed to generate URL for ${filePath}: ${error?.message || 'No URL returned'}`);
          } else {
            successful.push({
              path: filePath,
              url: data.signedUrl
            });
          }
        } catch (err) {
          failed.push(filePath);
          errors.push(`Failed to generate URL for ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...filePaths);
      errors.push(`Batch URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Create ZIP archive for bulk download
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
    try {
      if (assetData.length === 0) {
        return { success: false, error: 'No assets provided for ZIP creation' };
      }

      // Create new ZIP instance
      const zip = new JSZip();
      
      // Generate user-friendly filename
      const zipFileName = this.generateZipFileName(assetData, options);
      
      let addedFiles = 0;
      const errors: string[] = [];

      // Download and add each file to the ZIP
      for (const asset of assetData) {
        try {
          // Validate storage path
          if (!asset.storagePath || asset.storagePath.trim() === '') {
            errors.push(`Empty storage path for ${asset.name}`);
            continue;
          }

          // Get signed URL for the asset
          const { data: urlData, error: urlError } = await this.supabase.storage
            .from('assets')
            .createSignedUrl(asset.storagePath, 3600);

          if (urlError) {
            errors.push(`Failed to create download URL for ${asset.name}: ${urlError.message}`);
            continue;
          }

          if (!urlData?.signedUrl) {
            errors.push(`No download URL available for ${asset.name}`);
            continue;
          }

          // Download the file with proper error handling
          const response = await fetch(urlData.signedUrl);

          if (!response.ok) {
            errors.push(`Failed to download ${asset.name}: ${response.status} ${response.statusText}`);
            continue;
          }

          // Check if we have content
          const contentLength = response.headers.get('content-length');
          if (contentLength === '0') {
            errors.push(`${asset.name} appears to be empty`);
            continue;
          }

          // Get the file as ArrayBuffer first, then convert to Uint8Array for JSZip
          const arrayBuffer = await response.arrayBuffer();
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            errors.push(`${asset.name} contains no data`);
            continue;
          }

          // Convert ArrayBuffer to Uint8Array for better JSZip compatibility
          const uint8Array = new Uint8Array(arrayBuffer);

          // Additional validation for JSZip compatibility
          if (uint8Array.length === 0) {
            errors.push(`${asset.name} converted to empty array`);
            continue;
          }

          // Determine the path in the ZIP
          let zipPath = asset.name;
          if (asset.folderPath && asset.folderPath !== 'root') {
            zipPath = `${asset.folderPath}/${asset.name}`;
          }

          // Ensure the filename is safe for ZIP (remove invalid characters)
          zipPath = zipPath.replace(/[<>:"/\\|?*]/g, '_');

          // Add file to ZIP using Uint8Array (JSZip preferred format)
          try {
            zip.file(zipPath, uint8Array);
            addedFiles++;
          } catch (zipError) {
            errors.push(`Failed to add ${asset.name} to ZIP: ${zipError instanceof Error ? zipError.message : 'Unknown ZIP error'}`);
            continue;
          }

        } catch (error) {
          errors.push(`Failed to process ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue with other files even if one fails
        }
      }

      if (addedFiles === 0) {
        const errorMessage = errors.length > 0 
          ? `No files could be added to ZIP. Errors: ${errors.join('; ')}`
          : 'No files could be added to the ZIP archive. Please check that the selected files exist and are accessible.';
        
        return { 
          success: false, 
          error: errorMessage
        };
      }

      // Generate the ZIP file with optimal settings
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { 
          level: 6 // Good balance between compression and speed
        },
        streamFiles: true // Better memory usage for large files
      });

      return {
        success: true,
        zipBlob,
        zipFileName
      };

    } catch (error) {
      return {
        success: false,
        error: `ZIP creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Batch copy files (for copy operations)
  async batchCopyFiles(
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

    try {
      // Process each copy operation individually
      for (const operation of copyOperations) {
        try {
          // Supabase doesn't have a direct copy operation, so we need to:
          // 1. Download the source file
          // 2. Upload it to the destination
          
          const { data: sourceData, error: downloadError } = await this.supabase.storage
            .from('assets')
            .download(operation.sourcePath);

          if (downloadError || !sourceData) {
            failed.push({ source: operation.sourcePath, destination: operation.destinationPath });
            errors.push(`Failed to download source ${operation.sourcePath}: ${downloadError?.message || 'No data'}`);
            continue;
          }

          const { error: uploadError } = await this.supabase.storage
            .from('assets')
            .upload(operation.destinationPath, sourceData, {
              upsert: false
            });

          if (uploadError) {
            failed.push({ source: operation.sourcePath, destination: operation.destinationPath });
            errors.push(`Failed to upload to ${operation.destinationPath}: ${uploadError.message}`);
          } else {
            successful.push({ source: operation.sourcePath, destination: operation.destinationPath });
          }

        } catch (err) {
          failed.push({ source: operation.sourcePath, destination: operation.destinationPath });
          errors.push(`Copy operation failed for ${operation.sourcePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...copyOperations.map(op => ({ source: op.sourcePath, destination: op.destinationPath })));
      errors.push(`Batch copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Get storage usage statistics for batch operations
  async getBatchOperationStats(filePaths: string[]): Promise<{
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

    try {
      for (const filePath of filePaths) {
        try {
          // Get file info (this is a simplified approach)
          const { data, error } = await this.supabase.storage
            .from('assets')
            .list(filePath.split('/').slice(0, -1).join('/'), {
              search: filePath.split('/').pop()
            });

          if (error || !data || data.length === 0) {
            stats.errors.push(`Could not get stats for ${filePath}`);
            continue;
          }

          const fileInfo = data[0];
          if (fileInfo.metadata?.size) {
            stats.totalFiles++;
            stats.totalSize += fileInfo.metadata.size;
          }

        } catch (err) {
          stats.errors.push(`Error getting stats for ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      stats.averageSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;

      return stats;

    } catch (error) {
      stats.errors.push(`Batch stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return stats;
    }
  }

  // Generate user-friendly ZIP filename
  private generateZipFileName(
    assetData: Array<{ id: string; name: string; storagePath: string; folderPath?: string }>, 
    options?: { folderNames?: string[]; selectionType?: 'assets' | 'folders' | 'mixed' }
  ): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const assetCount = assetData.length;
    
    // Helper function to sanitize filename
    const sanitize = (name: string) => name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    
    // If we have folder information
    if (options?.folderNames && options.folderNames.length > 0) {
      const folderNames = options.folderNames;
      
      if (folderNames.length === 1) {
        // Single folder: "Marketing_Assets_2025-01-26.zip"
        return `${sanitize(folderNames[0])}_Assets_${dateStr}.zip`;
      } else if (folderNames.length <= 3) {
        // Multiple folders (up to 3): "Marketing_Design_Assets_2025-01-26.zip"
        const folderStr = folderNames.map(sanitize).join('_');
        return `${folderStr}_Assets_${dateStr}.zip`;
      } else {
        // Many folders: "4_Folders_Assets_2025-01-26.zip"
        return `${folderNames.length}_Folders_Assets_${dateStr}.zip`;
      }
    }
    
    // For direct asset selection
    if (options?.selectionType === 'assets') {
      if (assetCount === 1) {
        // Single asset: "Kip_Headshot_2025-01-26.zip"
        const assetName = assetData[0].name.split('.')[0]; // Remove extension
        return `${sanitize(assetName)}_${dateStr}.zip`;
      } else if (assetCount <= 5) {
        // Few assets: "5_Assets_2025-01-26.zip"
        return `${assetCount}_Assets_${dateStr}.zip`;
      } else {
        // Many assets: "25_Assets_2025-01-26.zip"
        return `${assetCount}_Assets_${dateStr}.zip`;
      }
    }
    
    // Mixed selection or fallback
    if (options?.selectionType === 'mixed') {
      return `Mixed_Selection_${assetCount}_Items_${dateStr}.zip`;
    }
    
    // Fallback to descriptive name
    return `Download_${assetCount}_Items_${dateStr}.zip`;
  }
} 