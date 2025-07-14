import { useState, useEffect, useCallback } from 'react';
import { useDamGalleryData } from '../../../gallery/useDamGalleryData';

interface GalleryDataProps {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  viewMode: 'grid' | 'list';
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

// interface OptimisticHidingState {
//   optimisticallyHiddenItemIds: Set<string>;
//   addOptimisticallyHiddenItem: (itemId: string) => void;
//   removeOptimisticallyHiddenItem: (itemId: string) => void;
//   clearOptimisticallyHiddenItems: () => void;
// }

/**
 * useGalleryData - Presentation Layer State Hook
 * 
 * Single Responsibility: Manage gallery data state and optimistic hiding
 * Follows DDD principles by focusing solely on data state concerns
 */
export const useGalleryData = (props: GalleryDataProps) => {
  const [optimisticallyHiddenItemIds, setOptimisticallyHiddenItemIds] = useState<Set<string>>(new Set());
  
  // Core gallery data management
  const galleryData = useDamGalleryData({
    ...props,
    currentFolderId: props.currentFolderId || undefined,
  });

  // Reset optimistic hiding when context changes
  useEffect(() => {
    setOptimisticallyHiddenItemIds(new Set());
  }, [props.currentFolderId, props.searchTerm]);

  // Optimistic hiding operations
  const addOptimisticallyHiddenItem = useCallback((itemId: string) => {
    setOptimisticallyHiddenItemIds(prev => new Set([...prev, itemId]));
  }, []);

  const removeOptimisticallyHiddenItem = useCallback((itemId: string) => {
    setOptimisticallyHiddenItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  const clearOptimisticallyHiddenItems = useCallback(() => {
    setOptimisticallyHiddenItemIds(new Set());
  }, []);

  // Filter visible items based on optimistic hiding
  const visibleAssets = galleryData.assets.filter((asset: any) => !optimisticallyHiddenItemIds.has(asset.id));
  const visibleFolders = galleryData.folders.filter((folder: any) => !optimisticallyHiddenItemIds.has(folder.id));

  return {
    // Core data
    ...galleryData,
    
    // Filtered data
    visibleAssets,
    visibleFolders,
    
    // Optimistic hiding state
    optimisticallyHiddenItemIds,
    addOptimisticallyHiddenItem,
    removeOptimisticallyHiddenItem,
    clearOptimisticallyHiddenItems,
  };
}; 