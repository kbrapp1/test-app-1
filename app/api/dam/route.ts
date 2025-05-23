import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// import {
//   applyQuickSearchLimits, // Now local: applyQuickSearchLimitsLocal
//   fetchSearchResults, 
// } from './dam-api.helpers'; // File removed

// import {
//   transformAndEnrichData // Removed as logic is now local
// } from './dam-api.transformers';

import type {
  DataFetchingResult,
  TransformedAsset,
  TransformedFolder
} from './dam-api.types';
import type { DamFilterParameters, DamSortParameters, LimitOptions, AssetSearchCriteria, FolderSearchCriteria } from '@/lib/dam/application/dto/SearchCriteriaDTO';

import { ListAssetsByFolderUseCase } from '@/lib/dam/application/use-cases/ListAssetsByFolderUseCase';
import { SearchDamItemsUseCase, SearchDamItemsResult } from '@/lib/dam/application/use-cases/SearchDamItemsUseCase';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { AssetMapper } from '@/lib/dam/infrastructure/persistence/supabase/mappers/AssetMapper';

import { ListFoldersUseCase } from '@/lib/dam/application/use-cases/ListFoldersUseCase';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { FolderMapper } from '@/lib/dam/infrastructure/persistence/supabase/mappers/FolderMapper';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';
import { Asset as DomainAsset } from '@/lib/dam/domain/entities/Asset';

