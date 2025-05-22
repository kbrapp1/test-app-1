import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

import {
  applyQuickSearchLimits,
  fetchSearchResults,
} from './dam-api.helpers';

import {
  transformAndEnrichData
} from './dam-api.transformers';

import type {
  DamFilterParameters,
  DamSortParameters,
  LimitOptions,
  DataFetchingResult,
  TransformedAsset,
  TransformedFolder
} from './dam-api.types';

import { ListAssetsByFolderUseCase } from '@/lib/dam/application/use-cases/ListAssetsByFolderUseCase';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { AssetMapper } from '@/lib/dam/infrastructure/persistence/supabase/mappers/AssetMapper';
import { buildFolderBaseQueryInternal } from './dam-api.query-builders';

export type CombinedDamItem = TransformedAsset | TransformedFolder;

export async function getHandler(
  request: NextRequest,
  _user: User,
  supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  let folderId = searchParams.get('folderId');
  const searchTerm = searchParams.get('q') || '';
  const quickSearch = searchParams.get('quickSearch') === 'true';
  const limitParam = searchParams.get('limit');
  const tagIdsParam = searchParams.get('tagIds');

  if (folderId === '') {
    folderId = null;
  }

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
    let domainAssets: import('@/lib/dam/domain/entities/Asset').Asset[] = [];
    let assetsError: Error | null = null;
    let fetchedFolders: any[] | null = [];
    let foldersError: Error | null = null;

    try {
      const assetRepository = new SupabaseAssetRepository(supabase);
      const listAssetsUseCase = new ListAssetsByFolderUseCase(assetRepository);
      domainAssets = await listAssetsUseCase.execute({ folderId, organizationId: activeOrgId });
    } catch (e:any) {
      console.error('Error fetching assets via use case:', e);
      assetsError = e instanceof Error ? e : new Error('Failed to fetch assets via use case');
    }

    try {
      let foldersQuery = buildFolderBaseQueryInternal(supabase, activeOrgId, filters, { parentFolderId: folderId });
      if (filters.type && filters.type !== 'folder') {
        foldersQuery = foldersQuery.limit(0);
      }
      const localSortBy = sortParams.sortBy || 'name';
      const localSortOrderAsc = sortParams.sortOrder !== 'desc';
      if (localSortBy === 'created_at' || localSortBy === 'name' || localSortBy === 'updated_at') {
        foldersQuery = foldersQuery.order(localSortBy, { ascending: localSortOrderAsc });
      }
      const foldersResponse = await foldersQuery;
      fetchedFolders = foldersResponse.data;
      if (foldersResponse.error) {
        foldersError = new DatabaseError('Failed to fetch folders.', foldersResponse.error.message);
      }
    } catch (e: any) {
      console.error('Error fetching folders directly:', e);
      foldersError = e instanceof Error ? e : new DatabaseError('Failed to fetch folders');
    }
    
    const rawApiAssets = assetsError ? null : AssetMapper.fromDomainToRawApiArray(domainAssets);

    result = {
      assetsData: rawApiAssets,
      foldersData: fetchedFolders,
      assetsError,
      foldersError,
    };
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
  
  let combinedData: CombinedDamItem[] = [...foldersWithDetails, ...assetsWithDetails];

  if (quickSearch && typeof parsedLimit === 'number') {
    combinedData = applyQuickSearchLimits(foldersWithDetails, assetsWithDetails, parsedLimit);
  }
  
  const responseData = {
    data: combinedData || [],
    totalItems: (combinedData && typeof combinedData.length === 'number') ? combinedData.length : 0
  };

  return NextResponse.json(responseData);
}

export const GET = withErrorHandling(withAuth(getHandler)); 