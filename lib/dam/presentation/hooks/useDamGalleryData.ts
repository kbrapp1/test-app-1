'use client';

import { useState, useEffect, useCallback } from 'react';
import { GalleryItemDto } from '../../application/use-cases/ListFolderContentsUseCase';

// Domain-driven hook interface
interface UseDamGalleryDataProps {
  currentFolderId: string | null;
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

export interface DomainGalleryState {
  items: GalleryItemDto[];
  loading: boolean;
  isFirstLoad: boolean;
  error?: string;
}

/**
 * Domain-driven hook for DAM gallery data management
 * 
 * This hook follows DDD principles:
 * - Uses domain DTOs instead of API response types
 * - Delegates to server actions that use domain use cases
 * - Maintains clean separation of concerns
 * - Provides proper error handling and loading states
 */
export function useDamGalleryData(props: UseDamGalleryDataProps) {
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

  const [state, setState] = useState<DomainGalleryState>({
    items: [],
    loading: true,
    isFirstLoad: true,
    error: undefined,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: undefined 
    }));

    try {
      // For now, we'll still use the API endpoint but with domain-aware handling
      // TODO: Replace with direct use case calls when we have client-side use case execution
      const timestamp = new Date().getTime();
      const queryTerm = searchTerm || '';
      let apiUrl = `/api/dam?folderId=${currentFolderId ?? ''}&q=${encodeURIComponent(queryTerm)}&_=${timestamp}`;
      
      // Build query parameters
      if (tagIds) apiUrl += `&tagIds=${encodeURIComponent(tagIds)}`;
      if (filterType) apiUrl += `&type=${encodeURIComponent(filterType)}`;
      if (filterCreationDateOption) apiUrl += `&creationDateOption=${encodeURIComponent(filterCreationDateOption)}`;
      if (filterDateStart) apiUrl += `&dateStart=${encodeURIComponent(filterDateStart)}`;
      if (filterDateEnd) apiUrl += `&dateEnd=${encodeURIComponent(filterDateEnd)}`;
      if (filterOwnerId) apiUrl += `&ownerId=${encodeURIComponent(filterOwnerId)}`;
      if (filterSizeOption) apiUrl += `&sizeOption=${encodeURIComponent(filterSizeOption)}`;
      if (filterSizeMin) apiUrl += `&sizeMin=${encodeURIComponent(filterSizeMin)}`;
      if (filterSizeMax) apiUrl += `&sizeMax=${encodeURIComponent(filterSizeMax)}`;
      if (sortBy) apiUrl += `&sortBy=${encodeURIComponent(sortBy)}`;
      if (sortOrder) apiUrl += `&sortOrder=${encodeURIComponent(sortOrder)}`;

      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery data: ${response.status}`);
      }
      
      const responseJson = await response.json();
      
      // Transform API response to domain DTOs
      const items: GalleryItemDto[] = (responseJson.data || []).map((item: any) => {
        if (item.type === 'folder') {
          return {
            type: 'folder' as const,
            id: item.id,
            name: item.name,
            createdAt: new Date(item.createdAt),
          };
        } else {
          return {
            type: 'asset' as const,
            id: item.id,
            name: item.name,
            createdAt: new Date(item.created_at),
            mimeType: item.mime_type,
            publicUrl: item.publicUrl,
          };
        }
      });

      setState(prev => ({
        ...prev,
        items,
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
    currentFolderId, searchTerm, tagIds, filterType, filterCreationDateOption,
    filterDateStart, filterDateEnd, filterOwnerId, filterSizeOption,
    filterSizeMin, filterSizeMax, sortBy, sortOrder 
  ]);

  // Update state setter for external manipulations (e.g., optimistic updates)
  const updateItems = useCallback((newItems: GalleryItemDto[]) => {
    setState(prev => ({ ...prev, items: newItems }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    updateItems,
    // Computed properties for UI convenience
    folders: state.items.filter(item => item.type === 'folder'),
    assets: state.items.filter(item => item.type === 'asset'),
  };
} 