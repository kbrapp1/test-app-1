import { SupabaseClient } from '@supabase/supabase-js';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import type {
  DamFilterParameters,
  DamSortParameters,
  LimitOptions,
  DataFetchingResult,
  RawAssetFromApi,      // For casting data from Supabase before sending to transformers
  RawFolderFromApi,     // For casting data from Supabase before sending to transformers
  TransformedDataReturn // For the return type of transformAndEnrichData
} from './dam-api.types';

// Import query building functions
import {
  buildFolderBaseQueryInternal,
  getAssetIdsForTagFilter,
  buildAssetBaseQueryInternal
} from './dam-api.query-builders';

// Import data transformation functions
import {
  transformAndEnrichData
} from './dam-api.transformers';

export function applyQuickSearchLimits(
  foldersWithDetails: Folder[],
  assetsWithDetails: Asset[],
  limit: number
): CombinedItem[] {
  const combined: CombinedItem[] = [];
  // Prioritize folders
  for (const folder of foldersWithDetails) {
    if (combined.length >= limit) break;
    combined.push(folder);
  }
  // Then add assets until limit is reached
  for (const asset of assetsWithDetails) {
    if (combined.length >= limit) break;
    combined.push(asset);
  }
  return combined;
}

export async function fetchSearchResults(
  supabase: SupabaseClient,
  activeOrgId: string,
  searchTerm: string,
  tagIdsParam: string | null,
  filters: DamFilterParameters,
  sortParams: DamSortParameters,
  limitOptions: LimitOptions,
  isGlobalFilterOnlyModeBoolean?: boolean
): Promise<DataFetchingResult> {
  const isGlobalFilterMode = isGlobalFilterOnlyModeBoolean === true;
  let foldersError: Error | null = null;
  let assetsError: Error | null = null;

  const tagFilterResult = await getAssetIdsForTagFilter(supabase, tagIdsParam);

  let assetsQuery = buildAssetBaseQueryInternal(supabase, activeOrgId, tagFilterResult, filters)
    .ilike('name', `%${searchTerm}%`);

  let foldersQuery = buildFolderBaseQueryInternal(supabase, activeOrgId, filters, { searchTerm, isGlobalFilterMode });
  
  if (isGlobalFilterMode && filters.type && filters.type !== 'folder') {
    foldersQuery = foldersQuery.limit(0);
  }

  // In global search mode, assets are searched across all folders (folder_id IS NULL or NOT NULL).
  // If NOT in global search mode (i.e., root search without specific filters implying global), only show root assets.
  if (!isGlobalFilterMode) {
     assetsQuery = assetsQuery.is('folder_id', null);
  }

  if (filters.type && filters.type === 'folder') {
    assetsQuery = assetsQuery.limit(0); 
  }

  const sortBy = sortParams.sortBy || 'name';
  const sortOrderAsc = sortParams.sortOrder !== 'desc';

  if (sortBy === 'created_at' || sortBy === 'name' || sortBy === 'updated_at') {
    foldersQuery = foldersQuery.order(sortBy, { ascending: sortOrderAsc });
    assetsQuery = assetsQuery.order(sortBy, { ascending: sortOrderAsc });
  } else if (sortBy === 'size') {
    assetsQuery = assetsQuery.order(sortBy, { ascending: sortOrderAsc });
    foldersQuery = foldersQuery.order('name', { ascending: sortOrderAsc }); 
  }

  if (limitOptions.quickSearch && limitOptions.parsedLimit) {
    foldersQuery = foldersQuery.limit(limitOptions.parsedLimit); 
    assetsQuery = assetsQuery.limit(limitOptions.parsedLimit);
  }
  
  const [foldersResponse, assetsResponse] = await Promise.all([
    foldersQuery,
    assetsQuery,
  ]);

  if (foldersResponse.error) {
    console.error('Error fetching folders in search:', foldersResponse.error);
    foldersError = foldersResponse.error as Error;
  }
  if (assetsResponse.error) {
    console.error('Error fetching assets in search:', assetsResponse.error);
    assetsError = assetsResponse.error as Error;
  }

  // Data from Supabase is Raw, then transformed
  const transformed: TransformedDataReturn = await transformAndEnrichData(
    supabase,
    activeOrgId,
    foldersResponse.data as RawFolderFromApi[] | null,
    assetsResponse.data as RawAssetFromApi[] | null
  );
  
  let finalFolders = transformed.foldersWithDetails;
  let finalAssets = transformed.assetsWithDetails;

  if (limitOptions.quickSearch && limitOptions.parsedLimit) {
    const limitedResults = applyQuickSearchLimits(transformed.foldersWithDetails, transformed.assetsWithDetails, limitOptions.parsedLimit);
    // Filter based on the IDs present in the combined, limited list
    const limitedFolderIds = new Set(limitedResults.filter(item => item.type === 'folder').map(item => item.id));
    const limitedAssetIds = new Set(limitedResults.filter(item => item.type === 'asset').map(item => item.id));
    finalFolders = transformed.foldersWithDetails.filter(f => limitedFolderIds.has(f.id));
    finalAssets = transformed.assetsWithDetails.filter(a => limitedAssetIds.has(a.id));
  }

  // DataFetchingResult expects Raw types or compatible structures.
  // Since we've transformed, we cast to `any` to satisfy the return type.
  // A more robust solution might involve adjusting DataFetchingResult or mapping back if necessary.
  return {
    foldersData: finalFolders as any, 
    assetsData: finalAssets as any, 
    foldersError,
    assetsError,
  };
}

