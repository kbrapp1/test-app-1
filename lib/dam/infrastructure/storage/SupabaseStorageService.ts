import { SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from '../../domain/repositories/IStorageService';

export class SupabaseStorageService implements IStorageService {
  constructor(private supabase: SupabaseClient, private bucket: string = 'assets') {}

  async uploadFile(file: File, path: string, upsert: boolean = false): Promise<{ storagePath: string; publicUrl: string | null }> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file, { upsert });
    if (error || !data) {
      throw new Error(error?.message || 'Failed to upload file');
    }
    const urlResponse = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    return { storagePath: data.path, publicUrl: urlResponse.data.publicUrl };
  }

  async removeFile(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([path]);
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSignedUrl(
    path: string, 
    expiresInSeconds: number, 
    forceDownload?: boolean, 
    fileName?: string
  ): Promise<string> {
    let downloadOption: string | boolean | undefined = undefined;
    if (fileName) {
      downloadOption = fileName;
    } else if (forceDownload) {
      downloadOption = true;
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds, { download: downloadOption });

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create signed URL');
    }
    
    return data.signedUrl;
  }

  async downloadFileAsBlob(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      // Consider more specific error types from @/lib/errors/base if appropriate
      throw new Error(`Failed to download file from storage: ${error.message}`);
    }
    if (!data) {
      // This case should ideally be covered by the error above, but as a safeguard
      throw new Error('File not found or empty content from storage.');
    }
    return data;
  }
} 