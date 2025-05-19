'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action'; // Import the helper
// cookies might still be needed for other purposes or by createClient implicitly, but not directly for getActiveOrganizationId or createClient() here

// Define the Tag type based on the schema
export interface Tag {
  id: string; // UUID
  name: string;
  user_id: string; // UUID
  created_at: string; // TIMESTAMPTZ
  organization_id: string; // UUID
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new tag for the active organization.
 */
export async function createTag(
  formData: FormData,
): Promise<ActionResult<Tag>> {
  const supabase = createClient(); 

  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Tag name cannot be empty.' };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'User not authenticated.' };
  }

  const organizationId = await getActiveOrganizationId(); // Use the helper
  
  if (!organizationId) {
    return { success: false, error: 'Could not determine active organization. Please ensure you are part of an active organization.' };
  }

  try {
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        name: name.trim(),
        user_id: user.id,
        organization_id: organizationId, 
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A tag with this name already exists in your organization.' };
      }
      console.error('Error creating tag:', error);
      return { success: false, error: 'Failed to create tag. ' + error.message };
    }

    if (!newTag) {
        return { success: false, error: 'Failed to create tag, no data returned.' };
    }

    return { success: true, data: newTag as Tag };
  } catch (e: any) {
    console.error('Unexpected error creating tag:', e);
    return { success: false, error: 'An unexpected error occurred: ' + e.message };
  }
}

/**
 * Lists all tags for a given organization.
 */
export async function listTagsForOrganization(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.' };
  }

  const supabase = createClient(); 

  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*, asset_tags!inner(tag_id)')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error listing tags:', error);
      return { success: false, error: 'Failed to list tags. ' + error.message };
    }

    return { success: true, data: (tags as Tag[]) || [] };
  } catch (e: any) {
    console.error('Unexpected error listing tags:', e);
    return { success: false, error: 'An unexpected error occurred: ' + e.message };
  }
}

/**
 * Lists ALL tags for a given organization, including orphaned ones.
 * Intended for internal use by components like TagEditor to check for existing tag names
 * before attempting creation.
 */
export async function getAllTagsForOrganizationInternal(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.' };
  }

  const supabase = createClient();

  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*') // Select all tags, no join
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error listing all internal tags:', error);
      return { success: false, error: 'Failed to list all internal tags. ' + error.message };
    }

    return { success: true, data: (tags as Tag[]) || [] };
  } catch (e: any) {
    console.error('Unexpected error listing all internal tags:', e);
    return { success: false, error: 'An unexpected error occurred: ' + e.message };
  }
} 