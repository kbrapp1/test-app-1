'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Placeholder type - ideally replace with generated Supabase types
// interface FolderInput {
//   name: string;
// }

// Define the return type for the action state
interface CreateFolderState {
  success: boolean;
  error?: string;
  data?: any; // Adjust based on actual data type returned
}

export async function createFolder(
  prevState: CreateFolderState, 
  formData: FormData
): Promise<CreateFolderState> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const folderName = formData.get('name') as string;
  const parentFolderId = formData.get('parentFolderId') as string | null;

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated', userError);
    return { success: false, error: 'User not authenticated' };
  }

  if (!folderName || folderName.trim().length === 0) {
    return { success: false, error: 'Folder name cannot be empty' };
  }

  const { data, error } = await supabase
    .from('folders')
    .insert([{ 
        name: folderName.trim(), 
        user_id: user.id,
        parent_folder_id: parentFolderId || null
      }])
    .select()
    .single(); // Assuming you want the created folder back

  if (error) {
    console.error('Error creating folder:', error);
    // Add more specific error handling (e.g., duplicate name if you add constraint)
    return { success: false, error: error.message };
  }

  console.log('Folder created:', data);
  revalidatePath('/dam'); // Revalidate the DAM page to show the new folder
  return { success: true, data };
}

// Add actions for renaming, deleting folders, managing tags etc. later 