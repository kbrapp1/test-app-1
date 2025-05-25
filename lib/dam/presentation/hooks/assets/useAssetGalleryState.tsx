import { useState, useEffect } from 'react';
import { useDamGalleryData } from '../gallery/useDamGalleryData';
import { useFolderNavigation } from '../navigation/useFolderNavigation';
import { useAssetUpload } from './useAssetUpload';
import { useGalleryDialogs } from '../navigation/useGalleryDialogs';
import { useAssetItemDialogs } from './useAssetItemDialogs';

interface AssetGalleryStateProps {
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
  enableNavigation: boolean;
  onFolderNavigate?: (folderId: string | null) => void;
}

export const useAssetGalleryState = (props: AssetGalleryStateProps) => {
  const { currentFolderId, enableNavigation, onFolderNavigate } = props;
  
  const [optimisticallyHiddenItemId, setOptimisticallyHiddenItemId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Domain hooks - only use internal navigation if no custom handler provided
  const folderNavigation = useFolderNavigation(currentFolderId);
  const activeFolderId = (enableNavigation && !onFolderNavigate) ? folderNavigation.currentFolderId : currentFolderId;
  
  const galleryData = useDamGalleryData({ ...props, currentFolderId: activeFolderId });
  
  const upload = useAssetUpload({
    folderId: activeFolderId,
    onUploadComplete: galleryData.fetchData,
  });

  const dialogManager = useGalleryDialogs();
  const assetItemDialogs = useAssetItemDialogs();

  // Reset optimistic hiding when context changes
  useEffect(() => {
    setOptimisticallyHiddenItemId(null);
  }, [activeFolderId, props.searchTerm]);

  // Refresh on navigation changes - only for internal navigation
  useEffect(() => {
    if (enableNavigation && !onFolderNavigate && folderNavigation.currentFolderId !== null) {
      galleryData.fetchData();
    }
  }, [folderNavigation.currentFolderId, enableNavigation, onFolderNavigate, galleryData.fetchData]);

  // Listen for folder updates
  useEffect(() => {
    const handleFolderUpdate = () => galleryData.fetchData();
    window.addEventListener('folderUpdated', handleFolderUpdate);
    return () => window.removeEventListener('folderUpdated', handleFolderUpdate);
  }, [galleryData.fetchData]);

  // Filter visible items
  const visibleAssets = galleryData.assets.filter(asset => asset.id !== optimisticallyHiddenItemId);

  return {
    // State
    optimisticallyHiddenItemId,
    setOptimisticallyHiddenItemId,
    selectedAssetId,
    setSelectedAssetId,
    activeFolderId,
    
    // Data
    visibleAssets,
    folders: galleryData.folders,
    items: galleryData.items,
    loading: galleryData.loading,
    isFirstLoad: galleryData.isFirstLoad,
    error: galleryData.error,
    
    // Functions
    refreshGalleryData: galleryData.fetchData,
    updateItems: galleryData.updateItems,
    
    // Hooks
    folderNavigation,
    upload,
    dialogManager,
    assetItemDialogs,
  };
}; 
