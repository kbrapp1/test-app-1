'use server';

// Remove imports specific to the old uploadAssets function
// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers';
// import crypto from 'crypto';

// Keep imports needed for deleteAsset
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

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

// ============================================================================
// LIST TEXT ASSETS ACTION
// ============================================================================

// Define acceptable text MIME types for filtering
const TEXT_MIME_TYPES = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json', // Often used for text-based data
    'application/xml',  // Often used for text-based data
    // Add other text-based types as needed (e.g., text/html, text/rtf)
];

// Define the shape of the returned asset data
interface TextAssetSummary {
    id: string;
    name: string;
    created_at: string;
    // Add other fields if needed for the asset selector (e.g., folder_id)
}

/**
 * Fetches a list of assets owned by the current user that match
 * common text file MIME types.
 */
export async function listTextAssets(): Promise<{
    success: boolean;
    data?: TextAssetSummary[];
    error?: string;
}> {
    // Use the standard server client from @/lib/supabase/server
    const supabase = createClient();

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('listTextAssets: Auth Error', authError);
            return { success: false, error: 'User not authenticated' };
        }

        // 2. Query Assets Table
        const { data, error } = await supabase
            .from('assets')
            .select('id, name, created_at') // Select needed fields
            .eq('user_id', user.id)       // Filter by user
            .in('mime_type', TEXT_MIME_TYPES) // Filter by text MIME types
            .order('name', { ascending: true }); // Order alphabetically by name

        if (error) {
            console.error('listTextAssets: DB Query Error', error);
            // TODO: Wrap with lib/errors
            return { success: false, error: `Failed to fetch text assets: ${error.message}` };
        }

        // 3. Return Success
        return { success: true, data: data || [] };

    } catch (err: any) {
        console.error('listTextAssets: Unexpected Error', err);
        // TODO: Wrap with lib/errors
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// GET ASSET CONTENT ACTION
// ============================================================================

/**
 * Fetches the content of a specific text asset from Supabase Storage.
 */
export async function getAssetContent(assetId: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
}> {
    if (!assetId) {
        return { success: false, error: 'Asset ID is required.' };
    }

    // Use the standard server client for all operations
    const supabase = createClient(); 

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('getAssetContent: Auth Error', authError);
            return { success: false, error: 'User not authenticated' };
        }

        // 2. Fetch Asset Metadata (including storage_path and user_id for verification)
        const { data: asset, error: dbError } = await supabase
            .from('assets')
            .select('id, storage_path, user_id, mime_type') // Select path and owner
            .eq('id', assetId)
            .single(); // Expect one asset

        if (dbError) {
            console.error('getAssetContent: DB Fetch Error', dbError);
            return { success: false, error: `Error fetching asset metadata: ${dbError.message}` };
        }
        if (!asset) {
            return { success: false, error: 'Asset not found.' };
        }
        if (asset.user_id !== user.id) {
            console.warn('getAssetContent: User mismatch', { userId: user.id, assetOwner: asset.user_id });
            return { success: false, error: 'Permission denied.' };
        }
        // Optional: Verify if the fetched asset is actually a text type again?
        if (!TEXT_MIME_TYPES.includes(asset.mime_type)) {
             console.warn('getAssetContent: Attempted to get content for non-text asset', { assetId, mimeType: asset.mime_type });
             return { success: false, error: 'Cannot fetch content for this file type.' };
        }

        // 3. Download Content from Storage
        // Use the same authenticated client for storage operations
        const { data: blobData, error: storageError } = await supabase.storage 
            .from('assets') // Ensure this matches your bucket name
            .download(asset.storage_path);

        if (storageError) {
            console.error('getAssetContent: Storage Download Error', storageError);
            return { success: false, error: `Failed to download asset content: ${storageError.message}` };
        }
        if (!blobData) {
            return { success: false, error: 'Downloaded asset content is empty.' };
        }

        // 4. Convert Blob to Text
        // Ensure the text() method is awaited, as it returns a Promise<string>
        const textContent = await blobData.text();

        // 5. Return Success
        return { success: true, content: textContent };

    } catch (err: any) {
        console.error('getAssetContent: Unexpected Error', err);
        // TODO: Wrap with lib/errors
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// UPDATE ASSET TEXT ACTION
// ============================================================================

/**
 * Updates the content of an existing text asset in Supabase Storage.
 */
export async function updateAssetText(
    assetId: string, 
    newContent: string
): Promise<{ success: boolean; error?: string }> {
    if (!assetId) {
        return { success: false, error: 'Asset ID is required.' };
    }

    const supabase = createClient(); // Use standard server client

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('updateAssetText: Auth Error', authError);
            return { success: false, error: 'User not authenticated' };
        }

        // 2. Fetch Asset Metadata (storage_path, user_id for verification, mime_type)
        const { data: asset, error: dbError } = await supabase
            .from('assets')
            .select('storage_path, user_id, mime_type') 
            .eq('id', assetId)
            .single();

        if (dbError) {
            console.error('updateAssetText: DB Fetch Error', dbError);
            return { success: false, error: `Error fetching asset metadata: ${dbError.message}` };
        }
        if (!asset) {
            return { success: false, error: 'Asset not found.' };
        }
        if (asset.user_id !== user.id) {
            return { success: false, error: 'Permission denied.' };
        }
        // Ensure we are only updating text-based assets
        if (!TEXT_MIME_TYPES.includes(asset.mime_type)) {
             return { success: false, error: 'Cannot update content for this file type.' };
        }

        // 3. Prepare new content as Blob
        const contentBlob = new Blob([newContent], { type: asset.mime_type });
        const newSize = contentBlob.size;

        // 4. Upload (overwrite) Content to Storage
        const { error: storageError } = await supabase.storage
            .from('assets')
            .upload(asset.storage_path, contentBlob, { 
                upsert: true, // Important: Allow overwriting 
                contentType: asset.mime_type 
            }); 

        if (storageError) {
            console.error('updateAssetText: Storage Upload Error', storageError);
            return { success: false, error: `Failed to update asset content in storage: ${storageError.message}` };
        }

        // 5. Update asset metadata (size, potentially modified_at if added)
        const { error: updateMetaError } = await supabase
            .from('assets')
            .update({ size: newSize /*, updated_at: new Date().toISOString() */ })
            .match({ id: assetId });

        if (updateMetaError) {
            // Log error, but maybe return success as content was updated?
            console.error('updateAssetText: DB Metadata Update Error', updateMetaError);
             // Or: return { success: false, error: `Failed to update asset metadata: ${updateMetaError.message}` };
        }

        // 6. Revalidate relevant paths (optional, depending on how DAM displays content/previews)
        // revalidatePath('/dam');
        // revalidatePath(`/dam/asset/${assetId}`); 

        return { success: true };

    } catch (err: any) {
        console.error('updateAssetText: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// SAVE AS NEW TEXT ASSET ACTION
// ============================================================================

/**
 * Saves the provided text content as a new asset in Supabase.
 */
export async function saveAsNewTextAsset(
    content: string,
    desiredName: string,
    // folderId?: string | null // Optional: Add later if needed
): Promise<{ success: boolean; error?: string; data?: { newAssetId: string } }> {
    if (!desiredName) {
        return { success: false, error: 'Asset name is required.' };
    }

    const supabase = createClient(); // Use standard server client

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('saveAsNewTextAsset: Auth Error', authError);
            return { success: false, error: 'User not authenticated' };
        }

        // 2. Prepare Blob and Metadata
        const mimeType = 'text/plain'; // Default to text/plain for new saves
        const contentBlob = new Blob([content], { type: mimeType });
        const fileSize = contentBlob.size;
        const fileName = desiredName.endsWith('.txt') ? desiredName : `${desiredName}.txt`;
        const storagePath = `${user.id}/${crypto.randomUUID()}-${fileName}`;

        // 3. Upload to Supabase Storage
        const { data: uploadData, error: storageError } = await supabase.storage
            .from('assets')
            .upload(storagePath, contentBlob, { contentType: mimeType });

        if (storageError) {
            console.error('saveAsNewTextAsset: Storage Upload Error', storageError);
            return { success: false, error: `Storage upload failed: ${storageError.message}` };
        }
        if (!uploadData?.path) {
             return { success: false, error: 'Storage upload failed silently.' };
        }

        // 4. Create record in 'assets' database table
        const { data: assetRecord, error: dbError } = await supabase
            .from('assets')
            .insert({
                user_id: user.id,
                name: fileName,
                storage_path: uploadData.path, 
                mime_type: mimeType,
                size: fileSize,
                // folder_id: folderId ?? null // Add if folder support needed
            })
            .select('id') 
            .single();

        if (dbError) {
            console.error('saveAsNewTextAsset: DB Insert Error', dbError);
            // Attempt cleanup
            await supabase.storage.from('assets').remove([uploadData.path]);
            return { success: false, error: `Failed to save asset metadata: ${dbError.message}` };
        }
        if (!assetRecord?.id) {
             console.error('saveAsNewTextAsset: DB Insert Error - No ID returned');
             await supabase.storage.from('assets').remove([uploadData.path]);
             return { success: false, error: 'Failed to save asset metadata (no ID returned).' };
        }

        // 5. Revalidate Path
        revalidatePath('/dam');

        // 6. Return Success with new Asset ID
        return { success: true, data: { newAssetId: assetRecord.id } };

    } catch (err: any) {
        console.error('saveAsNewTextAsset: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
} 