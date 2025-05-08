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
  const folderId = url.searchParams.get('folderId'); // Restore folderId from client

  // Get active organization ID
  const activeOrgId = await getActiveOrganizationId();

  if (!activeOrgId) {
    // Important: Prevent querying if no org ID is found to avoid data leakage
    throw new ValidationError('Active organization ID not found. Cannot fetch DAM data.');
  }

  // Restore folder fetching logic
  const { data: foldersData, error: foldersError } = await queryData<Omit<Folder, 'type'>>(
    supabase,
    'folders',
    'id, name, parent_folder_id',
    {
      ...(folderId && folderId.trim() !== '' 
        ? { matchColumn: 'parent_folder_id', matchValue: folderId } 
        : { isNull: 'parent_folder_id' }),
      organizationId: activeOrgId,
      orderBy: 'name',
      ascending: true
    }
  );

  if (foldersError) { // Restore error check for folders
    throw new DatabaseError(foldersError.message || 'Failed to query folders');
  }

  // Restore asset fetching logic to use folderId
  const { data: assetsData, error: assetsError } = await queryData<Omit<Asset, 'type' | 'publicUrl'>>(
    supabase,
    'assets',
    'id, name, storage_path, mime_type, folder_id', // Remove organization_id from select, it was for debug
    {
      ...(folderId && folderId.trim() !== '' // Restore conditional logic for folderId
        ? { matchColumn: 'folder_id', matchValue: folderId }
        : { isNull: 'folder_id' }),
      organizationId: activeOrgId, 
      orderBy: 'created_at',
      ascending: false
    }
  );

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