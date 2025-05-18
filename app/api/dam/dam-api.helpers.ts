import { SupabaseClient } from '@supabase/supabase-js';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import { getPublicUrl } from '@/lib/supabase/db-storage'; // Needed for transformAndEnrichData

// Define a type for the raw asset data coming from the DB with nested tags
export interface RawAssetFromApi {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  asset_tags: Array<{ tags: Tag | null }> | null;
  organization_id: string;
}

// Define a type for the raw folder data that might be incomplete for parent name lookup
// This isn't strictly used by the moved functions other than as a concept,
// but keeping it here for co-location if other folder-specific helpers are added.
// For now, it's not directly used by the exported functions from this file.
// export interface RawFolderForPath {
//   id: string;
//   name: string;
// }

// Interface for the return type of the transformation helper
export interface TransformedDataReturn {
  foldersWithDetails: Folder[];
  assetsWithDetails: Asset[];
}

// Helper to fetch owner names
export async function getOwnerNames(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching owner profiles:', profilesError.message);
    return new Map(); // Return empty map on error, downstream will show 'Unknown Owner'
  }
  const ownerMap = new Map<string, string>();
  profiles?.forEach(profile => {
    if (profile.full_name) {
      ownerMap.set(profile.id, profile.full_name);
    }
  });
  return ownerMap;
}

// New async helper specifically for fetching asset IDs based on tags
export async function getAssetIdsForTagFilter(supabase: SupabaseClient, tagIdsParam: string | null): Promise<string[] | 'no_match' | 'error' | null> {
  if (!tagIdsParam) return null; // No filter to apply

  const tagIdsArray = tagIdsParam.split(',').map(id => id.trim()).filter(id => id);
  if (tagIdsArray.length === 0) return null; // No valid tag IDs

  const { data: matchingAssetIds, error: subQueryError } = await supabase
    .from('asset_tags')
    .select('asset_id')
    .in('tag_id', tagIdsArray);

  if (subQueryError) {
    console.error('Tag filter subquery error:', subQueryError);
    return 'error'; // Indicate error
  }
  if (matchingAssetIds && matchingAssetIds.length > 0) {
    return matchingAssetIds.map(r => r.asset_id);
  }
  return 'no_match'; // No assets match the tags
}

// Synchronous helper to build the base asset query
export function buildAssetBaseQueryInternal( 
  supabase: SupabaseClient,
  activeOrgId: string,
  tagFilterResult: string[] | 'no_match' | 'error' | null 
): any { // Returns Supabase Query Builder (any for simplicity)
  let query = supabase
    .from('assets')
    .select('id, name, user_id, created_at, storage_path, mime_type, size, folder_id, organization_id, asset_tags(tags(*))')
    .eq('organization_id', activeOrgId);

  if (tagFilterResult === 'error') {
    // If tag subquery had an error, proceed without tag filtering for now
  } else if (tagFilterResult === 'no_match') {
    query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Force no results
  } else if (tagFilterResult && tagFilterResult.length > 0) {
    query = query.in('id', tagFilterResult);
  }
  return query;
}

// Helper function to transform and enrich fetched data
export async function transformAndEnrichData(
  supabase: SupabaseClient,
  activeOrgId: string,
  foldersData: Omit<Folder, 'type' | 'organization_id'>[] | null,
  assetsData: RawAssetFromApi[] | null // Uses RawAssetFromApi from this file
): Promise<TransformedDataReturn> { // Uses TransformedDataReturn from this file
  const allUserIds = new Set<string>();
  (foldersData || []).forEach(f => f.user_id && allUserIds.add(f.user_id));
  (assetsData || []).forEach(a => a.user_id && allUserIds.add(a.user_id));
  const ownerNamesMap = await getOwnerNames(supabase, Array.from(allUserIds)); // Uses getOwnerNames from this file

  const assetFolderIds = new Set<string>();
  (assetsData || []).forEach(asset => {
    if (asset.folder_id) {
      assetFolderIds.add(asset.folder_id);
    }
  });

  const parentFolderNamesMap = new Map<string, string>();
  if (assetFolderIds.size > 0) {
    const { data: parentFolders, error: parentFoldersError } = await supabase
      .from('folders')
      .select('id, name')
      .in('id', Array.from(assetFolderIds))
      .eq('organization_id', activeOrgId);

    if (parentFoldersError) {
      console.error('Error fetching parent folder names for assets:', parentFoldersError.message);
    } else {
      parentFolders?.forEach(pf => parentFolderNamesMap.set(pf.id, pf.name));
    }
  }

  const assetsWithDetails: Asset[] = (assetsData || []).map((asset) => {
    let parentFolderName: string | null = null;
    if (asset.folder_id) {
      parentFolderName = parentFolderNamesMap.get(asset.folder_id) || 'Unknown Folder';
    } else {
      parentFolderName = 'Root';
    }

    const mappedTags: Tag[] = asset.asset_tags
      ? asset.asset_tags
          .map(at => at.tags)
          .filter((tag): tag is Tag => tag !== null)
      : [];

    return {
      ...asset,
      type: 'asset' as const,
      publicUrl: getPublicUrl(supabase, 'assets', asset.storage_path), // Needs getPublicUrl import
      parentFolderName: parentFolderName,
      ownerName: ownerNamesMap.get(asset.user_id) || 'Unknown Owner',
      tags: mappedTags,
    };
  });

  const foldersWithDetails: Folder[] = (foldersData || []).map((folder) => ({
    ...folder,
    organization_id: activeOrgId,
    type: 'folder' as const,
    ownerName: ownerNamesMap.get(folder.user_id) || 'Unknown Owner',
  }));

  return {
    foldersWithDetails,
    assetsWithDetails,
  };
}

// Helper function to apply quick search specific limiting
export function applyQuickSearchLimits(
  foldersWithDetails: Folder[],
  assetsWithDetails: Asset[],
  limit: number
): CombinedItem[] {
  const combinedForSlicing = [...foldersWithDetails, ...assetsWithDetails];
  if (combinedForSlicing.length <= limit) {
    return combinedForSlicing;
  }
  const limitedFolders = foldersWithDetails.slice(0, Math.ceil(limit / 2));
  const remainingLimitForAssets = limit - limitedFolders.length;
  const limitedAssets = assetsWithDetails.slice(0, Math.max(0, remainingLimitForAssets));
  
  let combinedResult = [...limitedFolders, ...limitedAssets];
  if (combinedResult.length > limit) {
    combinedResult = combinedResult.slice(0, limit);
  }
  return combinedResult;
} 