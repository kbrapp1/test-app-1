"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { TeamMember } from '@/types/team';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { checkFeatureAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { Permission } from '@/lib/auth/roles';
import { hasPermission } from '@/lib/auth/authorization';

// Organization context validation - ensures team member belongs to current org
async function validateOrganizationContext(teamMemberId: string): Promise<void> {
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    throw new Error('No active organization context');
  }

  const supabase = createClient();
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('organization_id')
    .eq('id', teamMemberId)
    .single();
    
  if (error || !teamMember) {
    throw new Error('Team member not found');
  }
  
  if (teamMember.organization_id !== activeOrgId) {
    throw new Error('Team member not found in current organization');
  }
}

// Get team members with permission checking - fail-secure with deduplication
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    // AI: Check permission first
    const accessResult = await checkFeatureAccess('team', {
      requireAuth: true,
      requireOrganization: true,
      customValidation: async (user) => {
        return hasPermission(user, Permission.VIEW_TEAM_MEMBER);
      }
    });
    
    if (!accessResult.hasAccess) {
      throw new Error(accessResult.error || 'Access denied');
    }
  } catch (error) {
    // AI: Fail-secure - return empty array if no permission
    console.warn('User lacks permission to view team members:', error);
    return [];
  }
  
  return apiDeduplicationService.deduplicateServerAction(
    'getTeamMembers',
    [],
    async () => {
      return await executeGetTeamMembers();
    },
    'default' // Use default domain timeout
  );
}

