'use server';

// Remove imports specific to the old uploadAssets function
// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers';
// import crypto from 'crypto';

// Keep imports needed for deleteAsset
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action'; // Added for multi-tenancy
import { Folder } from '@/types/dam';

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

        // --- Authorization Check & Org ID ---
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'User not authenticated' };
        }
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            // Or handle as needed, maybe throw an error
            return { success: false, error: 'Active organization not found.' }; 
        }
        // --- End Authorization Check & Org ID ---

        // 1. Verify asset exists and belongs to the active organization
        const { data: assetData, error: fetchError } = await supabase
            .from('assets')
            .select('id, folder_id, organization_id') // Select org_id
            .match({ id: assetId, organization_id: activeOrgId }) // Match org_id
            .single();

        if (fetchError) {
            console.error('moveAsset: Asset fetch error', fetchError);
            return { success: false, error: `Error finding asset: ${fetchError.message}` };
        }
        if (!assetData) {
             return { success: false, error: 'Asset not found in this organization.' };
        }
        // Removed user_id check - relying on RLS and org scope
        // if (assetData.user_id !== user.id) {
        //     return { success: false, error: 'User not authorized to move this asset' };
        // }
        
        // Prevent moving to the same folder (no-op)
        if (assetData.folder_id === targetFolderId) {
            return { success: true }; // Indicate success as no change was needed
        }
        
        // 2. Verify target folder exists and belongs to the active organization (if not null)
        if (targetFolderId !== null) {
             const { data: folderData, error: folderError } = await supabase
                .from('folders')
                .select('id, organization_id') // Select org_id
                .match({ id: targetFolderId, organization_id: activeOrgId }) // Match org_id
                .single();

            if (folderError) {
                console.error('moveAsset: Target folder fetch error', folderError);
                return { success: false, error: `Error finding target folder: ${folderError.message}` };
            }
            if (!folderData) {
                return { success: false, error: 'Target folder not found in this organization.' };
            }
            // Removed user_id check - relying on RLS and org scope
            // if (folderData.user_id !== user.id) {
            //      return { success: false, error: 'User not authorized for target folder.' };
            // }
        }

        // 3. Update the asset's folder_id, scoped by organization
        const { error: updateError } = await supabase
            .from('assets')
            .update({ folder_id: targetFolderId })
            .match({ id: assetId, organization_id: activeOrgId }); // Match asset and org

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

// ============================================================================
// FOLDER ACTIONS
// ============================================================================

interface FolderActionResult {
    success: boolean;
    error?: string;
    folderId?: string; // ID of the deleted folder
    parentFolderId?: string | null; // Parent ID for navigation after delete
    folder?: Folder;   // Used for create/update
}

export async function createFolder(
    // folderName: string,
    // parentFolderId: string | null = null // Default to root if not provided
    prevState: FolderActionResult, // Added for useActionState
    formData: FormData           // Added for useActionState
): Promise<FolderActionResult> {
    const folderName = formData.get('name') as string;
    const parentFolderIdValue = formData.get('parentFolderId') as string | null;
    // Ensure parentFolderId is null if it's an empty string from form data, or keep its value
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

        // 3. TODO: Check for duplicate folder name within the same parent folder and organization
        // This might involve a SELECT query before inserting.
        // For now, relying on potential database constraints if they exist, or handling error post-insert.

        // 4. Insert new folder
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
            // Check for unique constraint violation (PostgreSQL error code 23505)
            if (insertError.code === '23505') {
                return { success: false, error: 'A folder with this name already exists in this location. Please use a different name.' };
            }
            return { success: false, error: `Failed to create folder: ${insertError.message}` };
        }

        if (!insertedData) {
            console.error('createFolder: Folder created but data not returned.');
            return { success: false, error: 'Folder created but ID was not returned.' };
        }
        
        // 5. Revalidate paths
        // Revalidate the main DAM page and potentially the parent folder's path if applicable
        revalidatePath('/dam', 'layout'); // 'layout' ensures revalidation of nested routes
        if (parentFolderId) {
            revalidatePath(`/dam/folders/${parentFolderId}`, 'layout');
        } else {
            revalidatePath('/dam', 'layout'); // Root folder
        }
        
        // Cast to Folder type before returning
        const newFolder: Folder = { ...insertedData, type: 'folder' }; 
        return { success: true, folder: newFolder, folderId: newFolder.id };

    } catch (err: any) {
        console.error('createFolder: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred while creating the folder.' };
    }
}

// ============================================================================
// UPDATE FOLDER ACTION (RENAME)
// ============================================================================

