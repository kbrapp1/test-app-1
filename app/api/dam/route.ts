import { NextRequest, NextResponse } from 'next/server';
import { queryData } from '@/lib/supabase/db-queries';
import { getPublicUrl } from '@/lib/supabase/db-storage';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { SupabaseClient } from '@supabase/supabase-js';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Define the actual handler function, which now receives user and supabase client directly
async function getHandler(
  request: NextRequest,
  user: User, 
  supabase: SupabaseClient
) {
  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId');
  const searchTerm = url.searchParams.get('q');
  const quickSearch = url.searchParams.get('quicksearch') === 'true';
  const limitParam = url.searchParams.get('limit');

  let parsedLimit: number | undefined = undefined;
  if (quickSearch && limitParam) {
    const num = parseInt(limitParam, 10);
    if (!isNaN(num) && num > 0) {
      parsedLimit = Math.min(num, 20); // Apply a max limit of 20 for quicksearch
    }
  }

  // Get active organization ID
  const activeOrgId = await getActiveOrganizationId();

  if (!activeOrgId) {
    // Important: Prevent querying if no org ID is found to avoid data leakage
    throw new ValidationError('Active organization ID not found. Cannot fetch DAM data.');
  }

  let foldersData: Omit<Folder, 'type'>[] | null = null;
  let assetsData: Omit<Asset, 'type' | 'publicUrl'>[] | null = null;
  let foldersError: Error | null = null;
  let assetsError: Error | null = null;

  if (searchTerm && searchTerm.trim() !== '') {
    // Search mode: query across all folders in the org by name
    let folderQuery = supabase
      .from('folders')
      .select('id, name, user_id, created_at, parent_folder_id')
      .eq('organization_id', activeOrgId)
      .ilike('name', `%${searchTerm.trim()}%`)
      .order('name', { ascending: true });

    let assetQuery = supabase
      .from('assets')
      .select('id, name, user_id, created_at, storage_path, mime_type, size, folder_id')
      .eq('organization_id', activeOrgId)
      .ilike('name', `%${searchTerm.trim()}%`)
      .order('created_at', { ascending: false });

    if (quickSearch && parsedLimit) {
      // In quick search, apply limit primarily to assets, or proportionally if desired.
      // For simplicity, let's limit both, though assets are often more numerous.
      // A more advanced strategy might fetch fewer folders and more assets.
      folderQuery = folderQuery.limit(Math.ceil(parsedLimit / 2)); // Example: limit folders to half
      assetQuery = assetQuery.limit(parsedLimit); // Limit assets fully
    }

    const [folderSearch, assetSearch] = await Promise.all([folderQuery, assetQuery]);

    foldersData = folderSearch.data as Omit<Folder, 'type'>[] | null;
    foldersError = folderSearch.error;
    assetsData = assetSearch.data as Omit<Asset, 'type' | 'publicUrl'>[] | null;
    assetsError = assetSearch.error;

  } else {
    // Folder navigation mode (original logic)
    // Limit parameter is less typical here but can be supported if quickSearch is true
    let folderBaseQueryOptions = {
      ...(folderId && folderId.trim() !== '' 
        ? { matchColumn: 'parent_folder_id', matchValue: folderId } 
        : { isNull: 'parent_folder_id' }),
      organizationId: activeOrgId,
      orderBy: 'name',
      ascending: true,
      limit: (quickSearch && parsedLimit) ? Math.ceil(parsedLimit / 2) : undefined // Apply limit if quicksearching in folder view
    };

    const folderResult = await queryData<Omit<Folder, 'type'>>(
      supabase,
      'folders',
      'id, name, user_id, created_at, parent_folder_id',
      folderBaseQueryOptions
    );
    foldersData = folderResult.data;
    foldersError = folderResult.error;

    let assetBaseQueryOptions = {
      ...(folderId && folderId.trim() !== '' 
        ? { matchColumn: 'folder_id', matchValue: folderId }
        : { isNull: 'folder_id' }),
      organizationId: activeOrgId, 
      orderBy: 'created_at',
      ascending: false,
      limit: (quickSearch && parsedLimit) ? parsedLimit : undefined // Apply limit if quicksearching in folder view
    };
    const assetResult = await queryData<Omit<Asset, 'type' | 'publicUrl'>>(
      supabase,
      'assets',
      'id, name, user_id, created_at, storage_path, mime_type, size, folder_id',
      assetBaseQueryOptions
    );
    assetsData = assetResult.data;
    assetsError = assetResult.error;
  }

  if (foldersError) {
    throw new DatabaseError(foldersError.message || 'Failed to query folders');
  }
  if (assetsError) {
    throw new DatabaseError(assetsError.message || 'Failed to query assets');
  }

  // Build public URLs using the utility function
  const assetsWithUrls = (assetsData || []).map((asset) => {
    return {
      ...asset,
      type: 'asset' as const,
      publicUrl: getPublicUrl(supabase, 'assets', asset.storage_path),
    };
  });

  // Combine and tag folders
  const folders = (foldersData || []).map((folder) => ({ ...folder, type: 'folder' as const }));
  let combined: CombinedItem[] = [...folders, ...assetsWithUrls];

  // If it was a quick search with a limit, and we fetched more than the limit due to separate folder/asset queries,
  // we might want to slice the final combined array. 
  // However, the limits are applied per query. A more precise total limit would require more complex logic or a single UNION query.
  // For now, the individual limits on folder/asset queries in search mode should suffice for quicksearch.
  if (quickSearch && parsedLimit && searchTerm && searchTerm.trim() !== '' && combined.length > parsedLimit) {
    // A simple strategy: prioritize assets if combined list is too long for quick search.
    // This might not be ideal if folders are very relevant.
    // Or, if only a few folders, keep them and fill with assets up to limit.
    // For now, just slice. This might cut off folders if they come first.
    // A better approach would be to sort by relevance if possible before slicing.
    // combined = combined.slice(0, parsedLimit); 
    // Let's try to keep a mix, ensure at least some folders if they exist, then assets.
    const limitedFolders = folders.slice(0, Math.ceil(parsedLimit / 2));
    const remainingLimitForAssets = parsedLimit - limitedFolders.length;
    const limitedAssets = assetsWithUrls.slice(0, Math.max(0, remainingLimitForAssets));
    combined = [...limitedFolders, ...limitedAssets];
    // Ensure final combined list doesn't exceed parsedLimit due to Math.ceil or minimums
    if (combined.length > parsedLimit) {
        combined = combined.slice(0, parsedLimit);
    }
  }

  return NextResponse.json(combined);
}

// Export the GET handler wrapped with authentication AND error handling
export const GET = withErrorHandling(withAuth(getHandler)); 