import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Using server client suitable for Route Handlers
// Removed direct z import
// Import shared schema and constants
import {
  teamMemberApiSchema,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE
} from '@/lib/schemas/team';

// Remove local schema definitions
// const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// const MAX_FILE_SIZE = 10 * 1024 * 1024; // Use the intended 10MB limit here
// const fileSchema = z ... (removed)
// const TeamMemberApiSchema = z.object({...}); (removed)

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

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  // --- Authorization Check (Example) ---
  // You might want to protect this API route
  /*
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  // Add role check if necessary
  // if (user.role !== 'admin') { 
  //    return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
  // }
  */

  let formData;
  try {
    formData = await req.formData();
  } catch (error: any) {
      console.error('Failed to parse FormData:', error);
       // Handle cases where body limit is exceeded during parsing
      if (error.message?.includes('body exceeded limit')) {
           return NextResponse.json({ success: false, error: `Body exceeded limit. Max size is approx 4.5MB by default on Vercel.` }, { status: 413 });
      }
      return NextResponse.json({ success: false, error: 'Invalid form data provided.' }, { status: 400 });
  }

  const rawFormData = {
    name: formData.get('name'),
    title: formData.get('title'),
    primaryImage: formData.get('primaryImage'),
    secondaryImage: formData.get('secondaryImage'),
  };

  // --- Validation ---
  const validatedFields = teamMemberApiSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error('API Validation Error:', validatedFields.error.flatten().fieldErrors);
    return NextResponse.json(
        { success: false, error: 'Invalid input', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
    );
  }

  const { name, title, primaryImage, secondaryImage } = validatedFields.data;

  // --- File Upload & DB Logic (Similar to Server Action) ---
  try {
    const primaryFileName = `${crypto.randomUUID()}-${primaryImage.name}`;
    const primaryPath = `public/${primaryFileName}`;
    const { data: primaryUploadData, error: primaryUploadError } = await supabase.storage
      .from('team-images')
      .upload(primaryPath, primaryImage);

    if (primaryUploadError) throw primaryUploadError;
    const primary_image_path = primaryUploadData.path;

    const secondaryFileName = `${crypto.randomUUID()}-${secondaryImage.name}`;
    const secondaryPath = `public/${secondaryFileName}`;
    const { data: secondaryUploadData, error: secondaryUploadError } = await supabase.storage
      .from('team-images')
      .upload(secondaryPath, secondaryImage);

    if (secondaryUploadError) {
        await supabase.storage.from('team-images').remove([primary_image_path]); // Cleanup primary
        throw secondaryUploadError;
    }
    const secondary_image_path = secondaryUploadData.path;

    // --- Database Insert ---
    const { data: insertData, error: insertError } = await supabase
      .from('team_members')
      .insert({ name, title, primary_image_path, secondary_image_path })
      .select()
      .single();

    if (insertError) {
        await supabase.storage.from('team-images').remove([primary_image_path, secondary_image_path]); // Cleanup both
        throw insertError;
    }

    // Note: API Routes don't automatically revalidate paths like Server Actions
    // You might need client-side logic to refetch or update the list after success
    // Or trigger revalidation via a webhook or other mechanism if needed immediately server-side

    // Return success response (don't need full URLs here, client doesn't need them immediately)
    return NextResponse.json({ success: true, data: insertData }, { status: 201 });

  } catch (error: any) {
    console.error('API Error in POST /api/team/upload:', error);
    // Distinguish between Supabase storage/DB errors and other errors
    const errorMessage = error.message || 'An unexpected error occurred during processing.';
    const statusCode = error.statusCode || 500; // Use Supabase error code if available
    return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
  }
} 