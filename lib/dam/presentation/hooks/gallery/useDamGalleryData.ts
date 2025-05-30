'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { 
  GalleryDataService,
  UseDamGalleryDataProps,
  DomainGalleryState,
  UseDamGalleryDataReturn,
  GalleryDataParams
} from '../services';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

/**
 * Domain-driven hook for DAM gallery data management
 * 
 * SIMPLIFIED ARCHITECTURE:
 * - Single effect for data fetching
 * - Proper organization context integration
 * - Clean error handling without timeouts
 * - Eliminates race conditions
 * - Memoized params to prevent excessive re-renders
 * - Request deduplication for development mode
 */
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

  // State management
  const [state, setState] = useState<DomainGalleryState>({
    items: [],
    loading: true,
    isFirstLoad: true,
    error: undefined,
  });

  // Memoize params to prevent unnecessary effect triggers
  const params = useMemo((): GalleryDataParams => ({
    currentFolderId,
    searchTerm,
    tagIds: tagIds?.split(',').filter(id => id.trim()) || [],
    filterType,
    filterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    filterSizeOption,
    filterSizeMin: filterSizeMin ? parseFloat(filterSizeMin) : undefined,
    filterSizeMax: filterSizeMax ? parseFloat(filterSizeMax) : undefined,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc' | undefined,
  }), [
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
  ]);

  // Single effect for data fetching with organization context
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Handle organization still loading
      if (isOrgLoading) {
        return;
      }

      // Handle no active organization
      if (!activeOrganizationId) {
        if (isMounted) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            isFirstLoad: false,
            items: [],
            error: 'No active organization selected'
          }));
        }
        return;
      }

      // Start loading
      if (isMounted) {
        setState(prev => ({ 
          ...prev, 
          loading: true, 
          error: undefined
        }));
      }

      try {
        const galleryDataService = new GalleryDataService();
        const result = await galleryDataService.fetchGalleryData(params, false);
        
        if (!isMounted) {
          return; // Component unmounted
        }

        if (!result.success) {
          setState(prev => ({
            ...prev,
            loading: false,
            isFirstLoad: false,
            error: result.error || 'Failed to fetch gallery data'
          }));
          return;
        }

        const items = result.data?.items || [];

        setState(prev => ({
          ...prev,
          items: items,
          loading: false,
          isFirstLoad: false,
          error: undefined,
        }));

      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            items: [],
            loading: false,
            isFirstLoad: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    // Simplified dependencies using memoized params
    activeOrganizationId,
    isOrgLoading,
    params
  ]);

  // Manual refresh function
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (isOrgLoading || !activeOrganizationId) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: undefined,
      ...(forceRefresh && { items: [] })
    }));

    try {
      const galleryDataService = new GalleryDataService();
      const result = await galleryDataService.fetchGalleryData(params, forceRefresh);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch gallery data'
        }));
        return;
      }

      const items = result.data?.items || [];

      setState(prev => ({
        ...prev,
        items: items,
        loading: false,
        error: undefined,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        items: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [activeOrganizationId, isOrgLoading, params]);

  // Update state setter for external manipulations
  const updateItems = useCallback((newItems: GalleryItemDto[]) => {
    setState(prev => ({ ...prev, items: newItems }));
  }, []);

  // Computed properties for UI convenience
  const folders = state.items.filter(item => item.type === 'folder') as (GalleryItemDto & { type: 'folder' })[];
  const assets = state.items.filter(item => item.type === 'asset') as (GalleryItemDto & { type: 'asset' })[];

  return {
    ...state,
    fetchData,
    updateItems,
    folders,
    assets,
  };
} 
