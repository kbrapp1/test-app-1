"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// TODO: Define this type, perhaps in types/team.ts
export interface TeamMember {
  id: string;
  name: string;
  title: string;
  primary_image_url: string;
  secondary_image_url: string;
  created_at: string;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = createClient();

  const { data: membersData, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true }); // Or sort_order if using

  if (error) {
    console.error('Error fetching team members:', error);
    // Consider throwing the error or returning an empty array depending on desired behavior
    return [];
  }

  if (!membersData) {
    return [];
  }

  // Construct full public URLs
  const membersWithUrls: TeamMember[] = membersData.map((member) => {
    const { data: primaryUrlData } = supabase.storage
      .from('team-images') // Use the correct bucket name
      .getPublicUrl(member.primary_image_path);

    const { data: secondaryUrlData } = supabase.storage
      .from('team-images') // Use the correct bucket name
      .getPublicUrl(member.secondary_image_path);

    return {
      ...member,
      primary_image_url: primaryUrlData?.publicUrl || '', // Provide fallback
      secondary_image_url: secondaryUrlData?.publicUrl || '', // Provide fallback
    };
  });

  return membersWithUrls;
}

// Define the schema for form validation using Zod
const TeamMemberSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  // Add validation for file types and size if needed directly here
  // This might be better handled client-side first, but server validation is good too.
  primaryImage: z.any(), //.instanceof(File).refine(...)
  secondaryImage: z.any(), //.instanceof(File).refine(...)
});

export async function addTeamMember(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: TeamMember;
}> {
  const supabase = createClient();

  // --- Authorization Check (Example) ---
  // Uncomment and adapt if only specific users can add members
  /*
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }
  // Add role check if necessary
  // if (user.role !== 'admin') { // Check your user roles
  //   return { success: false, error: 'Not authorized' };
  // }
  */

  const rawFormData = {
    name: formData.get('name'),
    title: formData.get('title'),
    primaryImage: formData.get('primaryImage'),
    secondaryImage: formData.get('secondaryImage'),
  };

  // --- Validation ---
  const validatedFields = TeamMemberSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Invalid input: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { name, title, primaryImage, secondaryImage } = validatedFields.data;

  if (!(primaryImage instanceof File) || !(secondaryImage instanceof File)) {
     return { success: false, error: 'Invalid file data.' };
  }

  // --- File Upload Logic ---
  try {
    // 1. Upload Primary Image
    const primaryFileName = `${crypto.randomUUID()}-${primaryImage.name}`;
    const primaryPath = `public/${primaryFileName}`; // Adjust prefix if needed
    const { data: primaryUploadData, error: primaryUploadError } = await supabase.storage
      .from('team-images')
      .upload(primaryPath, primaryImage);

    if (primaryUploadError) {
      console.error('Primary image upload error:', primaryUploadError);
      throw new Error(`Failed to upload primary image: ${primaryUploadError.message}`);
    }
    const primary_image_path = primaryUploadData.path;

    // 2. Upload Secondary Image
    const secondaryFileName = `${crypto.randomUUID()}-${secondaryImage.name}`;
    const secondaryPath = `public/${secondaryFileName}`; // Adjust prefix if needed
    const { data: secondaryUploadData, error: secondaryUploadError } = await supabase.storage
      .from('team-images')
      .upload(secondaryPath, secondaryImage);

    if (secondaryUploadError) {
      console.error('Secondary image upload error:', secondaryUploadError);
      // Optional: Attempt to remove the primary image if secondary fails
      await supabase.storage.from('team-images').remove([primary_image_path]);
      throw new Error(`Failed to upload secondary image: ${secondaryUploadError.message}`);
    }
    const secondary_image_path = secondaryUploadData.path;

    // --- Database Insert ---
    const { data: insertData, error: insertError } = await supabase
      .from('team_members')
      .insert({
        name,
        title,
        primary_image_path,
        secondary_image_path,
        // user_id: user.id, // Include if tracking user who added member
      })
      .select()
      .single(); // Assuming you want the newly created record back

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Optional: Attempt to remove both uploaded images if insert fails
      await supabase.storage.from('team-images').remove([primary_image_path, secondary_image_path]);
      throw new Error(`Failed to add team member to database: ${insertError.message}`);
    }

    // --- Revalidation & Success ---
    revalidatePath('/team'); // Revalidate the team page cache

    // Construct the public URLs for the returned data
     const { data: primaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(insertData.primary_image_path);

    const { data: secondaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(insertData.secondary_image_path);

    return {
      success: true,
      data: {
        ...insertData,
        primary_image_url: primaryUrlData?.publicUrl || '',
        secondary_image_url: secondaryUrlData?.publicUrl || '',
      }
    };

  } catch (error: any) {
    console.error('Error in addTeamMember:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
} 