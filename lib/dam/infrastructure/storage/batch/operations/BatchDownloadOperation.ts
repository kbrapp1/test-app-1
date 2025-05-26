import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';
import { FileNameGenerator } from '../utils/FileNameGenerator';

/**
 * BatchDownloadOperation - Infrastructure Layer Operation
 * 
 * Single Responsibility: Handle batch download operations and ZIP creation
 * Follows DDD principles by focusing on download-related operations
 */
export class BatchDownloadOperation {
  private fileNameGenerator: FileNameGenerator;

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.fileNameGenerator = new FileNameGenerator();
  }

  /**
   * Generate signed download URLs for multiple files
   */
  async generateUrls(
    filePaths: string[],
    expiresIn: number = 3600
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
    try {
      if (assetData.length === 0) {
        return { success: false, error: 'No assets provided for ZIP creation' };
      }

      const zip = new JSZip();
      const zipFileName = this.fileNameGenerator.generateZipFileName(assetData, options);
      
      let addedFiles = 0;
      const errors: string[] = [];

      // Process each asset
      for (const asset of assetData) {
        const result = await this.processAssetForZip(asset, zip);
        if (result.success) {
          addedFiles++;
                 } else {
           errors.push(result.error || 'Unknown error');
        }
      }

      if (addedFiles === 0) {
        const errorMessage = errors.length > 0 
          ? `No files could be added to ZIP. Errors: ${errors.join('; ')}`
          : 'No files could be added to the ZIP archive. Please check that the selected files exist and are accessible.';
        
        return { success: false, error: errorMessage };
      }

      // Generate ZIP with optimal settings
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        streamFiles: true
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

  /**
   * Process individual asset for ZIP inclusion
   */
  private async processAssetForZip(
    asset: { id: string; name: string; storagePath: string; folderPath?: string },
    zip: JSZip
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate storage path
      if (!asset.storagePath || asset.storagePath.trim() === '') {
        return { success: false, error: `Empty storage path for ${asset.name}` };
      }

      // Get signed URL
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from('assets')
        .createSignedUrl(asset.storagePath, 3600);

      if (urlError || !urlData?.signedUrl) {
        return { 
          success: false, 
          error: `Failed to create download URL for ${asset.name}: ${urlError?.message || 'No URL available'}` 
        };
      }

      // Download file content
      const response = await fetch(urlData.signedUrl);
      if (!response.ok) {
        return { 
          success: false, 
          error: `Failed to download ${asset.name}: ${response.status} ${response.statusText}` 
        };
      }

      // Validate content
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return { success: false, error: `${asset.name} contains no data` };
      }

      // Determine ZIP path and sanitize
      let zipPath = asset.name;
      if (asset.folderPath && asset.folderPath !== 'root') {
        zipPath = `${asset.folderPath}/${asset.name}`;
      }
      zipPath = zipPath.replace(/[<>:"/\\|?*]/g, '_');

      // Add to ZIP
      const uint8Array = new Uint8Array(arrayBuffer);
      zip.file(zipPath, uint8Array);

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: `Failed to process ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
} 