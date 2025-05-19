import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { CombinedItem } from '@/types/dam';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

import {
  applyQuickSearchLimits,
  fetchSearchResults,
  fetchFolderContents,
} from './dam-api.helpers';

import {
  transformAndEnrichData
} from './dam-api.transformers';

import type {
  DamFilterParameters,
  DamSortParameters,
  LimitOptions,
  DataFetchingResult
} from './dam-api.types';

export async function getHandler(
  request: NextRequest,
  _user: User,
  supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  const searchTerm = searchParams.get('q') || '';
  const quickSearch = searchParams.get('quickSearch') === 'true';
  const limitParam = searchParams.get('limit');
  const tagIdsParam = searchParams.get('tagIds');

  const filters: DamFilterParameters = {
    type: searchParams.get('type'),
    creationDateOption: searchParams.get('creationDateOption'),
    dateStart: searchParams.get('dateStart'),
    dateEnd: searchParams.get('dateEnd'),
    ownerId: searchParams.get('ownerId'),
    sizeOption: searchParams.get('sizeOption'),
    sizeMin: searchParams.get('sizeMin'),
    sizeMax: searchParams.get('sizeMax'),
  };

  const sortParams: DamSortParameters = {
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | null,
  };

  const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
  const limitOptions: LimitOptions = { quickSearch, parsedLimit };

  if (limitParam && (Number.isNaN(parsedLimit) || (parsedLimit !== undefined && parsedLimit < 0))) {
    throw new ValidationError('Invalid limit parameter. Limit must be a non-negative number.');
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    throw new DatabaseError('Active organization not found');
  }
  
  let result: DataFetchingResult;
  const isGlobalFilterWithoutSearchOrFolder = 
    !searchTerm && 
    (!folderId || folderId.trim() === '') && 
    !!(filters.type || filters.creationDateOption || filters.ownerId || filters.sizeOption || tagIdsParam);

  if (searchTerm) { 
    result = await fetchSearchResults(supabase, activeOrgId, searchTerm, tagIdsParam, filters, sortParams, limitOptions);
  } else if (isGlobalFilterWithoutSearchOrFolder) {
    result = await fetchSearchResults(supabase, activeOrgId, '', tagIdsParam, filters, sortParams, limitOptions, true);
  } else {
    result = await fetchFolderContents(supabase, activeOrgId, folderId, tagIdsParam, filters, sortParams, limitOptions);
  }

  if (result.foldersError || result.assetsError) {
    const errorToLog = result.foldersError || result.assetsError;
    console.error('Error fetching DAM data:', errorToLog);
    throw new DatabaseError('Failed to fetch DAM resources.', errorToLog ? errorToLog.message : undefined);
  }

  const { foldersWithDetails, assetsWithDetails } = await transformAndEnrichData(
    supabase, 
    activeOrgId, 
    result.foldersData,
    result.assetsData
  );
  
  let combinedData: CombinedItem[] = [...foldersWithDetails, ...assetsWithDetails];

  if (quickSearch && typeof parsedLimit === 'number') {
    combinedData = applyQuickSearchLimits(foldersWithDetails, assetsWithDetails, parsedLimit);
  } else if (quickSearch && parsedLimit === undefined) {
    // If quickSearch is true but no limit is specified, default to applying some limit or decide behavior.
    // For now, let's assume if limit is not given with quicksearch, we don't apply specific quicksearch limit logic here,
    // and rely on limits applied within fetchSearchResults/fetchFolderContents if any.
    // Or, apply a default limit for quicksearch if desired.
    // This else-if can be refined based on desired quicksearch behavior without limit.
  }
  
  const responseData = {
    data: combinedData || [],
    totalItems: (combinedData && typeof combinedData.length === 'number') ? combinedData.length : 0
  };

  return NextResponse.json(responseData);
}

export const GET = withErrorHandling(withAuth(getHandler)); 