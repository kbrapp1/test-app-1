import { SupabaseClient } from '@supabase/supabase-js';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import { getPublicUrl } from '@/lib/supabase/db-storage';
import type {
  RawAssetFromApi,
  RawFolderFromApi,
  TransformedDataReturn,
  TransformedAsset,
  TransformedFolder
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
  supabase: SupabaseClient,
  rawAssets: RawAssetFromApi[], 
  ownerNamesMap: Map<string, string>, 
  parentFolderNamesMap: Map<string, string>
): TransformedAsset[] {
  return (rawAssets || []).map((asset) => {
    let parentFolderName: string | null = null;
    if (asset.folder_id) {
      parentFolderName = parentFolderNamesMap.get(asset.folder_id) || 'Unknown Folder';
    } else {
      parentFolderName = 'Root';
    }
    const mappedTags: Tag[] = asset.asset_tags?.map(at => at.tags).filter((tag): tag is Tag => tag !== null) || [];

    const publicUrl = asset.storage_path ? getPublicUrl(supabase, 'assets', asset.storage_path) : null;

    return {
      ...asset,
      type: 'asset' as const,
      publicUrl: publicUrl,
      parentFolderName: parentFolderName,
      ownerName: ownerNamesMap.get(asset.user_id) || 'Unknown Owner',
      tags: mappedTags,
      size: asset.size ?? 0,
    };
  });
}

// Helper for mapping raw folders
export function mapRawFoldersToEnrichedFolders(
  rawFolders: RawFolderFromApi[], 
  ownerNamesMap: Map<string, string>, 
  activeOrgId: string // Kept for explicit organization_id if needed, though rawFolder should have it
): TransformedFolder[] {
  return (rawFolders || []).map((folder) => {
    const hasChildren = folder.has_children_count && folder.has_children_count.length > 0 
                        ? folder.has_children_count[0].count > 0 
                        : false;
    return {
      id: folder.id,
      name: folder.name,
      // Raw snake_case fields are implicitly on `folder` from RawFolderFromApi
      // These will be overridden by explicit camelCase mappings below if TransformedFolder doesn't include them.
      // For clarity, we will explicitly map to the new TransformedFolder structure.

      // Domain-aligned fields
      userId: folder.user_id, 
      createdAt: new Date(folder.created_at),
      updatedAt: folder.updated_at ? new Date(folder.updated_at) : undefined,
      parentFolderId: folder.parent_folder_id === undefined ? undefined : folder.parent_folder_id, // handles null correctly
      organizationId: folder.organization_id || activeOrgId, // Prefer organization_id from folder data if present
      has_children: hasChildren,

      // Enriched fields
      type: 'folder' as const,
      ownerName: ownerNamesMap.get(folder.user_id) || 'Unknown Owner',
      
      // Deprecated snake_case fields if not part of TransformedFolder anymore 
      // (ensure TransformedFolder type definition is the source of truth)
      // user_id: folder.user_id, (covered by userId)
      // created_at: folder.created_at, (covered by createdAt)
      // updated_at: folder.updated_at, (covered by updatedAt)
      // parent_folder_id: folder.parent_folder_id (covered by parentFolderId)
    };
  });
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