export async function fetchFolderContents(
  supabase: SupabaseClient,
  activeOrgId: string,
  folderId: string | null,
  tagIdsParam: string | null,
  filters: DamFilterParameters,
  sortParams: DamSortParameters,
  limitOptions: LimitOptions // Not actively used for limiting data fetch in this func, but part of shared signature
): Promise<DataFetchingResult> {
  let foldersError: Error | null = null;
  let assetsError: Error | null = null;

  const tagFilterResult = await getAssetIdsForTagFilter(supabase, tagIdsParam);

  let assetsQuery = buildAssetBaseQueryInternal(supabase, activeOrgId, tagFilterResult, filters);
  if (folderId) {
    assetsQuery = assetsQuery.eq('folder_id', folderId);
  } else { 
    assetsQuery = assetsQuery.is('folder_id', null);
  }

  let foldersQuery = buildFolderBaseQueryInternal(supabase, activeOrgId, filters, { parentFolderId: folderId });

  if (filters.type && filters.type !== 'folder') {
    foldersQuery = foldersQuery.limit(0);
  }
  if (filters.type && filters.type === 'folder') {
    assetsQuery = assetsQuery.limit(0);
  }

  const sortBy = sortParams.sortBy || 'name';
  const sortOrderAsc = sortParams.sortOrder !== 'desc';

  if (sortBy === 'created_at' || sortBy === 'name' || sortBy === 'updated_at') {
    foldersQuery = foldersQuery.order(sortBy, { ascending: sortOrderAsc });
    assetsQuery = assetsQuery.order(sortBy, { ascending: sortOrderAsc });
  } else if (sortBy === 'size') {
    assetsQuery = assetsQuery.order(sortBy, { ascending: sortOrderAsc });
    foldersQuery = foldersQuery.order('name', { ascending: sortOrderAsc });
  }

  const [foldersResponse, assetsResponse] = await Promise.all([
    foldersQuery,
    assetsQuery,
  ]);

  if (foldersResponse.error) {
    console.error('Error fetching folders in folder contents:', foldersResponse.error);
    foldersError = foldersResponse.error as Error;
  }
  if (assetsResponse.error) {
    console.error('Error fetching assets in folder contents:', assetsResponse.error);
    assetsError = assetsResponse.error as Error;
  }
  
  const transformed: TransformedDataReturn = await transformAndEnrichData(
    supabase,
    activeOrgId,
    foldersResponse.data as RawFolderFromApi[] | null,
    assetsResponse.data as RawAssetFromApi[] | null
  );

  return {
    foldersData: transformed.foldersWithDetails as any, 
    assetsData: transformed.assetsWithDetails as any,
    foldersError,
    assetsError,
  };
} 