export async function updateFolder(
    prevState: FolderActionResult, // For useActionState
    formData: FormData            // Contains folderId and newName
): Promise<FolderActionResult> {
    const folderId = formData.get('folderId') as string;
    const newName = formData.get('newName') as string;

    if (!folderId) {
        return { success: false, error: 'Folder ID is required.' };
    }
    if (!newName || newName.trim() === '') {
        return { success: false, error: 'New folder name cannot be empty.' };
    }

    const supabase = createClient();

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('updateFolder: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }

        // 2. Get Active Organization ID
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('updateFolder: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found. Cannot update folder.' };
        }
        
        // 3. Check if the folder exists and belongs to the active org (Implicitly handled by RLS in update, but good practice)
        //    We also need the parent_folder_id to correctly revalidate paths.
        const { data: currentFolder, error: fetchError } = await supabase
            .from('folders')
            .select('id, parent_folder_id')
            .match({ id: folderId, organization_id: activeOrgId })
            .single();

        if (fetchError) {
            console.error('updateFolder: Fetch Error', fetchError);
            return { success: false, error: `Error finding folder: ${fetchError.message}` };
        }
        if (!currentFolder) {
            return { success: false, error: 'Folder not found or you do not have permission to update it.' };
        }

        // 4. Update the folder name
        const { data: updatedData, error: updateError } = await supabase
            .from('folders')
            .update({ name: newName.trim() })
            .match({ id: folderId, organization_id: activeOrgId })
            .select('*')
            .single();
        
        if (updateError) {
            console.error('updateFolder: Update Error', updateError);
            // Check for unique constraint violation (PostgreSQL error code 23505)
            if (updateError.code === '23505') {
                 return { success: false, error: 'A folder with this name already exists in this location. Please use a different name.' };
            }
            return { success: false, error: `Failed to update folder: ${updateError.message}` };
        }

        if (!updatedData) {
            return { success: false, error: 'Folder updated but new data was not returned.' };
        }

        // 5. Revalidate paths
        revalidatePath('/dam', 'layout'); // Revalidate main /dam page
        if (currentFolder.parent_folder_id) {
            revalidatePath(`/dam/folders/${currentFolder.parent_folder_id}`, 'layout');
        } else {
            revalidatePath('/dam', 'layout'); // Revalidate root if it's a root folder
        }
        // Also revalidate the path of the folder itself, as its name might be part of a breadcrumb
        revalidatePath(`/dam/folders/${folderId}`, 'layout');

        const updatedFolder: Folder = { ...updatedData, type: 'folder' };
        return { success: true, folder: updatedFolder };

    } catch (err: any) {
        console.error('updateFolder: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred while updating the folder.' };
    }
}

// ============================================================================
// DELETE FOLDER ACTION
// ============================================================================

export async function deleteFolder(prevState: FolderActionResult, formData: FormData): Promise<FolderActionResult> {
    const folderId = formData.get('folderId') as string;

    if (!folderId) {
        return { success: false, error: 'Folder ID is required for deletion.' };
    }

    const supabase = createClient();

    try {
        // 1. Get Authenticated User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('deleteFolder: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }

        // 2. Get Active Organization ID
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('deleteFolder: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found. Cannot delete folder.' };
        }

        // 3. Fetch folder to get parent_folder_id for revalidation and to ensure it belongs to the org
        const { data: folderToDelete, error: fetchError } = await supabase
            .from('folders')
            .select('id, parent_folder_id, organization_id')
            .match({ id: folderId, organization_id: activeOrgId }) // Ensure it's in the current org
            .single();

        if (fetchError) {
            console.error('deleteFolder: Fetch Error', fetchError);
            return { success: false, error: `Error finding folder to delete: ${fetchError.message}` };
        }
        if (!folderToDelete) {
            return { success: false, error: 'Folder not found or you do not have permission to delete it.' };
        }

        // 4. Perform the delete operation for the specified folder ID and organization
        const { error: deleteError } = await supabase
            .from('folders')
            .delete()
            .match({ id: folderId, organization_id: activeOrgId }); // Crucial: Match on organization_id

        if (deleteError) {
            console.error('deleteFolder: Delete Error', deleteError);
            // Check for foreign key constraint violation (PostgreSQL error code 23503)
            // This indicates the folder might not be empty (if assets/subfolders link to it)
            if (deleteError.code === '23503') {
                return { success: false, error: 'Cannot delete folder. It may not be empty or is referenced elsewhere.' };
            }
            return { success: false, error: `Failed to delete folder: ${deleteError.message}` };
        }

        // 5. Revalidate paths
        revalidatePath('/dam', 'layout'); // Revalidate main /dam page
        if (folderToDelete.parent_folder_id) {
            revalidatePath(`/dam/folders/${folderToDelete.parent_folder_id}`, 'layout');
        } else {
            revalidatePath('/dam', 'layout'); // Revalidated root if it was a root folder
        }

        return { success: true, folderId: folderToDelete.id, parentFolderId: folderToDelete.parent_folder_id };

    } catch (err: any) {
        console.error('deleteFolder: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred while deleting the folder.' };
    }
}


