import { SupabaseClient } from '@supabase/supabase-js';
import type { DamFilterParameters } from './dam-api.types';

// Utility function to apply date filters
export function applyDateFiltersToQuery(query: any, filters: DamFilterParameters): any {
  if (!filters.creationDateOption) {
    return query;
  }

  const now = new Date();
  let dateFilterValue: string;
  let dateEndFilterValue: string | undefined;

  switch (filters.creationDateOption) {
    case 'today':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last7days':
      const last7DaysDate = new Date(now.valueOf());
      last7DaysDate.setUTCDate(now.getUTCDate() - 7);
      dateFilterValue = new Date(Date.UTC(last7DaysDate.getUTCFullYear(), last7DaysDate.getUTCMonth(), last7DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last30days':
      const last30DaysDate = new Date(now.valueOf());
      last30DaysDate.setUTCDate(now.getUTCDate() - 30);
      dateFilterValue = new Date(Date.UTC(last30DaysDate.getUTCFullYear(), last30DaysDate.getUTCMonth(), last30DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'thisYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'lastYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString();
      dateEndFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue).lt('created_at', dateEndFilterValue);
      break;
    case 'custom':
      if (filters.dateStart) {
        const [year, month, day] = filters.dateStart.split('-').map(Number);
        dateFilterValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
        query = query.gte('created_at', dateFilterValue);
      }
      if (filters.dateEnd) {
        const [year, month, day] = filters.dateEnd.split('-').map(Number);
        dateEndFilterValue = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
        query = query.lte('created_at', dateEndFilterValue);
      }
      break;
  }
  return query;
}

// Utility function to build base folder query
export function buildFolderBaseQueryInternal(
  supabase: SupabaseClient,
  activeOrgId: string,
  filters: DamFilterParameters,
  { parentFolderId, searchTerm, isGlobalFilterMode }: 
  { parentFolderId?: string | null; searchTerm?: string | null; isGlobalFilterMode?: boolean }
): any {
  let query = supabase
    .from('folders')
    .select('id, name, user_id, created_at, parent_folder_id, updated_at')
    .eq('organization_id', activeOrgId);

  // Parent folder filtering (for fetchFolderContents)
  if (parentFolderId !== undefined) { // Check if parentFolderId is explicitly passed
    if (parentFolderId && parentFolderId.trim() !== '') {
      query = query.eq('parent_folder_id', parentFolderId);
    } else {
      query = query.is('parent_folder_id', null);
    }
  }

  // Name ILIKE filtering (for fetchSearchResults)
  if (searchTerm || (parentFolderId === undefined && !isGlobalFilterMode)) { // Apply search term if provided OR if not in parent folder mode and not global filter only mode
    query = query.ilike('name', `%${searchTerm || ''}%`);
  }

  // Type filtering
  if (filters.type && filters.type === 'folder') {
    // If type is 'folder', we want to see folders, so no change to query based on this.
  } else if (filters.type) {
    // If any other type (asset type) is specified, we don't want folders.
    query = query.limit(0);
  }

  query = applyDateFiltersToQuery(query, filters);

  if (filters.ownerId) {
    query = query.eq('user_id', filters.ownerId);
  }
  
  return query;
}

// Async helper specifically for fetching asset IDs based on tags
export async function getAssetIdsForTagFilter(supabase: SupabaseClient, tagIdsParam: string | null): Promise<string[] | 'no_match' | 'error' | null> {
  if (!tagIdsParam) return null;

  const tagIdsArray = tagIdsParam.split(',').map(id => id.trim()).filter(id => id);
  if (tagIdsArray.length === 0) return null;

  const { data: matchingAssetIds, error: subQueryError } = await supabase
    .from('asset_tags')
    .select('asset_id')
    .in('tag_id', tagIdsArray);

  if (subQueryError) {
    console.error('Tag filter subquery error:', subQueryError);
    return 'error';
  }
  if (matchingAssetIds && matchingAssetIds.length > 0) {
    return matchingAssetIds.map(r => r.asset_id);
  }
  return 'no_match';
}

// Synchronous helper to build the base asset query
export function buildAssetBaseQueryInternal( 
  supabase: SupabaseClient,
  activeOrgId: string,
  tagFilterResult: string[] | 'no_match' | 'error' | null,
  filters: DamFilterParameters
): any { // Returns Supabase Query Builder (any for simplicity for now)
  let query = supabase
    .from('assets')
    .select('id, name, user_id, created_at, updated_at, storage_path, mime_type, size, folder_id, organization_id, asset_tags(tags(*))')
    .eq('organization_id', activeOrgId);

  if (tagFilterResult === 'error') {
    // If tag subquery had an error, proceed without tag filtering for now
  } else if (tagFilterResult === 'no_match') {
    query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // No assets match the tag
  } else if (tagFilterResult && tagFilterResult.length > 0) {
    query = query.in('id', tagFilterResult);
  }

  if (filters.type && filters.type !== 'folder') {
    const typeMap: { [key: string]: string } = {
      'image': 'image/%',
      'video': 'video/%',
      'document': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv',
      'audio': 'audio/%',
      'archive': 'application/zip,application/x-rar-compressed,application/x-7z-compressed'
    };
    if (typeMap[filters.type]) {
      if (filters.type === 'document' || filters.type === 'archive') {
        const mimeTypes = typeMap[filters.type].split(',');
        const orConditions = mimeTypes.map(mime => `mime_type.like.${mime.trim()}`).join(',');
        query = query.or(orConditions);
      } else {
        query = query.like('mime_type', typeMap[filters.type]);
      }
    }
  } else if (filters.type === 'folder') {
    // If filtering specifically for 'folder', assets should not be returned by this query builder.
    query = query.eq('id', '00000000-0000-0000-0000-000000000000'); 
  }

  query = applyDateFiltersToQuery(query, filters);

  if (filters.ownerId) {
    query = query.eq('user_id', filters.ownerId);
  }

  if (filters.sizeOption && filters.sizeOption !== 'any') {
    switch (filters.sizeOption) {
      case 'small':
        query = query.lt('size', 1024 * 1024); // < 1MB
        break;
      case 'medium':
        query = query.gte('size', 1024 * 1024).lte('size', 10 * 1024 * 1024); // 1MB - 10MB
        break;
      case 'large':
        query = query.gte('size', 10 * 1024 * 1024).lte('size', 100 * 1024 * 1024); // 10MB - 100MB
        break;
      case 'xlarge':
        query = query.gt('size', 100 * 1024 * 1024); // > 100MB
        break;
      case 'custom':
        if (filters.sizeMin) {
          query = query.gte('size', parseInt(filters.sizeMin, 10));
        }
        if (filters.sizeMax) {
          query = query.lte('size', parseInt(filters.sizeMax, 10));
        }
        break;
    }
  }
  return query;
} 