'use client';

import { useState, useEffect, useCallback } from 'react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { 
  GalleryDataService,
  UseDamGalleryDataProps,
  DomainGalleryState,
  UseDamGalleryDataReturn,
  GalleryDataParams
} from '../services';

/**
 * Domain-driven hook for DAM gallery data management
 * 
 * REFACTORED TO DDD ARCHITECTURE:
 * - Uses dedicated service for data fetching logic
 * - Maintains clean separation of concerns with DDD layers
 * - Focuses solely on state coordination and React lifecycle
 * - Provides proper error handling and loading states
 * - Follows single responsibility principle
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

  // State management
  const [state, setState] = useState<DomainGalleryState>({
    items: [],
    loading: true,
    isFirstLoad: true,
    error: undefined,
  });

  // Fetch data using the service
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: undefined,
      // Clear items when force refreshing to ensure fresh data
      ...(forceRefresh && { items: [] })
    }));

    try {
      const params: GalleryDataParams = {
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
      };

      // Create service instance inside the callback to avoid dependency issues
      const galleryDataService = new GalleryDataService();
      const result = await galleryDataService.fetchGalleryData(params, forceRefresh);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch gallery data');
      }

      setState(prev => ({
        ...prev,
        items: result.data?.items || [],
        loading: false,
        isFirstLoad: false,
        error: undefined,
      }));

    } catch (error) {
      console.error('Error fetching DAM gallery data:', error);
      setState(prev => ({
        ...prev,
        items: [],
        loading: false,
        isFirstLoad: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [
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

  // Update state setter for external manipulations (e.g., optimistic updates)
  const updateItems = useCallback((newItems: GalleryItemDto[]) => {
    setState(prev => ({ ...prev, items: newItems }));
  }, []);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
