import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseQueryResult } from '@/types/repositories';
// Ensure ReadableStream is globally available or import appropriately if needed for specific environments.
// Current understanding is that global DOM ReadableStream is used.

export async function removeAssetFromStorage(
  storagePath: string
): Promise<SupabaseQueryResult<null>> {
  const supabase = createSupabaseUserClient();
  const { error } = await supabase.storage
    .from('assets') // Assuming 'assets' is your bucket name
    .remove([storagePath]);
  return { data: null, error };
}

export async function downloadAssetBlobFromStorage(
  storagePath: string
): Promise<SupabaseQueryResult<Blob>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase.storage
    .from('assets')
    .download(storagePath);
  return { data, error };
}

export interface UploadToStorageInput {
  storagePath: string;
  fileBody: ArrayBuffer | Blob | File | Buffer | ReadableStream<Uint8Array> | string;
  contentType: string;
  upsert?: boolean;
}
export async function uploadToStorage(
  input: UploadToStorageInput
): Promise<SupabaseQueryResult<{ path: string }>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase.storage
    .from('assets')
    .upload(input.storagePath, input.fileBody, {
      contentType: input.contentType,
      upsert: input.upsert ?? false,
    });
  return { data, error };
}

export async function getAssetSignedUrlFromStorage(
  storagePath: string,
  expiresInSeconds: number = 60 * 60 // Default to 1 hour
): Promise<SupabaseQueryResult<{ signedUrl: string }>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase.storage
    .from('assets')
    .createSignedUrl(storagePath, expiresInSeconds, {
      download: true, // Add this option to force download
      // Optionally specify filename: download: `your-desired-filename.ext`
    });

  return { data: data ? { signedUrl: data.signedUrl } : null, error };
} 