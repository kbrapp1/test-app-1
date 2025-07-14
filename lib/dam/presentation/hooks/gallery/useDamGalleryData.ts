'use client';

import { useMemo } from 'react';
import { useApiQuery } from '@/lib/infrastructure/query';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

/**
 * Domain-driven hook for DAM gallery data management
 * 
 * MIGRATED TO REACT QUERY:
 * - Uses useApiQuery for folder contents
 * - Uses useSearchQuery for search functionality
 * - Automatic caching, deduplication, and error handling
 * - Organization context integration
 * - No more custom state management
 */

export interface UseDamGalleryDataProps {
  currentFolderId?: string;
  searchTerm?: string;
  tagIds?: string;
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: string;
  filterSizeMax?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UseDamGalleryDataReturn {
  items: GalleryItemDto[];
  loading: boolean;
  isFirstLoad: boolean;
  error?: string;
  fetchData: (forceRefresh?: boolean) => Promise<void>;
  // Legacy compatibility - separate assets and folders arrays
  assets: GalleryItemDto[];
  folders: GalleryItemDto[];
}

export function useDamGalleryData(props: UseDamGalleryDataProps): UseDamGalleryDataReturn {
  const {
    currentFolderId,
    searchTerm,
    tagIds,
    filterType,
    filterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    filterSizeOption,
    filterSizeMin,
    filterSizeMax,
    sortBy,
    sortOrder,
  } = props;

  // Organization context integration
  const { activeOrganizationId, isLoading: isOrgLoading } = useOrganization();

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    if (currentFolderId) params.set('folderId', currentFolderId);
    if (tagIds) params.set('tagIds', tagIds);
    if (filterType) params.set('type', filterType);
    if (filterCreationDateOption) params.set('creationDateOption', filterCreationDateOption);
    if (filterDateStart) params.set('dateStart', filterDateStart);
    if (filterDateEnd) params.set('dateEnd', filterDateEnd);
    if (filterOwnerId) params.set('ownerId', filterOwnerId);
    if (filterSizeOption) params.set('sizeOption', filterSizeOption);
    if (filterSizeMin) params.set('sizeMin', filterSizeMin);
    if (filterSizeMax) params.set('sizeMax', filterSizeMax);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    
    return params.toString();
  }, [
    currentFolderId,
    tagIds,
    filterType,
    filterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    filterSizeOption,
    filterSizeMin,
    filterSizeMax,
    sortBy,
    sortOrder,
  ]);

  // Determine if this is a search or folder browse
  const isSearch = Boolean(searchTerm?.trim());

  // Use search query for search terms (manually build URL for DAM API compatibility)
  const searchUrl = `/api/dam?${queryParams}${queryParams ? '&' : ''}q=${encodeURIComponent(searchTerm || '')}`;
  const searchQuery = useApiQuery<{ data?: { items?: GalleryItemDto[] } }>(
    ['dam-search', searchTerm || '', queryParams],
    searchUrl,
    {},
    {
      enabled: isSearch && !isOrgLoading && Boolean(activeOrganizationId),
      staleTime: 30 * 1000, // 30 seconds for search results
    }
  );

  // Use regular query for folder browsing
  const folderQuery = useApiQuery<{ data?: { items?: GalleryItemDto[] } }>(
    ['dam-gallery', currentFolderId || '', queryParams],
    `/api/dam?${queryParams}`,
    {},
    {
      enabled: !isSearch && !isOrgLoading && Boolean(activeOrganizationId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Select the appropriate query based on search state
  const activeQuery = isSearch ? searchQuery : folderQuery;

  // Transform data and states  
  // API returns { data: [...items], totalItems: number }
  const items = Array.isArray(activeQuery.data?.data) ? activeQuery.data.data : [];
  

  
  const loading = activeQuery.isLoading || isOrgLoading;
  const error = activeQuery.error 
    ? (activeQuery.error instanceof Error ? activeQuery.error.message : 'Unknown error')
    : (!activeOrganizationId && !isOrgLoading ? 'No active organization selected' : undefined);

  // Manual refresh function
  const fetchData = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      await activeQuery.refetch();
    }
  };

  // Determine if this is the first load
  const isFirstLoad = activeQuery.isLoading && !activeQuery.isFetching;

  // Legacy compatibility - separate assets and folders for existing components
  const folders = items.filter(item => item.type === 'folder');
  const assets = items.filter(item => item.type === 'asset');

  return {
    items,
    loading,
    isFirstLoad,
    error,
    fetchData,
    // Legacy compatibility
    assets,
    folders,
  };
} 
