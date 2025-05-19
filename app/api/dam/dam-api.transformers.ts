import { SupabaseClient } from '@supabase/supabase-js';
import { Asset, Folder } from '@/types/dam';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import { getPublicUrl } from '@/lib/supabase/db-storage';
import type {
  RawAssetFromApi,
  RawFolderFromApi,
  TransformedDataReturn
} from './dam-api.types';

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
    return new Map();
  }
  const ownerMap = new Map<string, string>();
  profiles?.forEach(profile => {
    if (profile.full_name) {
      ownerMap.set(profile.id, profile.full_name);
    }
  });
  return ownerMap;
}

// Helper for mapping raw assets
export function mapRawAssetsToEnrichedAssets(
  supabase: SupabaseClient, // For getPublicUrl
  rawAssets: RawAssetFromApi[], 
  ownerNamesMap: Map<string, string>, 
  parentFolderNamesMap: Map<string, string>
): Asset[] {
  return (rawAssets || []).map((asset) => {
    let parentFolderName: string | null = null;
    if (asset.folder_id) {
      parentFolderName = parentFolderNamesMap.get(asset.folder_id) || 'Unknown Folder';
    } else {
      parentFolderName = 'Root'; // Assets directly under root
    }
    const mappedTags: Tag[] = asset.asset_tags?.map(at => at.tags).filter((tag): tag is Tag => tag !== null) || [];

    return {
      ...asset,
      type: 'asset' as const,
      publicUrl: getPublicUrl(supabase, 'assets', asset.storage_path),
      parentFolderName: parentFolderName,
      ownerName: ownerNamesMap.get(asset.user_id) || 'Unknown Owner',
      tags: mappedTags,
      size: asset.size ?? 0, // Ensure size is always a number
    };
  });
}

// Helper for mapping raw folders
export function mapRawFoldersToEnrichedFolders(
  rawFolders: RawFolderFromApi[], 
  ownerNamesMap: Map<string, string>, 
  activeOrgId: string 
): Folder[] {
  return (rawFolders || []).map((folder) => ({
    ...folder,
    type: 'folder' as const,
    ownerName: ownerNamesMap.get(folder.user_id) || 'Unknown Owner',
    organization_id: activeOrgId,
    // Add any other folder-specific transformations if needed
  }));
}

// Transforms and enriches raw asset and folder data
export async function transformAndEnrichData(
  supabase: SupabaseClient,
  activeOrgId: string,
  foldersData: RawFolderFromApi[] | null,
  assetsData: RawAssetFromApi[] | null
): Promise<TransformedDataReturn> {
  const allUserIds = new Set<string>();
  const allFolderIdsForParentNameLookup = new Set<string>();

  (foldersData || []).forEach(f => {
    if (f.user_id) allUserIds.add(f.user_id);
  });
  (assetsData || []).forEach(a => {
    if (a.user_id) allUserIds.add(a.user_id);
    if (a.folder_id) allFolderIdsForParentNameLookup.add(a.folder_id);
  });

  const ownerNamesMap = await getOwnerNames(supabase, Array.from(allUserIds));
  
  let parentFolderNamesMap = new Map<string, string>();
  if (allFolderIdsForParentNameLookup.size > 0) {
    const { data: parentFolders, error: parentFoldersError } = await supabase
      .from('folders')
      .select('id, name')
      .in('id', Array.from(allFolderIdsForParentNameLookup))
      .eq('organization_id', activeOrgId); // Ensure we only get folders from the active org

    if (parentFoldersError) {
      console.error('Error fetching parent folder names:', parentFoldersError.message);
    } else {
      parentFolders?.forEach(pf => parentFolderNamesMap.set(pf.id, pf.name));
    }
  }

  const enrichedAssets = mapRawAssetsToEnrichedAssets(supabase, assetsData || [], ownerNamesMap, parentFolderNamesMap);
  const enrichedFolders = mapRawFoldersToEnrichedFolders(foldersData || [], ownerNamesMap, activeOrgId);

  return {
    foldersWithDetails: enrichedFolders,
    assetsWithDetails: enrichedAssets,
  };
} 