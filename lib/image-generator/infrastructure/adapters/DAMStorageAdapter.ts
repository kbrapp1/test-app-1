// DAM Storage Adapter - DDD Infrastructure Layer
// Single Responsibility: Implement DAM storage interface with Supabase-specific logic
// Following Golden Rule: Infrastructure implements application interfaces

import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '../../../supabase/client';
import { IDAMStorageService } from '../../application/services/DAMIntegrationService';
import { FileUploadDto, FileUploadResultDto } from '../../application/dto/DAMIntegrationDto';

/**
 * DAM Storage Adapter
 * Implements application interface using existing DAM infrastructure
 * Following Golden Rule: Keep implementation focused and under 250 lines
 */
export class DAMStorageAdapter implements IDAMStorageService {
  private storageService: SupabaseStorageService;

  constructor() {
    const supabase = createClient();
    this.storageService = new SupabaseStorageService(supabase);
  }

  async uploadFile(uploadDto: FileUploadDto): Promise<FileUploadResultDto> {
    try {
      const result = await this.storageService.uploadFile(uploadDto.file, uploadDto.storagePath);
      
      return {
        storagePath: result.storagePath,
        publicUrl: result.publicUrl || undefined,
        size: uploadDto.file.size
      };
    } catch (error) {
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileUrl(storagePath: string): Promise<string> {
    try {
      // Use getSignedUrl for temporary access or assume public URL pattern
      return await this.storageService.getSignedUrl(storagePath, 3600);
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      await this.storageService.removeFile(storagePath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 