// ============================================================================
// DELETE ASSET ACTION
// ============================================================================

export async function deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    if (!assetId) {
        return { success: false, error: 'Asset ID is required.' };
    }

    const supabase = createClient(); // Uses the server client from @/lib/supabase/server

    try {
        // 1. Get Authenticated User and Active Organization ID
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('deleteAsset: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }

        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('deleteAsset: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found. Cannot delete asset.' };
        }

        // 2. Fetch the asset to verify ownership and get storage path
        const { data: asset, error: fetchError } = await supabase
            .from('assets')
            .select('id, organization_id, storage_path')
            .eq('id', assetId)
            .single();

        if (fetchError) {
            console.error('deleteAsset: Error fetching asset metadata:', fetchError);
            return { success: false, error: 'Error fetching asset details. Check logs.' };
        }

        if (!asset) {
            return { success: false, error: 'Asset not found.' };
        }

        if (asset.organization_id !== activeOrgId) {
            console.warn(`deleteAsset: Attempt to delete asset ${assetId} from org ${asset.organization_id} by user in org ${activeOrgId}.`);
            return { success: false, error: 'You are not authorized to delete this asset.' };
        }
        
        if (!asset.storage_path) {
            console.warn(`deleteAsset: Asset ${assetId} is missing storage_path. Will attempt DB deletion only.`);
        } else {
            // 3. Delete from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from('dam_assets') // Ensure this is your correct bucket name
                .remove([asset.storage_path]);

            if (storageError) {
                console.error('deleteAsset: Supabase storage deletion error - IGNORING:', storageError);
            }
        }

        // 4. Delete the asset record from the database, ensuring it's within the organization
        const { error: dbError } = await supabase
            .from('assets')
            .delete()
            .match({ id: assetId, organization_id: activeOrgId }); // Crucial: Match org_id

        if (dbError) {
            console.error('deleteAsset: Database deletion error:', dbError);
            return { success: false, error: `Failed to delete asset from database: ${dbError.message}` };
        }

        // 5. Revalidate paths
        // Revalidate the main DAM page and potentially the folder's path if the asset was in one.
        // For simplicity, revalidating /dam should cover most cases.
        // If asset.folder_id was available and needed, you could revalidate `/dam/folders/${asset.folder_id}`
        revalidatePath('/dam', 'layout');

        return { success: true };

    } catch (err: any) {
        console.error('deleteAsset: Unexpected error', err);
        return { success: false, error: err.message || 'An unexpected error occurred while deleting the asset.' };
    }
}

// ============================================================================
// LIST TEXT ASSETS ACTION
// ============================================================================

// Define a more specific type for what the asset selector expects
interface TextAssetSummary {
    id: string;
    name: string;
    created_at: string;
    // Add other fields if needed for the asset selector (e.g., folder_id)
}

