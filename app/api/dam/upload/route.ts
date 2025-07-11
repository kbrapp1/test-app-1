/**
 * Authenticated Next.js API route handler (POST) that securely uploads image
 * files from form data to Supabase Storage and records metadata in the Supabase
 * database, using admin privileges and including error handling with cleanup.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ValidationError, ExternalServiceError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { UploadAssetUseCase } from '@/lib/dam/application/use-cases/assets';
import { UploadAssetDTO } from '@/lib/dam/application/dto/UploadAssetDTO';

// Type definitions removed as they were unused in the implementation

// Define the actual handler function that will be wrapped with auth middleware
async function postHandler(request: NextRequest, user: User) {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folderIdInput = typeof (formData as any).get === 'function'
        ? (formData.get('folderId') as string | null)
        : null;
    const folderId = folderIdInput === '' || folderIdInput === 'null' ? null : folderIdInput;
    const userId = user.id;

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
        throw new ValidationError('Active organization ID not found. Please ensure an organization is active.');
    }

    if (!files || files.length === 0) {
        throw new ValidationError('No files provided.');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new ExternalServiceError('Supabase configuration missing');
    }

    // Admin client with service role for storage & metadata persistence
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false }
    });

    // Initialize storage service and repository
    const storageService = new SupabaseStorageService(supabaseAdmin);
    const assetRepository = new SupabaseAssetRepository(supabaseAdmin);
    const uploadUseCase = new UploadAssetUseCase(storageService, assetRepository);

    // Build DTOs and execute use case
    const dtos: UploadAssetDTO[] = files.map(file => ({
        file,
        folderId,
        userId,
        organizationId: activeOrgId
    }));
    const createdAssets = await uploadUseCase.execute(dtos);

    return NextResponse.json({ success: true, data: createdAssets }, { status: 200 });
}

// Export the POST handler wrapped with authentication and error handling
export const POST = withErrorHandling(withAuth(postHandler)); 