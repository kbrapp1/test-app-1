import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Using server client suitable for Route Handlers
import { uploadFile, removeFile } from '@/lib/supabase/db-storage';
import { insertData } from '@/lib/supabase/db-queries';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User } from '@supabase/supabase-js';
import crypto from 'crypto';
// Import shared schema and error handling utilities
import { withErrorHandling } from '@/lib/middleware/error';
import { ValidationError, DatabaseError, ExternalServiceError } from '@/lib/errors/base';

// Configure Route Segment options, including increased body size limit
// Note: This might need adjustment based on deployment environment (Vercel, etc.)
// Vercel automatically allows up to 4.5MB on Hobby, more on Pro/Enterprise.
// Self-hosted might require server configuration (e.g., Nginx client_max_body_size).
// For Next.js Route Handlers specifically, the default limit IS typically larger than 1MB,
// but explicitly setting it here or in next.config under `api` might be needed for > 4.5MB.
// Let's rely on the default first, as it's often sufficient up to ~4.5MB.
// If still hitting limits >1MB, uncommenting/adding `api.bodyParser.sizeLimit` in next.config.mjs is the next step.

/*
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};
*/

// Admin-only handler for team member uploads
async function postHandler(req: NextRequest, user: User, supabase: any) {
  let formData;
  try {
    formData = await req.formData();
  } catch (error: any) {
    console.error('Failed to parse FormData:', error);
    if (error.message?.includes('body exceeded limit')) {
      throw new ValidationError(`Body exceeded limit. Max size is approx 4.5MB by default on Vercel.`);
    }
    throw new ValidationError('Invalid form data provided.');
  }

  // --- Basic manual validation of inputs ---
  const name = formData.get('name');
  const title = formData.get('title');
  const primaryEntry = formData.get('primaryImage');
  const secondaryEntry = formData.get('secondaryImage');
  if (typeof name !== 'string' || name.trim() === '' ||
      typeof title !== 'string' || title.trim() === '' ||
      !primaryEntry || typeof (primaryEntry as any).name !== 'string' ||
      !secondaryEntry || typeof (secondaryEntry as any).name !== 'string') {
    throw new ValidationError('Invalid input');
  }
  const primaryFile = primaryEntry as any;
  const secondaryFile = secondaryEntry as any;

  // --- File Upload & DB Logic (Using utilities) ---
  let primary_image_path: string | null = null; // Initialize for potential cleanup
  let secondary_image_path: string | null = null; // Initialize for potential cleanup

  try {
    // Use database-first organization context (single source of truth)
    const { data: activeOrgId, error: orgError } = await supabase.rpc('get_active_organization_id');

    if (orgError || !activeOrgId) {
      // No need to clean up files here as they haven't been uploaded yet
      throw new DatabaseError('User does not have an active organization set. Cannot add team member.'); 
    }

    // Construct paths using org and user ID
    const primaryFileName = `${crypto.randomUUID()}-${primaryFile.name}`;
    const primaryPath = `${activeOrgId}/${user.id}/${primaryFileName}`;
    
    // Use uploadFile utility
    const { path: uploaded_primary_path, error: primaryUploadError } = await uploadFile(
      supabase,
      'team-images',
      primaryPath,
      primaryFile
    );
    primary_image_path = uploaded_primary_path; // Assign after upload attempt

    if (primaryUploadError) throw new DatabaseError(`Primary image upload failed: ${primaryUploadError.message}`);
    if (!primary_image_path) throw new DatabaseError('Primary image upload failed silently');

    // Construct paths using org and user ID
    const secondaryFileName = `${crypto.randomUUID()}-${secondaryFile.name}`;
    const secondaryPath = `${activeOrgId}/${user.id}/${secondaryFileName}`;
    
    // Use uploadFile utility again
    const { path: uploaded_secondary_path, error: secondaryUploadError } = await uploadFile(
      supabase,
      'team-images',
      secondaryPath,
      secondaryFile
    );
    secondary_image_path = uploaded_secondary_path; // Assign after upload attempt

    if (secondaryUploadError) {
        if (primary_image_path) await removeFile(supabase, 'team-images', primary_image_path);
        throw new DatabaseError(`Secondary image upload failed: ${secondaryUploadError.message}`);
    }
    if (!secondary_image_path) {
        if (primary_image_path) await removeFile(supabase, 'team-images', primary_image_path);
        throw new DatabaseError('Secondary image upload failed silently');
    }

    // --- Database Insert using utility ---
    const { data: teamMemberData, error: insertError } = await insertData(
      supabase,
      'team_members',
      { name, title, primary_image_path, secondary_image_path, organization_id: activeOrgId }
    );

    if (insertError) {
        await removeFile(supabase, 'team-images', primary_image_path);
        await removeFile(supabase, 'team-images', secondary_image_path);
        throw new DatabaseError(`Database insert failed: ${insertError.message}`);
    }

    // Return success response
    return NextResponse.json({ success: true, data: teamMemberData }, { status: 201 });

  } catch (error: any) {
    console.error('API Error in POST /api/team/upload:', error);
    if (error instanceof ValidationError || error instanceof DatabaseError || error instanceof ExternalServiceError) {
      throw error;
    }
    throw new ExternalServiceError(error.message);
  }
}

// Export the POST handler with authentication and admin role requirement
export const POST = withErrorHandling(withAuth(postHandler, { 
  requiredRole: 'admin',
  unauthorizedMessage: 'Admin access required for team management'
})); 