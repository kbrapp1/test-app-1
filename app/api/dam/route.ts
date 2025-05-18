import { NextRequest, NextResponse } from 'next/server';
import { queryData } from '@/lib/supabase/db-queries';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import type { Tag } from '@/lib/actions/dam/tag.actions';

import {
  RawAssetFromApi,
  TransformedDataReturn,
  getOwnerNames,
  getAssetIdsForTagFilter,
  buildAssetBaseQueryInternal,
  transformAndEnrichData,
  applyQuickSearchLimits
} from './dam-api.helpers';

interface DataFetchingResult {
  foldersData: Omit<Folder, 'type' | 'organization_id'>[] | null;
  assetsData: RawAssetFromApi[] | null;
  foldersError: Error | null;
  assetsError: Error | null;
}

interface LimitOptions {
  quickSearch: boolean;
  parsedLimit?: number;
}

async function fetchSearchResults(
  supabase: SupabaseClient,
  activeOrgId: string,
  searchTerm: string, 
  tagIdsParam: string | null,
  limitOptions: LimitOptions
): Promise<DataFetchingResult> {
  const { quickSearch, parsedLimit } = limitOptions;

  let folderQuery = supabase
    .from('folders')
    .select('id, name, user_id, created_at, parent_folder_id')
    .eq('organization_id', activeOrgId)
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true });

  const tagFilterAssetIds = await getAssetIdsForTagFilter(supabase, tagIdsParam);
  let assetQueryBuilder = buildAssetBaseQueryInternal(supabase, activeOrgId, tagFilterAssetIds)
    .ilike('name', `%${searchTerm}%`) 
    .order('created_at', { ascending: false });

  if (quickSearch && parsedLimit) {
    folderQuery = folderQuery.limit(Math.ceil(parsedLimit / 2));
    assetQueryBuilder = assetQueryBuilder.limit(parsedLimit);
  }

  const [folderSearch, assetSearch] = await Promise.all([folderQuery, assetQueryBuilder]);

  return {
    foldersData: folderSearch.data as Omit<Folder, 'type' | 'organization_id'>[] | null,
    foldersError: folderSearch.error,
    assetsData: assetSearch.data as RawAssetFromApi[] | null,
    assetsError: assetSearch.error,
  };
}

async function fetchFolderContents(
  supabase: SupabaseClient,
  activeOrgId: string,
  folderId: string | null,
  tagIdsParam: string | null,
  limitOptions: LimitOptions
): Promise<DataFetchingResult> {
  const { quickSearch, parsedLimit } = limitOptions;

  let folderBaseQueryOptions = {
    ...(folderId && folderId.trim() !== '' 
      ? { matchColumn: 'parent_folder_id', matchValue: folderId } 
      : { isNull: 'parent_folder_id' }),
    organizationId: activeOrgId,
    orderBy: 'name',
    ascending: true,
    limit: (quickSearch && parsedLimit) ? Math.ceil(parsedLimit / 2) : undefined
  };

  const folderResult = await queryData<Omit<Folder, 'type' | 'organization_id'> >(
    supabase,
    'folders',
    'id, name, user_id, created_at, parent_folder_id',
    folderBaseQueryOptions
  );

  const tagFilterAssetIds = await getAssetIdsForTagFilter(supabase, tagIdsParam);
  let assetQueryBuilder = buildAssetBaseQueryInternal(supabase, activeOrgId, tagFilterAssetIds);

  if (folderId && folderId.trim() !== '') {
    assetQueryBuilder = assetQueryBuilder.eq('folder_id', folderId);
  } else {
    assetQueryBuilder = assetQueryBuilder.is('folder_id', null);
  }
  assetQueryBuilder = assetQueryBuilder.order('created_at', { ascending: false });

  if (quickSearch && parsedLimit) {
    assetQueryBuilder = assetQueryBuilder.limit(parsedLimit);
  }

  const assetResult = await assetQueryBuilder;

  return {
    foldersData: folderResult.data,
    foldersError: folderResult.error,
    assetsData: assetResult.data as RawAssetFromApi[] | null,
    assetsError: assetResult.error as Error | null,
  };
}

async function getHandler(
  request: NextRequest,
  user: User, 
  supabase: SupabaseClient
) {
  const url = new URL(request.url);
  const folderIdParam = url.searchParams.get('folderId');
  const searchTermParam = url.searchParams.get('q');
  const quickSearch = url.searchParams.get('quicksearch') === 'true';
  const limitParam = url.searchParams.get('limit');
  const tagIdsParam = url.searchParams.get('tagIds'); 

  let parsedLimit: number | undefined = undefined;
  if (quickSearch && limitParam) {
    const num = parseInt(limitParam, 10);
    if (!isNaN(num) && num > 0) {
      parsedLimit = Math.min(num, 20); 
    }
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    throw new ValidationError('Active organization ID not found. Cannot fetch DAM data.');
  }

  let fetchResult: DataFetchingResult;
  const limitOpts: LimitOptions = { quickSearch, parsedLimit };

  if (searchTermParam && searchTermParam.trim() !== '') {
    const trimmedSearchTerm = searchTermParam.trim();
    fetchResult = await fetchSearchResults(supabase, activeOrgId, trimmedSearchTerm, tagIdsParam, limitOpts);
  } else {
    fetchResult = await fetchFolderContents(supabase, activeOrgId, folderIdParam, tagIdsParam, limitOpts);
  }

  let { foldersData, assetsData, foldersError, assetsError } = fetchResult;

  if (foldersError) {
    throw new DatabaseError(foldersError.message || 'Failed to query folders');
  }
  if (assetsError) {
    throw new DatabaseError(assetsError.message || 'Failed to query assets');
  }

  const { foldersWithDetails, assetsWithDetails }: TransformedDataReturn = await transformAndEnrichData(
    supabase,
    activeOrgId,
    foldersData,
    assetsData
  );

  let combined: CombinedItem[] = [...foldersWithDetails, ...assetsWithDetails];

  if (quickSearch && parsedLimit && searchTermParam && searchTermParam.trim() !== '') {
    combined = applyQuickSearchLimits(foldersWithDetails, assetsWithDetails, parsedLimit);
  }

  return NextResponse.json(combined);
}

export const GET = withErrorHandling(withAuth(getHandler));

// Export getHandler for testing purposes
export { getHandler }; 