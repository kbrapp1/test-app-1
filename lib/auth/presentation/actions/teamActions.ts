"use server";

/**
 * Team Management Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Presentation layer component for team management server actions
 * - Uses composition root for dependency injection
 * - Maintains all existing functionality with proper DDD structure
 * - Single responsibility: Team member CRUD operations
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { TeamMember } from '@/types/team';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';
import { getActiveOrganizationId } from './serverActions';
import { checkFeatureAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { Permission, hasPermission } from '../../index';
import { AuthCompositionRoot } from '../../infrastructure/composition/AuthCompositionRoot';

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
      // Clean up primary image if secondary fails
      await supabase.storage
        .from('team-images')
        .remove([primary_image_path]);
      throw new Error(`Failed to upload secondary image: ${secondaryUploadError.message}`);
    }
    const secondary_image_path = secondaryUploadData.path;

    // --- Database Insert ---
    // AI: Get organization context for explicit filtering
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      // Clean up uploaded images
      await supabase.storage
        .from('team-images')
        .remove([primary_image_path, secondary_image_path]);
      return { success: false, error: 'No active organization context' };
    }

    const { data: insertData, error: insertError } = await supabase
      .from('team_members')
      .insert([
        {
          name,
          title,
          primary_image_path,
          secondary_image_path,
          organization_id: activeOrgId, // AI: Explicit organization context
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Clean up uploaded images
      await supabase.storage
        .from('team-images')
        .remove([primary_image_path, secondary_image_path]);
      throw new Error(`Failed to add team member: ${insertError.message}`);
    }

    // Construct public URLs for the response
    const { data: primaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(primary_image_path);

    const { data: secondaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(secondary_image_path);

    const teamMemberWithUrls: TeamMember = {
      ...insertData,
      primary_image_url: primaryUrlData?.publicUrl || '',
      secondary_image_url: secondaryUrlData?.publicUrl || '',
    };

    // Revalidate the team page to reflect the new member
    revalidatePath('/team');

    return { success: true, data: teamMemberWithUrls };
  } catch (error) {
    console.error('Error adding team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

// Update team member with permission checking and file upload handling
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
    // AI: Organization context validation
    await validateOrganizationContext(id);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Organization context validation failed' 
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

  try {
    // Fetch current team member to get existing image paths
    const { data: currentMember, error: fetchError } = await supabase
      .from('team_members')
      .select('primary_image_path, secondary_image_path')
      .eq('id', id)
      .single();

    if (fetchError || !currentMember) {
      throw new Error('Team member not found');
    }

    let primary_image_path = currentMember.primary_image_path;
    let secondary_image_path = currentMember.secondary_image_path;

    // Handle primary image upload if a new file is provided
    if (primaryImage instanceof File) {
      // Upload new primary image
      const primaryFileName = `${crypto.randomUUID()}-${primaryImage.name}`;
      const primaryPath = `public/${primaryFileName}`;
      const { data: primaryUploadData, error: primaryUploadError } = await supabase.storage
        .from('team-images')
        .upload(primaryPath, primaryImage);

      if (primaryUploadError) {
        console.error('Primary image upload error:', primaryUploadError);
        throw new Error(`Failed to upload primary image: ${primaryUploadError.message}`);
      }

      // Delete old primary image
      if (currentMember.primary_image_path) {
        await supabase.storage
          .from('team-images')
          .remove([currentMember.primary_image_path]);
      }

      primary_image_path = primaryUploadData.path;
    }

    // Handle secondary image upload if a new file is provided
    if (secondaryImage instanceof File) {
      // Upload new secondary image
      const secondaryFileName = `${crypto.randomUUID()}-${secondaryImage.name}`;
      const secondaryPath = `public/${secondaryFileName}`;
      const { data: secondaryUploadData, error: secondaryUploadError } = await supabase.storage
        .from('team-images')
        .upload(secondaryPath, secondaryImage);

      if (secondaryUploadError) {
        console.error('Secondary image upload error:', secondaryUploadError);
        throw new Error(`Failed to upload secondary image: ${secondaryUploadError.message}`);
      }

      // Delete old secondary image
      if (currentMember.secondary_image_path) {
        await supabase.storage
          .from('team-images')
          .remove([currentMember.secondary_image_path]);
      }

      secondary_image_path = secondaryUploadData.path;
    }

    // --- Database Update ---
    const { data: updateData, error: updateError } = await supabase
      .from('team_members')
      .update({
        name,
        title,
        primary_image_path,
        secondary_image_path,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update team member: ${updateError.message}`);
    }

    // Construct public URLs for the response
    const { data: primaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(primary_image_path);

    const { data: secondaryUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(secondary_image_path);

    const teamMemberWithUrls: TeamMember = {
      ...updateData,
      primary_image_url: primaryUrlData?.publicUrl || '',
      secondary_image_url: secondaryUrlData?.publicUrl || '',
    };

    // Revalidate the team page to reflect the changes
    revalidatePath('/team');

    return { success: true, data: teamMemberWithUrls };
  } catch (error) {
    console.error('Error updating team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

// Delete team member with permission checking
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
    // AI: Organization context validation
    await validateOrganizationContext(id);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Organization context validation failed' 
    };
  }

  try {
    // Fetch the team member to get image paths for cleanup
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('primary_image_path, secondary_image_path')
      .eq('id', id)
      .single();

    if (fetchError || !teamMember) {
      throw new Error('Team member not found');
    }

    // Delete the team member from the database
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw new Error(`Failed to delete team member: ${deleteError.message}`);
    }

    // Clean up image files
    const filesToDelete = [teamMember.primary_image_path, teamMember.secondary_image_path].filter(Boolean);
    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('team-images')
        .remove(filesToDelete);
    }

    // Revalidate the team page to reflect the deletion
    revalidatePath('/team');

    return { success: true };
  } catch (error) {
    console.error('Error deleting team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
} 