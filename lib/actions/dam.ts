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
             console.error('Delete asset error: User not authenticated');
             return { success: false, error: 'User not authenticated' };
             // throw new Error('User not authenticated'); // Alternatively throw
        }

        const { data: assetData, error: fetchError } = await supabase
            .from('assets')
            .select('user_id') // Only select the user_id column
            .eq('id', assetId)
            .single(); // Expect only one row

        if (fetchError) {
            console.error(`Delete asset error: Error fetching asset ${assetId}:`, fetchError);
            return { success: false, error: `Error finding asset: ${fetchError.message}` };
            // throw new Error(`Asset not found or error fetching: ${fetchError.message}`);
        }
        if (!assetData) {
             console.error(`Delete asset error: Asset ${assetId} not found.`);
             return { success: false, error: 'Asset not found.' };
            // throw new Error('Asset not found');
        }
        // Handle case where user_id might be null if assets can be anonymous
        if (assetData.user_id && assetData.user_id !== user.id) {
            console.error(`Delete asset error: User ${user.id} not authorized for asset ${assetId} owned by ${assetData.user_id}`);
            return { success: false, error: 'User not authorized to delete this asset' };
            // throw new Error('User not authorized to delete this asset');
        }
        // Optional: Decide how to handle assets where assetData.user_id is null
        // Option 1: Allow deletion by any authenticated user (current logic implicitly does this if check passes)
        // Option 2: Disallow deletion by anyone if user_id is null
        // if (!assetData.user_id) {
        //     console.error(`Delete asset error: Attempt to delete asset ${assetId} with null user_id.`);
        //     return { success: false, error: 'Cannot delete assets without an owner.' };
        // }
        // --- End Authorization Check ---

        console.log(`Attempting to delete asset: ID=${assetId}, Path=${storagePath}, User=${user.id}`);

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('assets') // Ensure this matches your bucket name
            .remove([storagePath]);

        if (storageError) {
            // Log the error but attempt DB deletion anyway, as the record might be orphaned
            console.error(`Storage deletion error for path ${storagePath} (User: ${user.id}):`, storageError.message);
            // Optionally return failure here if storage deletion is critical
        }

        // 2. Delete from Database - Ensure user_id matches
        const { error: dbError } = await supabase
            .from('assets')
            .delete()
            .match({ id: assetId, user_id: user.id }); // Match both id and user_id

        if (dbError) {
            console.error(`Database deletion error for ID ${assetId} (User: ${user.id}):`, dbError.message);
            // If storage delete succeeded but DB failed, we have an orphaned file.
            return { success: false, error: `Failed to delete database record: ${dbError.message}` };
        }

        console.log(`Successfully deleted asset: ID=${assetId} (User: ${user.id})`);

        // 3. Revalidate the gallery path
        revalidatePath('/dam'); // Revalidate the main gallery page

        return { success: true };

    } catch (err: any) {
        console.error('Unexpected error during asset deletion:', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
} 