// --- Start: Local Utilities from dam-api.helpers.ts ---
function applyQuickSearchLimitsLocal(
  foldersWithDetails: TransformedFolder[], // Adjusted type
  assetsWithDetails: TransformedAsset[],   // Adjusted type
  limit: number
): (TransformedFolder | TransformedAsset)[] { // Adjusted return type
  const combined: (TransformedFolder | TransformedAsset)[] = [];
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
// --- End: Local Utilities from dam-api.helpers.ts ---

// --- Start: New Local DTO Mapping Utilities ---
async function getOwnerNamesMap(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
  if (error) {
    console.error('Error fetching owner profiles for DTO mapping:', error.message);
    return new Map();
  }
  const ownerMap = new Map<string, string>();
  profiles?.forEach(p => { if (p.full_name) ownerMap.set(p.id, p.full_name); });
  return ownerMap;
}

async function getParentFolderNamesMap(supabase: SupabaseClient, folderIds: string[], organizationId: string): Promise<Map<string, string>> {
  if (folderIds.length === 0) return new Map();
  const { data: folders, error } = await supabase
    .from('folders')
    .select('id, name')
    .in('id', folderIds)
    .eq('organization_id', organizationId);
  if (error) {
    console.error('Error fetching parent folder names for DTO mapping:', error.message);
    return new Map();
  }
  const folderNameMap = new Map<string, string>();
  folders?.forEach(f => folderNameMap.set(f.id, f.name));
  return folderNameMap;
}

interface MapDomainToApiDtoParams {
  supabase: SupabaseClient;
  activeOrgId: string;
  domainAssets: DomainAsset[];
  domainFolders: DomainFolder[];
}

interface MappedApiDtos {
  assetsWithDetails: TransformedAsset[];
  foldersWithDetails: TransformedFolder[];
}

async function mapDomainEntitiesToApiDtos({
  supabase,
  activeOrgId,
  domainAssets,
  domainFolders,
}: MapDomainToApiDtoParams): Promise<MappedApiDtos> {
  const allUserIds = new Set<string>();
  const allParentFolderIds = new Set<string>();

  domainFolders.forEach(f => allUserIds.add(f.userId));
  domainAssets.forEach(a => {
    allUserIds.add(a.userId);
    if (a.folderId) allParentFolderIds.add(a.folderId);
  });

  const ownerNamesMap = await getOwnerNamesMap(supabase, Array.from(allUserIds));
  const parentFolderNamesMap = await getParentFolderNamesMap(supabase, Array.from(allParentFolderIds), activeOrgId);

  const assetsWithDetails: TransformedAsset[] = domainAssets.map(asset => ({
    id: asset.id,
    name: asset.name,
    user_id: asset.userId,
    created_at: asset.createdAt.toISOString(),
    updated_at: asset.updatedAt?.toISOString() || null,
    storage_path: asset.storagePath,
    mime_type: asset.mimeType,
    size: asset.size,
    folder_id: asset.folderId === undefined ? null : asset.folderId,
    organization_id: asset.organizationId,
    type: 'asset',
    publicUrl: asset.publicUrl || null,
    parentFolderName: asset.folderId ? (parentFolderNamesMap.get(asset.folderId) || 'Unknown Folder') : 'Root',
    ownerName: ownerNamesMap.get(asset.userId) || 'Unknown Owner',
    tags: asset.tags?.map(tag => tag.toPlainObject()) || [], 
  }));

  const foldersWithDetails: TransformedFolder[] = domainFolders.map(folder => ({
    id: folder.id,
    name: folder.name,
    userId: folder.userId,
    createdAt: folder.createdAt, // TransformedFolder expects Date
    updatedAt: folder.updatedAt, // TransformedFolder expects Date | undefined
    parentFolderId: folder.parentFolderId,
    organizationId: folder.organizationId,
    has_children: folder.has_children || false,
    type: 'folder',
    ownerName: ownerNamesMap.get(folder.userId) || 'Unknown Owner',
  }));

  return { assetsWithDetails, foldersWithDetails };
}
// --- End: New Local DTO Mapping Utilities ---

export type CombinedDamItem = TransformedAsset | TransformedFolder;

export async function getHandler(
  request: NextRequest,
  _user: User,
  supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  let currentFolderId = searchParams.get('folderId');
  const searchTerm = searchParams.get('q') || '';
  const quickSearch = searchParams.get('quickSearch') === 'true';
  const limitParam = searchParams.get('limit');
  const tagIdsParam = searchParams.get('tagIds');
  const tagIdsArray = tagIdsParam?.split(',').map(id => id.trim()).filter(id => id);

  if (currentFolderId === '') {
    currentFolderId = null;
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
  
  let finalDomainAssets: DomainAsset[] = [];
  let finalDomainFolders: DomainFolder[] = [];
  let operationError: Error | null = null;

  const hasSearchTerm = !!searchTerm && searchTerm.trim() !== '';
  const isGlobalFilterWithoutSearchOrFolder = 
    !hasSearchTerm && 
    (!currentFolderId || currentFolderId.trim() === '') && 
    !!(tagIdsParam);

  if (hasSearchTerm || isGlobalFilterWithoutSearchOrFolder) {
    try {
      const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);
      const searchUseCase = new SearchDamItemsUseCase(assetRepository, folderRepository);
      
      const searchParamsObj: Parameters<SearchDamItemsUseCase['execute']>[0] = {
        organizationId: activeOrgId,
        searchTerm: searchTerm || undefined,
        tagIds: tagIdsArray,
        filters,
        sortParams,
        limitOptions,
        currentFolderIdForContext: currentFolderId,
      };

      const searchResult: SearchDamItemsResult = await searchUseCase.execute(searchParamsObj);
      finalDomainAssets = searchResult.assets;
      finalDomainFolders = searchResult.folders;
    } catch (e: any) {
      console.error('Error during search via use case:', e);
      operationError = e instanceof Error ? e : new DatabaseError('Failed to execute search');
    }
  } else {
    try {
      const assetRepository = new SupabaseAssetRepository(supabase);
      const listAssetsUseCase = new ListAssetsByFolderUseCase(assetRepository);
      finalDomainAssets = await listAssetsUseCase.execute({
        folderId: currentFolderId, 
        organizationId: activeOrgId,
        sortParams,
        filters,
      });
      
      // Only fetch folders if filters don't exclude them
      // Always show folders at root level for navigation, regardless of filters
      // Only exclude folders for filters that are truly incompatible with folders (size, tags) when in subfolders
      const isAtRootLevel = !currentFolderId || currentFolderId.trim() === '';
      const shouldFetchFolders = isAtRootLevel || (
        !filters.sizeOption &&
        !filters.sizeMin && 
        !filters.sizeMax &&
        (!tagIdsArray || tagIdsArray.length === 0)
      );
      
      if (shouldFetchFolders) {
        const folderRepository = new SupabaseFolderRepository(supabase);
        const listFoldersUseCase = new ListFoldersUseCase(folderRepository);
        
        // Don't pass type filter to folders since folders shouldn't be filtered by content type
        // Also don't pass owner filter when at root level to maintain navigation
        const folderFilters = { ...filters };
        delete folderFilters.type;
        if (isAtRootLevel) {
          delete folderFilters.ownerId;
        }
        
        finalDomainFolders = await listFoldersUseCase.execute({
          parentId: currentFolderId,
          organizationId: activeOrgId,
          sortParams,
          filters: folderFilters,
        });
      } else {
        // Filters exclude folders, so return empty array
        finalDomainFolders = [];
      }
    } catch (e: any) {
      console.error('Error during list via use case:', e);
      operationError = e instanceof Error ? e : new DatabaseError('Failed to list items');
    }
  }

  if (operationError) {
    console.error('Error fetching DAM data before transformation:', operationError);
    throw new DatabaseError('Failed to fetch DAM resources.', operationError.message);
  }

  const { assetsWithDetails, foldersWithDetails } = await mapDomainEntitiesToApiDtos({
    supabase,
    activeOrgId,
    domainAssets: finalDomainAssets,
    domainFolders: finalDomainFolders,
  });
  
  // Combine folders and assets into a single array
  let combinedData: CombinedDamItem[] = [...foldersWithDetails, ...assetsWithDetails];

  // Apply sorting to the combined array based on sortParams
  if (sortParams?.sortBy && sortParams?.sortOrder) {
    combinedData.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortParams.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'updated_at':
          // For folders, use updatedAt (Date), for assets, use updated_at (string)
          aValue = a.type === 'folder' ? (a as TransformedFolder).updatedAt : (a as TransformedAsset).updated_at;
          bValue = b.type === 'folder' ? (b as TransformedFolder).updatedAt : (b as TransformedAsset).updated_at;
          // Convert to Date objects for comparison
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
          break;
        case 'size':
          // Only assets have size, folders should be treated as 0 or put at the end/beginning
          aValue = a.type === 'asset' ? (a as TransformedAsset).size : 0;
          bValue = b.type === 'asset' ? (b as TransformedAsset).size : 0;
          break;
        case 'mime_type':
          // Only assets have mime_type, folders should be treated as empty string or put at the end/beginning  
          aValue = a.type === 'asset' ? (a as TransformedAsset).mime_type : '';
          bValue = b.type === 'asset' ? (b as TransformedAsset).mime_type : '';
          break;
        default:
          // Default to name sorting
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortParams.sortOrder === 'asc' ? -1 : 1;
      if (bValue == null) return sortParams.sortOrder === 'asc' ? 1 : -1;

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      // Apply sort order
      return sortParams.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  if (quickSearch && typeof parsedLimit === 'number' && parsedLimit > 0 && !hasSearchTerm) {
    // Only apply quick search limits if there's no search term (universal search should show all results)
    combinedData = applyQuickSearchLimitsLocal(foldersWithDetails, assetsWithDetails, parsedLimit);
  }
  
  const responseData = {
    data: combinedData || [],
    totalItems: (combinedData && typeof combinedData.length === 'number') ? combinedData.length : 0
  };

  return NextResponse.json(responseData);
}

export const GET = withErrorHandling(withAuth(getHandler)); 