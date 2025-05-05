/**
 * Authenticated Next.js API route handler (POST) that securely uploads image
 * files from form data to Supabase Storage and records metadata in the Supabase
 * database, using admin privileges and including error handling with cleanup.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadFile, insertData, removeFile } from '@/lib/supabase/db';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ValidationError, DatabaseError, ExternalServiceError } from '@/lib/errors/base';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types/dam';

// Simple type for upload result items (different from Asset)
interface UploadResultItem {
    name: string;
    storagePath: string;
    size: number;
    type: string;
}

// Define specific error types for better error handling
interface StorageError extends Error {
    message: string;
    status?: number;
    details?: string;
}

interface DatabaseQueryError extends Error {
    message: string;
    code?: string;
    details?: string;
}

// Define the actual handler function that will be wrapped with auth middleware
async function postHandler(request: NextRequest, user: User, _supabase: SupabaseClient) {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = user.id; // Use authenticated user ID instead of from formData

    if (!files || files.length === 0) {
        throw new ValidationError('No files provided.');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new ExternalServiceError('Supabase configuration missing');
    }

    // Create admin client with service role for higher privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false }
    });

    const uploadedAssetsData: UploadResultItem[] = [];
    let storagePath: string | null = null;

    for (const file of files) {
        try {
            if (!file.type.startsWith('image/')) {
                // Skip non-image files silently
                continue;
            }

            const uniqueSuffix = crypto.randomUUID();
            storagePath = `${userId}/${uniqueSuffix}-${file.name}`;

            // Upload the file using the utility
            const { path, error: storageError } = await uploadFile(
                supabaseAdmin, 
                'assets', 
                storagePath, 
                file
            );

            if (storageError) throw new DatabaseError(`Storage Error (${file.name}): ${storageError.message}`);
            if (!path) throw new DatabaseError(`Storage Error (${file.name}): Upload failed silently.`);

            // Insert record in database using the utility
            const { error: dbError } = await insertData(
                supabaseAdmin,
                'assets',
                {
                    user_id: userId,
                    name: file.name,
                    storage_path: path,
                    mime_type: file.type,
                    size: file.size,
                }
            );

            if (dbError) {
                throw new DatabaseError(`Database Error (${file.name}): ${dbError.message}`);
            }

            uploadedAssetsData.push({
                name: file.name,
                storagePath: path,
                size: file.size,
                type: file.type,
            });

        } catch (error: StorageError | DatabaseQueryError | Error | unknown) {
            // Attempt cleanup in case of error
            if (storagePath) {
                try {
                    await removeFile(supabaseAdmin, 'assets', storagePath);
                } catch (cleanupError: StorageError | Error | unknown) {
                    // Cleanup errors should not prevent the main error from being thrown
                }
            }
            // Rethrow as DatabaseError to be handled by error middleware
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during upload';
            throw new DatabaseError(errorMessage);
        }
    }

    const response: Omit<ApiResponse, 'data'> & { data: UploadResultItem[] } = { 
        success: true, 
        message: 'Upload successful', 
        data: uploadedAssetsData 
    };
    
    return NextResponse.json(response, { status: 200 });
}

// Export the POST handler wrapped with authentication and error handling
export const POST = withErrorHandling(withAuth(postHandler)); 