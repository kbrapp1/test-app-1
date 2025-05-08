/**
 * Next.js Server Action that authenticates the user and creates a new folder
 * record in the Supabase 'folders' table based on submitted form data.
 * It returns the action state and revalidates the '/dam' path on success.
 */

'use server';

import { revalidatePath } from 'next/cache';
// import { cookies } from 'next/headers'; // createClient from @/lib/supabase/server handles cookies
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Use createClient from lib
import { createClient } from '@/lib/supabase/server'; // For multi-tenant aware client
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Folder } from '@/types/dam'; // Assuming Folder type is defined here

// Placeholder type - ideally replace with generated Supabase types
// interface FolderInput {
//   name: string;
// }

// Define the return type for the action state, aligning with FolderActionResult from lib/actions/dam/index.ts
interface FolderActionResult {
  success: boolean;
  error?: string;
  folderId?: string; 
  folder?: Folder;
  parentFolderId?: string | null; 
}

export async function createFolder(
  prevState: FolderActionResult, 
  formData: FormData
): Promise<FolderActionResult> {
  const folderName = formData.get('name') as string;
  const parentFolderIdValue = formData.get('parentFolderId') as string | null;
  const parentFolderId = parentFolderIdValue === '' ? null : parentFolderIdValue;

  if (!folderName || folderName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.' };
  }

  const supabase = createClient(); // Uses the server client from @/lib/supabase/server

  try {
    // 1. Get Authenticated User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('createFolder: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    // 2. Get Active Organization ID
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('createFolder: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot create folder.' };
    }

    // 3. Insert new folder
    const { data: insertedData, error: insertError } = await supabase
      .from('folders')
      .insert({
        name: folderName.trim(),
        parent_folder_id: parentFolderId,
        user_id: user.id, // Associate with the creating user
        organization_id: activeOrgId, // Associate with the active organization
      })
      .select('*') // Select all columns
      .single();

    if (insertError) {
      console.error('createFolder: Insert Error', insertError);
      if (insertError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'A folder with this name already exists in this location. Please use a different name.' };
      }
      return { success: false, error: `Failed to create folder: ${insertError.message}` };
    }

    if (!insertedData) {
      console.error('createFolder: Folder created but data not returned.');
      return { success: false, error: 'Folder created but ID was not returned.' };
    }
    
    // 4. Revalidate paths
    revalidatePath('/dam', 'layout'); 
    if (parentFolderId) {
      revalidatePath(`/dam/folders/${parentFolderId}`, 'layout');
    } else {
      revalidatePath('/dam', 'layout'); // Revalidate root if it was a root folder
    }
    
    const newFolder: Folder = { ...insertedData, type: 'folder' }; 
    return { success: true, folder: newFolder, folderId: newFolder.id };

  } catch (err: any) {
    console.error('createFolder: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred while creating the folder.' };
  }
}

// Add actions for renaming, deleting folders, managing tags etc. later 