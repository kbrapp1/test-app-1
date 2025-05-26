import { useState, useEffect, useCallback } from 'react';
import { useDamGalleryData } from '../gallery/useDamGalleryData';
import { useFolderNavigation } from '../navigation/useFolderNavigation';
import { useAssetUpload } from './useAssetUpload';
import { useGalleryDialogs } from '../navigation/useGalleryDialogs';
import { useAssetItemDialogs } from './useAssetItemDialogs';
import { useMultiSelect } from '../selection/useMultiSelect';
import { BulkOperationType } from '../../../domain/value-objects/BulkOperation';
import { Selection } from '../../../domain/entities/Selection';

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
  // Multi-select props
  enableMultiSelect?: boolean;
  onSelectionChange?: (selectedAssets: string[], selectedFolders: string[]) => void;
}

interface BulkOperationDialogs {
  move: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  delete: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  tag: {
    isOpen: boolean;
    selectedAssets: string[];
    operation: 'add' | 'remove';
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  download: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
}

export const useAssetGalleryState = (props: AssetGalleryStateProps) => {
  const { currentFolderId, enableNavigation, onFolderNavigate, enableMultiSelect = false, onSelectionChange } = props;
  
  const [optimisticallyHiddenItemIds, setOptimisticallyHiddenItemIds] = useState<Set<string>>(new Set());
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  // Bulk operation dialogs state
  const [bulkDialogs, setBulkDialogs] = useState<BulkOperationDialogs>({
    move: { isOpen: false, selectedAssets: [], selectedFolders: [] },
    delete: { isOpen: false, selectedAssets: [], selectedFolders: [] },
    tag: { isOpen: false, selectedAssets: [], operation: 'add' },
    download: { isOpen: false, selectedAssets: [], selectedFolders: [] }
  });

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

  // Multi-select integration with debounced updates
  const multiSelect = useMultiSelect({
    onSelectionChange: useCallback((selection: Selection) => {
      const selectedAssets = selection.getSelectedAssets();
      const selectedFolders = selection.getSelectedFolders();
      
      // Emit selection update for drag and drop
      window.dispatchEvent(new CustomEvent('damSelectionUpdate', {
        detail: { selectedAssets, selectedFolders }
      }));
      
      onSelectionChange?.(selectedAssets, selectedFolders);
    }, [onSelectionChange])
  });

  // Reset optimistic hiding when context changes
  useEffect(() => {
    setOptimisticallyHiddenItemIds(new Set());
  }, [activeFolderId, props.searchTerm]);

  // Clear selection on folder navigation
  useEffect(() => {
    if (enableMultiSelect) {
      multiSelect.clearSelection();
    }
  }, [activeFolderId, enableMultiSelect]);

  // Auto-enter selection mode when multi-select is enabled
  useEffect(() => {
    if (enableMultiSelect && !multiSelect.isSelecting) {
      multiSelect.enterSelectionMode();
    } else if (!enableMultiSelect && multiSelect.isSelecting) {
      multiSelect.exitSelectionMode();
    }
  }, [enableMultiSelect, multiSelect.isSelecting]);

  // Refresh on navigation changes - only for internal navigation
  useEffect(() => {
    if (enableNavigation && !onFolderNavigate && folderNavigation.currentFolderId !== null) {
      galleryData.fetchData();
    }
  }, [folderNavigation.currentFolderId, enableNavigation, onFolderNavigate, galleryData.fetchData]);

  // Listen for folder updates
  useEffect(() => {
    const handleFolderUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, folderId } = customEvent.detail;
      
      // Check if we need to refresh - either the renamed folder is in our current view
      // or we're viewing the parent folder that contains the renamed folder
      const isInCurrentView = galleryData.folders.some(folder => folder.id === folderId);
      const isCurrentFolder = activeFolderId === folderId;
      const shouldRefresh = type === 'rename' && (isInCurrentView || isCurrentFolder);
      
      if (shouldRefresh) {
      // Force refresh gallery data when folders are updated
      setTimeout(() => {
        galleryData.fetchData(true); // Force refresh to bypass any caching
        }, 100);
      }
    };
    window.addEventListener('folderUpdated', handleFolderUpdate);
    return () => window.removeEventListener('folderUpdated', handleFolderUpdate);
  }, [galleryData.fetchData, galleryData.folders, activeFolderId]);

  // Listen for selection requests from drag and drop
  useEffect(() => {
    const handleGetSelection = () => {
      if (enableMultiSelect && multiSelect) {
        const selectedAssets = multiSelect.selectedAssets;
        const selectedFolders = multiSelect.selectedFolders;
        window.dispatchEvent(new CustomEvent('damSelectionUpdate', {
          detail: { selectedAssets, selectedFolders }
        }));
      }
    };
    
    const handleClearSelection = () => {
      if (enableMultiSelect && multiSelect) {
        multiSelect.clearSelection();
      }
    };

    const handleExitSelectionMode = () => {
      if (enableMultiSelect && multiSelect) {
        multiSelect.exitSelectionMode();
      }
    };
    
    window.addEventListener('damGetSelection', handleGetSelection);
    window.addEventListener('damClearSelection', handleClearSelection);
    window.addEventListener('damExitSelectionMode', handleExitSelectionMode);
    return () => {
      window.removeEventListener('damGetSelection', handleGetSelection);
      window.removeEventListener('damClearSelection', handleClearSelection);
      window.removeEventListener('damExitSelectionMode', handleExitSelectionMode);
    };
  }, [enableMultiSelect, multiSelect?.selectedAssets, multiSelect?.selectedFolders, multiSelect?.clearSelection, multiSelect?.exitSelectionMode]);

  // Handle selection persistence during data refresh
  useEffect(() => {
    if (enableMultiSelect && galleryData.items.length > 0) {
      // Validate current selection against new data
      const currentAssets = multiSelect.selectedAssets;
      const currentFolders = multiSelect.selectedFolders;
      
      const validAssets = currentAssets.filter((id: string) => 
        galleryData.items.some(item => item.id === id && item.type === 'asset')
      );
      const validFolders = currentFolders.filter((id: string) => 
        galleryData.items.some(item => item.id === id && item.type === 'folder')
      );
      
      // Update selection if items were removed
      if (validAssets.length !== currentAssets.length || validFolders.length !== currentFolders.length) {
        // Clear and re-select valid items
        multiSelect.clearSelection();
        validAssets.forEach((id: string) => multiSelect.toggleItem(id, 'asset'));
        validFolders.forEach((id: string) => multiSelect.toggleItem(id, 'folder'));
      }
    }
  }, [galleryData.items, enableMultiSelect]);

  // Bulk operation handlers
  const handleBulkOperation = (operation: BulkOperationType) => {
    const selectedAssets = multiSelect.selectedAssets;
    const selectedFolders = multiSelect.selectedFolders;
    
    // Validate tag operations - only allow when assets are selected
    if ((operation === 'addTags' || operation === 'removeTags') && selectedAssets.length === 0) {
      import('sonner').then(({ toast }) => {
        toast.error('Cannot tag folders', {
          description: 'Tags can only be applied to assets. Please select assets to add tags.'
        });
      });
      return;
    }
    
    // Get selected items with names from gallery data
    const selectedItems = galleryData.items.filter(item => 
      (item.type === 'asset' && selectedAssets.includes(item.id)) ||
      (item.type === 'folder' && selectedFolders.includes(item.id))
    ).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type as 'asset' | 'folder'
    }));

    switch (operation) {
      case 'move':
        setBulkDialogs(prev => ({
          ...prev,
          move: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
      case 'delete':
        setBulkDialogs(prev => ({
          ...prev,
          delete: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
      case 'addTags':
        setBulkDialogs(prev => ({
          ...prev,
          tag: { isOpen: true, selectedAssets, operation: 'add', selectedItems: selectedItems.filter(item => item.type === 'asset') }
        }));
        break;
      case 'removeTags':
        setBulkDialogs(prev => ({
          ...prev,
          tag: { isOpen: true, selectedAssets, operation: 'remove', selectedItems: selectedItems.filter(item => item.type === 'asset') }
        }));
        break;
      case 'download':
        setBulkDialogs(prev => ({
          ...prev,
          download: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
    }
  };

  const closeBulkDialog = (type: keyof BulkOperationDialogs) => {
    setBulkDialogs(prev => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false }
    }));
  };

  // Handle item selection with keyboard modifiers
  const handleItemSelection = (id: string, type: 'asset' | 'folder', event?: MouseEvent) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectItem(id, type, event);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (!enableMultiSelect) return;
    
    multiSelect.toggleSelectionMode();
  };

  // Helper functions for optimistic hiding
  const addOptimisticallyHiddenItem = (itemId: string) => {
    setOptimisticallyHiddenItemIds(prev => new Set([...prev, itemId]));
  };

  const removeOptimisticallyHiddenItem = (itemId: string) => {
    setOptimisticallyHiddenItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const clearOptimisticallyHiddenItems = () => {
    setOptimisticallyHiddenItemIds(new Set());
  };

  // Filter visible items
  const visibleAssets = galleryData.assets.filter(asset => !optimisticallyHiddenItemIds.has(asset.id));
  const visibleFolders = galleryData.folders.filter(folder => !optimisticallyHiddenItemIds.has(folder.id));

  return {
    // State
    optimisticallyHiddenItemIds,
    addOptimisticallyHiddenItem,
    removeOptimisticallyHiddenItem,
    clearOptimisticallyHiddenItems,
    selectedAssetId,
    setSelectedAssetId,
    activeFolderId,
    
    // Data
    visibleAssets,
    folders: visibleFolders,
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
    
    // Multi-select integration
    multiSelect: enableMultiSelect ? {
      ...multiSelect,
      handleItemSelection,
      toggleSelectionMode,
      handleBulkOperation,
    } : null,
    
    // Bulk operation dialogs
    bulkDialogs,
    closeBulkDialog,
  };
}; 