export async function listTextAssets(): Promise<{
    success: boolean;
    data?: TextAssetSummary[];
    error?: string;
}> {
    const supabase = createClient(); // Server client

    try {
        // 1. Authentication and Organization Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('listTextAssets: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('listTextAssets: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found.' };
        }

        // 2. Fetch text assets for the current user and organization
        //    Filter by mime_type for text files (e.g., 'text/plain', 'text/markdown')
        //    This list needs to be robust based on TEXT_MIME_TYPES in constants.ts
        const TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript']; // Keep in sync

        const { data, error } = await supabase
            .from('assets')
            .select('id, name, created_at') // Only select needed fields
            .eq('organization_id', activeOrgId) // Filter by active organization
            // .eq('user_id', user.id) // If only user's assets. If org-wide, remove or adjust based on RLS.
            .in('mime_type', TEXT_MIME_TYPES)  // Filter by text MIME types
            .order('name', { ascending: true });

        if (error) {
            console.error('listTextAssets: DB Query Error', error);
            return { success: false, error: `Database query failed: ${error.message}` };
        }

        return { success: true, data: data as TextAssetSummary[] }; // Cast to ensure type safety if columns match

    } catch (err: any) {
        console.error('listTextAssets: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// GET ASSET CONTENT ACTION
// ============================================================================

export async function getAssetContent(assetId: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
}> {
    if (!assetId) {
        return { success: false, error: 'Asset ID is required.' };
    }

    const supabase = createClient();
    try {
        // 1. Authentication and Organization Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('getAssetContent: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('getAssetContent: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found.' };
        }

        // 2. Fetch asset metadata to get storage_path and mime_type, ensuring it belongs to the user's org
        const { data: asset, error: metaError } = await supabase
            .from('assets')
            .select('storage_path, mime_type')
            .match({ id: assetId, organization_id: activeOrgId }) // Crucial: scope by org
            // .eq('user_id', user.id) // Optional: if assets are strictly user-owned
            .single();

        if (metaError) {
            console.error('getAssetContent: Metadata fetch error', metaError);
            return { success: false, error: `Failed to fetch asset metadata: ${metaError.message}` };
        }
        if (!asset) {
            return { success: false, error: 'Asset not found or access denied.' };
        }

        // 3. Ensure it's a text-based asset (optional, could be enforced by how it's called)
        const TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript']; // Keep in sync
        if (!asset.mime_type || !TEXT_MIME_TYPES.includes(asset.mime_type)) {
            // For images or other binary types, this action is not appropriate.
            // However, if we want to support previewing other types as text (e.g. XML), we might adjust this.
            return { success: false, error: 'Asset is not a downloadable text file.' }; 
        }

        // 4. Download the asset content from storage
        const { data: blobData, error: downloadError } = await supabase.storage
            .from('assets') // Bucket name
            .download(asset.storage_path);

        if (downloadError) {
            console.error('getAssetContent: Storage download error', downloadError);
            return { success: false, error: `Failed to download asset content: ${downloadError.message}` };
        }
        if (!blobData) {
            return { success: false, error: 'No content found for asset.' };
        }

        const content = await blobData.text();
        return { success: true, content };

    } catch (err: any) {
        console.error('getAssetContent: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// UPDATE ASSET TEXT CONTENT ACTION
// ============================================================================

export async function updateAssetText(
    assetId: string, 
    newContent: string
): Promise<{ success: boolean; error?: string }> {
    if (!assetId) {
        return { success: false, error: 'Asset ID is required for update.' };
    }
    // newContent can be empty, that's a valid update.

    const supabase = createClient();

    try {
        // 1. Authentication and Organization Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('updateAssetText: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('updateAssetText: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found.' };
        }

        // 2. Fetch current asset metadata (storage_path, mime_type) to ensure it exists and is text
        const { data: asset, error: metaError } = await supabase
            .from('assets')
            .select('storage_path, mime_type')
            .match({ id: assetId, organization_id: activeOrgId }) // Scope by org
            // .eq('user_id', user.id) // Optional: if assets are strictly user-owned
            .single();

        if (metaError) {
            console.error('updateAssetText: Metadata fetch error', metaError);
            return { success: false, error: `Failed to fetch asset metadata: ${metaError.message}` };
        }
        if (!asset) {
            return { success: false, error: 'Asset not found or access denied.' };
        }

        const TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript']; // Keep in sync
        if (!asset.mime_type || !TEXT_MIME_TYPES.includes(asset.mime_type)) {
            return { success: false, error: 'Cannot update content: Asset is not a recognized text type.' };
        }

        // 3. Upload new content to storage, overwriting the existing file
        const { data: uploadData, error: storageError } = await supabase.storage
            .from('assets')
            .upload(asset.storage_path, new Blob([newContent]), {
                contentType: asset.mime_type, // Use existing mime_type
                upsert: true, // Overwrite if exists
            });

        if (storageError) {
            console.error('updateAssetText: Storage upload error', storageError);
            return { success: false, error: `Failed to upload new content: ${storageError.message}` };
        }
        if (!uploadData || !uploadData.path) {
            return { success: false, error: 'Storage upload succeeded but path was not returned.'};
        }

        // 4. Update asset metadata in the database (e.g., size, updated_at is handled by DB)
        //    We need to ensure `updated_at` is automatically managed by the database or update it here.
        //    Size also needs to be updated.
        const { error: dbUpdateError } = await supabase
            .from('assets')
            .update({
                size: newContent.length, // Update the size
                // updated_at will be handled by DB trigger `moddatetime` if applied to `assets` table
                // If not, uncomment and manage here: updated_at: new Date().toISOString(), 
                storage_path: uploadData.path, // storage path might change if versioning is on, ensure it's updated
                mime_type: asset.mime_type // Ensure mime_type is preserved or updated if necessary
            })
            .match({ id: assetId, organization_id: activeOrgId }); // Scope by org

        if (dbUpdateError) {
            // Log this error but don't necessarily fail the whole operation if storage was updated
            // This depends on desired atomicity. For now, we treat it as a partial failure.
            console.error('updateAssetText: DB metadata update error', dbUpdateError);
            // Optionally, attempt to revert storage upload or mark asset as needing attention.
            // For now, return success as content is updated, but log the metadata issue.
            // return { success: false, error: `Failed to update asset metadata: ${dbUpdateError.message}` };
        }

        // 5. Revalidate relevant paths
        revalidatePath('/dam');
        revalidatePath(`/dam/assets/${assetId}`); // If there's a specific asset view page

        return { success: true };

    } catch (err: any) {
        console.error('updateAssetText: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

// ============================================================================
// SAVE AS NEW TEXT ASSET ACTION
// ============================================================================

export async function saveAsNewTextAsset(
    content: string,
    desiredName: string,
    // folderId?: string | null // Optional: Add later if needed
): Promise<{ success: boolean; error?: string; data?: { newAssetId: string } }> {

    if (!desiredName || desiredName.trim() === '') {
        return { success: false, error: 'Asset name is required.' };
    }

    const supabase = createClient();

    try {
        // 1. Authentication and Organization Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('saveAsNewTextAsset: Auth Error', authError);
            return { success: false, error: 'User not authenticated.' };
        }
        const activeOrgId = await getActiveOrganizationId();
        if (!activeOrgId) {
            console.error('saveAsNewTextAsset: Active Organization ID not found.');
            return { success: false, error: 'Active organization not found.' };
        }

        // 2. Determine file extension and MIME type (default to .txt and text/plain)
        const fileExtension = desiredName.includes('.') ? desiredName.substring(desiredName.lastIndexOf('.')) : '.txt';
        const mimeType = fileExtension === '.md' ? 'text/markdown' : 'text/plain'; // Simple example
        const fileNameWithoutExtension = desiredName.includes('.') ? desiredName.substring(0, desiredName.lastIndexOf('.')) : desiredName;
        
        // Sanitize and create a unique file name for storage
        const safeBaseName = fileNameWithoutExtension.replace(/[^a-zA-Z0-9_\-\.]/g, ' ').replace(/\s+/g, '-');
        const uniqueFileName = `${crypto.randomUUID()}-${safeBaseName}${fileExtension}`;
        const storagePath = `${activeOrgId}/${user.id}/${uniqueFileName}`;

        // 3. Upload content to storage
        const { data: uploadData, error: storageError } = await supabase.storage
            .from('assets') // Your bucket name
            .upload(storagePath, new Blob([content]), {
                contentType: mimeType,
                // upsert: false // Default is false, which is correct for new asset
            });

        if (storageError) {
            console.error('saveAsNewTextAsset: Storage upload error', storageError);
            return { success: false, error: `Failed to upload new asset: ${storageError.message}` };
        }
        if (!uploadData || !uploadData.path) {
            return { success: false, error: 'Storage upload succeeded but path was not returned.' };
        }

        // 4. Insert asset metadata into the database
        const { data: dbData, error: dbInsertError } = await supabase
            .from('assets')
            .insert({
                name: desiredName.trim(), // Use the user-provided name for display
                storage_path: uploadData.path, // Use the actual path from storage response
                mime_type: mimeType,
                size: content.length,
                user_id: user.id,
                organization_id: activeOrgId,
                // folder_id: folderId, // Assign to folder if provided
                asset_type: 'file', // Or determine dynamically
            })
            .select('id') // Select only the ID of the newly created asset
            .single();

        if (dbInsertError) {
            console.error('saveAsNewTextAsset: DB insert error', dbInsertError);
            // Attempt to clean up storage if DB insert fails
            await supabase.storage.from('assets').remove([uploadData.path]);
            return { success: false, error: `Failed to save asset metadata: ${dbInsertError.message}` };
        }

        if (!dbData || !dbData.id) {
            console.error('saveAsNewTextAsset: DB insert succeeded but ID not returned.');
            // Attempt to clean up storage
            await supabase.storage.from('assets').remove([uploadData.path]);
            return { success: false, error: 'Failed to get ID for new asset after saving metadata.' };
        }

        // 5. Revalidate paths
        revalidatePath('/dam', 'layout'); // Revalidate the main DAM page and layout
        // if (folderId) {
        //     revalidatePath(`/dam/folders/${folderId}`, 'layout');
        // }

        return { success: true, data: { newAssetId: dbData.id } };

    } catch (err: any) {
        console.error('saveAsNewTextAsset: Unexpected Error', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
} 