async function executeGetTeamMembers(): Promise<TeamMember[]> {
  const supabase = createClient();

  // AI: Get organization context for explicit filtering
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    console.warn('No active organization context for getTeamMembers');
    return [];
  }

  const { data: membersData, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('organization_id', activeOrgId) // AI: Explicit organization filtering
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

// Add team member with permission checking and file upload handling
export async function addTeamMember(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: TeamMember;
}> {
  const supabase = createClient();

  // AI: Check permission first
  try {
    const accessResult = await checkFeatureAccess('team', {
      requireAuth: true,
      requireOrganization: true,
      customValidation: async (user) => {
        return hasPermission(user, Permission.CREATE_TEAM_MEMBER);
      }
    });
    
    if (!accessResult.hasAccess) {
      return { 
        success: false, 
        error: accessResult.error || 'Insufficient permissions to add team members' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Insufficient permissions to add team members' 
    };
  }

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

    // AI: Get organization context for explicit insertion
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      throw new Error('No active organization context');
    }

    // --- Database Insert ---
    const { data: insertData, error: insertError } = await supabase
      .from('team_members')
      .insert({
        name,
        title,
        organization_id: activeOrgId, // AI: Explicit organization context
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in addTeamMember:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Update team member with permission checking and optional file uploads
export async function updateTeamMember(
  id: string,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
  data?: TeamMember;
}> {
  const supabase = createClient();

  // AI: Check permission first
  try {
    const accessResult = await checkFeatureAccess('team', {
      requireAuth: true,
      requireOrganization: true,
      customValidation: async (user) => {
        return hasPermission(user, Permission.UPDATE_TEAM_MEMBER);
      }
    });
    
    if (!accessResult.hasAccess) {
      return { 
        success: false, 
        error: accessResult.error || 'Insufficient permissions to update team members' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Insufficient permissions to update team members' 
    };
  }

  try {
    // AI: Validate organization context first
    await validateOrganizationContext(id);

    // AI: Verify team member exists
    const { data: existingMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingMember) {
      return { success: false, error: 'Team member not found' };
    }

    const rawFormData = {
      name: formData.get('name') || existingMember.name,
      title: formData.get('title') || existingMember.title,
      primaryImage: formData.get('primaryImage'),
      secondaryImage: formData.get('secondaryImage'),
    };

    // AI: Build update object with only changed fields
    const updateData: Record<string, unknown> = {
      name: rawFormData.name,
      title: rawFormData.title,
    };

    // AI: Handle image updates if provided
    if (rawFormData.primaryImage instanceof File) {
      const primaryFileName = `${crypto.randomUUID()}-${rawFormData.primaryImage.name}`;
      const primaryPath = `public/${primaryFileName}`;
      
      const { data: primaryUploadData, error: primaryUploadError } = await supabase.storage
        .from('team-images')
        .upload(primaryPath, rawFormData.primaryImage);

      if (primaryUploadError) {
        throw new Error(`Failed to upload primary image: ${primaryUploadError.message}`);
      }

      // AI: Clean up old primary image
      if (existingMember.primary_image_path) {
        await supabase.storage.from('team-images').remove([existingMember.primary_image_path]);
      }

      updateData.primary_image_path = primaryUploadData.path;
    }

    if (rawFormData.secondaryImage instanceof File) {
      const secondaryFileName = `${crypto.randomUUID()}-${rawFormData.secondaryImage.name}`;
      const secondaryPath = `public/${secondaryFileName}`;
      
      const { data: secondaryUploadData, error: secondaryUploadError } = await supabase.storage
        .from('team-images')
        .upload(secondaryPath, rawFormData.secondaryImage);

      if (secondaryUploadError) {
        throw new Error(`Failed to upload secondary image: ${secondaryUploadError.message}`);
      }

      // AI: Clean up old secondary image
      if (existingMember.secondary_image_path) {
        await supabase.storage.from('team-images').remove([existingMember.secondary_image_path]);
      }

      updateData.secondary_image_path = secondaryUploadData.path;
    }

    // AI: Get organization context for update validation
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      throw new Error('No active organization context');
    }

    // AI: Update database record with organization context validation
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', activeOrgId) // AI: Defense-in-depth organization validation
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update team member: ${updateError.message}`);
    }

    // AI: Revalidate and return success
    revalidatePath('/team');

    // AI: Construct public URLs for response
    const { data: primaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(updatedMember.primary_image_path);

    const { data: secondaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(updatedMember.secondary_image_path);

    return {
      success: true,
      data: {
        ...updatedMember,
        primary_image_url: primaryUrlData?.publicUrl || '',
        secondary_image_url: secondaryUrlData?.publicUrl || '',
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in updateTeamMember:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Delete team member with permission checking and file cleanup
export async function deleteTeamMember(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();

  // AI: Check permission first
  try {
    const accessResult = await checkFeatureAccess('team', {
      requireAuth: true,
      requireOrganization: true,
      customValidation: async (user) => {
        return hasPermission(user, Permission.DELETE_TEAM_MEMBER);
      }
    });
    
    if (!accessResult.hasAccess) {
      return { 
        success: false, 
        error: accessResult.error || 'Insufficient permissions to delete team members' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Insufficient permissions to delete team members' 
    };
  }

  try {
    // AI: Validate organization context first
    await validateOrganizationContext(id);

    // AI: Get team member data for file cleanup
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('primary_image_path, secondary_image_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { success: false, error: 'Team member not found' };
    }

    // AI: Get organization context for delete validation
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      throw new Error('No active organization context');
    }

    // AI: Delete from database first with organization context validation
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('organization_id', activeOrgId); // AI: Defense-in-depth organization validation

    if (deleteError) {
      throw new Error(`Failed to delete team member: ${deleteError.message}`);
    }

    // AI: Clean up image files (best effort - don't fail if cleanup fails)
    const filesToRemove = [];
    if (teamMember.primary_image_path) {
      filesToRemove.push(teamMember.primary_image_path);
    }
    if (teamMember.secondary_image_path) {
      filesToRemove.push(teamMember.secondary_image_path);
    }

    if (filesToRemove.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('team-images')
        .remove(filesToRemove);

      if (storageError) {
        console.warn('Failed to clean up team member images:', storageError);
        // AI: Don't fail the operation for storage cleanup issues
      }
    }

    // AI: Revalidate team page
    revalidatePath('/team');

    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in deleteTeamMember:', errorMessage);
    return { success: false, error: errorMessage };
  }
}