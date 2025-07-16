import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';

// Generate public URL for storage items
export const getPublicUrl = (
  supabase: SupabaseClient,
  bucket: string,
  path: string
): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '/placeholder.png';
};

// Upload file to storage
export const uploadFile = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string | null; error: DatabaseError | null }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      const dbError = new DatabaseError(
        `Error uploading to bucket ${bucket}: ${error.message}`,
        'STORAGE_UPLOAD_ERROR',
        { originalError: error, bucket, path }
      );
      // Log the structured error context
      logger.error({ 
        message: dbError.message,
        code: dbError.code,
        statusCode: dbError.statusCode,
        context: dbError.context,
        stack: dbError.stack
      });
      return { path: null, error: dbError };
    }
    return { path: data?.path || null, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const dbError = new DatabaseError(
      `Unexpected error uploading to bucket ${bucket}: ${errorMessage}`,
      'STORAGE_UNEXPECTED_UPLOAD_ERROR',
      { originalError: error, bucket, path, stack: errorStack }
    );
    // Log the structured error context
    logger.error({ 
      message: dbError.message,
      code: dbError.code,
      statusCode: dbError.statusCode,
      context: dbError.context,
      stack: dbError.stack
    });
    return { path: null, error: dbError };
  }
};

// Remove file from storage
export const removeFile = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ success: boolean; error: DatabaseError | null }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      const dbError = new DatabaseError(
        `Error removing from bucket ${bucket}: ${error.message}`,
        'STORAGE_REMOVE_ERROR',
        { originalError: error, bucket, path }
      );
      // Log the structured error context
      logger.error({ 
        message: dbError.message,
        code: dbError.code,
        statusCode: dbError.statusCode,
        context: dbError.context,
        stack: dbError.stack
      });
      return { success: false, error: dbError };
    }
    return { success: !error && !!data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const dbError = new DatabaseError(
      `Unexpected error removing from bucket ${bucket}: ${errorMessage}`,
      'STORAGE_UNEXPECTED_REMOVE_ERROR',
      { originalError: error, bucket, path, stack: errorStack }
    );
    // Log the structured error context
    logger.error({ 
      message: dbError.message,
      code: dbError.code,
      statusCode: dbError.statusCode,
      context: dbError.context,
      stack: dbError.stack
    });
    return { success: false, error: dbError };
  }
}; 