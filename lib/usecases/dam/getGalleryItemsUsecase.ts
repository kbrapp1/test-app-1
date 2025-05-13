import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { AppError, DatabaseError, AuthorizationError } from '@/lib/errors/base'; // Final attempt at path

interface GetGalleryItemsParams {
  currentFolderId: string | null;
}

interface GetGalleryItemsResult {
  success: boolean;
  data?: { combinedItems: CombinedItem[] };
  error?: string;
}

export async function getGalleryItemsUsecase({
  currentFolderId,
}: GetGalleryItemsParams): Promise<GetGalleryItemsResult> {
  const supabaseUserClient = createSupabaseUserClient();
  try {
    // Auth Check (using user client)
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      throw new AuthorizationError('User not authenticated.');
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      throw new AuthorizationError('Active organization context not found.');
    }

    // Use User client for data fetching to apply RLS
    const supabase = supabaseUserClient;

    // --- Fetch Folders ---
    let folderQuery = supabase.from('folders').select('*');
    if (currentFolderId === null) {
      folderQuery = folderQuery.is('parent_folder_id', null);
    } else {
      folderQuery = folderQuery.eq('parent_folder_id', currentFolderId);
    }
    folderQuery = folderQuery.eq('organization_id', activeOrgId);
    const { data: foldersData, error: foldersError } = await folderQuery.order('name', { ascending: true });

    if (foldersError) {
      console.error('[Usecase] Error fetching folders:', foldersError);
      throw new DatabaseError(`Error loading folders: ${foldersError.message}`);
    }
    const folders: Folder[] = (foldersData || []).map(f => ({ ...f, type: 'folder' }));

    // --- Fetch Assets ---
    let assetQuery = supabase.from('assets').select('*');
    if (currentFolderId === null) {
      assetQuery = assetQuery.is('folder_id', null);
    } else {
      assetQuery = assetQuery.eq('folder_id', currentFolderId);
    }
    assetQuery = assetQuery.eq('organization_id', activeOrgId);
    const { data: assetsData, error: assetsError } = await assetQuery.order('created_at', { ascending: false });

    if (assetsError) {
      console.error('[Usecase] Error fetching assets:', assetsError);
      throw new DatabaseError(`Error loading assets: ${assetsError.message}`);
    }

    // --- Generate Public URLs for Assets ---
    // Note: Consider potential performance impact or alternative strategies (e.g., client-side URL generation)
    const assetsWithUrls: Asset[] = (assetsData || []).map((assetData: any) => {
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(assetData.storage_path);
      return {
        ...assetData,
        type: 'asset',
        publicUrl: urlData?.publicUrl || '/placeholders/asset-placeholder.png', // Use a real placeholder path
      } as Asset;
    });

    // --- Combine Data ---
    const combinedItems: CombinedItem[] = [
      ...(folders as CombinedItem[]),
      ...(assetsWithUrls as CombinedItem[])
    ];

    return { success: true, data: { combinedItems } };

  } catch (err: any) {
    console.error('[Usecase] getGalleryItemsUsecase: Unexpected Error', err);
    // Handle specific error types if needed
    if (err instanceof AppError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred fetching gallery data.' };
  }
} 