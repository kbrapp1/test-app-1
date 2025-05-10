import { NextRequest, NextResponse } from 'next/server';
import { queryData, getPublicUrl } from '@/lib/supabase/db';
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
    const [folderSearch, assetSearch] = await Promise.all([
      supabase
        .from('folders')
        .select('id, name, user_id, created_at, parent_folder_id')
        .eq('organization_id', activeOrgId)
        .ilike('name', `%${searchTerm.trim()}%`)
        .order('name', { ascending: true }),
      supabase
        .from('assets')
        .select('id, name, user_id, created_at, storage_path, mime_type, size, folder_id')
        .eq('organization_id', activeOrgId)
        .ilike('name', `%${searchTerm.trim()}%`)
        .order('created_at', { ascending: false }),
    ]);

    foldersData = folderSearch.data as Omit<Folder, 'type'>[] | null;
    foldersError = folderSearch.error;
    assetsData = assetSearch.data as Omit<Asset, 'type' | 'publicUrl'>[] | null;
    assetsError = assetSearch.error;

  } else {
    // Folder navigation mode (original logic)
    const folderResult = await queryData<Omit<Folder, 'type'>>(
      supabase,
      'folders',
      'id, name, user_id, created_at, parent_folder_id',
      {
        ...(folderId && folderId.trim() !== '' 
          ? { matchColumn: 'parent_folder_id', matchValue: folderId } 
          : { isNull: 'parent_folder_id' }),
        organizationId: activeOrgId,
        orderBy: 'name',
        ascending: true
      }
    );
    foldersData = folderResult.data;
    foldersError = folderResult.error;

    const assetResult = await queryData<Omit<Asset, 'type' | 'publicUrl'>>(
      supabase,
      'assets',
      'id, name, user_id, created_at, storage_path, mime_type, size, folder_id',
      {
        ...(folderId && folderId.trim() !== '' 
          ? { matchColumn: 'folder_id', matchValue: folderId }
          : { isNull: 'folder_id' }),
        organizationId: activeOrgId, 
        orderBy: 'created_at',
        ascending: false
      }
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
  const combined: CombinedItem[] = [...folders, ...assetsWithUrls];

  return NextResponse.json(combined);
}

// Export the GET handler wrapped with authentication AND error handling
export const GET = withErrorHandling(withAuth(getHandler)); 