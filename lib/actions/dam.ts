'use server';

// Remove imports specific to the old uploadAssets function
// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers';
// import crypto from 'crypto';

// Keep imports needed for deleteAsset
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Remove the entire uploadAssets function
/*
// Define the return type for the action
interface UploadResult { ... }

export async function uploadAssets(formData: FormData): Promise<UploadResult> {
    // ... entire function body ...
}
*/

// --- Move Asset Action ---
export async function moveAsset(
    assetId: string,
    targetFolderId: string | null
): Promise<{ success: boolean; error?: string }> {
    if (!assetId) {
        return { success: false, error: 'Missing asset ID.' };
    }
    
    // Note: targetFolderId can legitimately be null (moving to root)

    try {
        const supabase = createClient();

        // --- Authorization Check ---
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        // 1. Verify user owns the asset
        const { data: assetData, error: fetchError } = await supabase
            .from('assets')
            .select('user_id, folder_id') // Select existing folder_id too
            .eq('id', assetId)
            .single();

        if (fetchError) {
            return { success: false, error: `Error finding asset: ${fetchError.message}` };
        }
        if (!assetData) {
             return { success: false, error: 'Asset not found.' };
        }
        if (assetData.user_id !== user.id) {
            return { success: false, error: 'User not authorized to move this asset' };
        }
        
        // Prevent moving to the same folder (no-op)
        if (assetData.folder_id === targetFolderId) {
            return { success: true }; // Indicate success as no change was needed
        }
        // --- End Authorization Check ---
        
        // 2. Optional: Verify target folder exists and user owns it (if not null)
        if (targetFolderId !== null) {
             const { data: folderData, error: folderError } = await supabase
                .from('folders')
                .select('user_id')
                .eq('id', targetFolderId)
                .single();

            if (folderError || !folderData) {
                return { success: false, error: 'Target folder not found.' };
            }
            if (folderData.user_id !== user.id) {
                 return { success: false, error: 'User not authorized for target folder.' };
            }
        }

        // 3. Update the asset's folder_id
        const { error: updateError } = await supabase
            .from('assets')
            .update({ folder_id: targetFolderId })
            .match({ id: assetId, user_id: user.id }); // Match user_id again for safety

        if (updateError) {
            return { success: false, error: `Failed to update asset folder: ${updateError.message}` };
        }

        // 4. Revalidate ONLY the base path. Rely on client router.refresh() for view update.
        revalidatePath('/dam');

        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// --- Delete Action ---
export async function deleteAsset(assetId: string, storagePath: string): Promise<{ success: boolean; error?: string }> {
    if (!assetId || !storagePath) {
        return { success: false, error: 'Missing asset ID or storage path.' };
    }

    try {
        const supabase = createClient();

        // --- Authorization Check ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
             return { success: false, error: 'User not authenticated' };
             // throw new Error('User not authenticated'); // Alternatively throw
        }

        const { data: assetData, error: fetchError } = await supabase
            .from('assets')
            .select('user_id') // Only select the user_id column
            .eq('id', assetId)
            .single(); // Expect only one row

        if (fetchError) {
            return { success: false, error: `Error finding asset: ${fetchError.message}` };
            // throw new Error(`Asset not found or error fetching: ${fetchError.message}`);
        }
        if (!assetData) {
             return { success: false, error: 'Asset not found.' };
            // throw new Error('Asset not found');
        }
        // Handle case where user_id might be null if assets can be anonymous
        if (assetData.user_id && assetData.user_id !== user.id) {
            return { success: false, error: 'User not authorized to delete this asset' };
            // throw new Error('User not authorized to delete this asset');
        }
        // Optional: Decide how to handle assets where assetData.user_id is null
        // Option 1: Allow deletion by any authenticated user (current logic implicitly does this if check passes)
        // Option 2: Disallow deletion by anyone if user_id is null
        // if (!assetData.user_id) {
        //     return { success: false, error: 'Cannot delete assets without an owner.' };
        // }
        // --- End Authorization Check ---

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('assets') // Ensure this matches your bucket name
            .remove([storagePath]);

        if (storageError) {
            // Log the error but attempt DB deletion anyway, as the record might be orphaned
            // Optionally return failure here if storage deletion is critical
        }

        // 2. Delete from Database - Ensure user_id matches
        const { error: dbError } = await supabase
            .from('assets')
            .delete()
            .match({ id: assetId, user_id: user.id }); // Match both id and user_id

        if (dbError) {
            // If storage delete succeeded but DB failed, we have an orphaned file.
            return { success: false, error: `Failed to delete database record: ${dbError.message}` };
        }

        // 3. Revalidate the gallery path
        revalidatePath('/dam'); // Revalidate the main gallery page

        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
} 