import { useGalleryData } from './state/useGalleryData';
import { useGallerySelection } from './state/useGallerySelection';
import { useGalleryBulkOperations } from './state/useGalleryBulkOperations';
import { useGalleryEventHandlers } from './handlers/useGalleryEventHandlers';
import { useGalleryStateManager } from './services/GalleryStateManager';

interface AssetGalleryStateProps {
  // Core state
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  viewMode: 'grid' | 'list';
  
  // Filtering and sorting
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
  
  // Navigation
  enableNavigation: boolean;
  onFolderNavigate?: (folderId: string | null) => void;
  
  // Multi-select functionality
  enableMultiSelect?: boolean;
  onSelectionChange?: (selectedAssets: string[], selectedFolders: string[]) => void;
}

/**
 * useAssetGalleryState - Presentation Layer Main Coordinator Hook
 * 
 * Single Responsibility: Coordinate gallery state by composing specialized hooks
 * Follows DDD principles by orchestrating domain concerns without business logic
 * 
 * Refactored from 370-line monolithic hook into modular, testable components:
 * - Data management (useGalleryData)
 * - Selection state (useGallerySelection) 
 * - Bulk operations (useGalleryBulkOperations)
 * - Event handling (useGalleryEventHandlers)
 * - Service coordination (useGalleryStateManager)
 */
export const useAssetGalleryState = (props: AssetGalleryStateProps) => {
  const { 
    currentFolderId, 
    enableMultiSelect = false, 
    enableNavigation, 
    onFolderNavigate, 
    onSelectionChange 
  } = props;

  // Initialize specialized hooks following DDD layer separation
  const galleryData = useGalleryData(props);
  
  const stateManager = useGalleryStateManager({
    currentFolderId,
    enableNavigation,
    onFolderNavigate,
    refreshGalleryData: galleryData.fetchData,
  });

  const selection = useGallerySelection({
    enableMultiSelect,
    onSelectionChange,
    activeFolderId: stateManager.activeFolderId,
  });

  const bulkOperations = useGalleryBulkOperations({
    multiSelect: selection.multiSelect,
    galleryItems: galleryData.items,
  });

  // Side effects: Event handling
  useGalleryEventHandlers({
    enableMultiSelect,
    multiSelect: selection.multiSelect,
    galleryData,
    activeFolderId: stateManager.activeFolderId,
  });

  // Compose multi-select with bulk operations
  const enhancedMultiSelect = selection.multiSelect ? {
    ...selection.multiSelect,
    handleBulkOperation: bulkOperations.handleBulkOperation,
  } : null;

  return {
    // Core state
    activeFolderId: stateManager.activeFolderId,
    selectedAssetId: selection.selectedAssetId,
    setSelectedAssetId: selection.setSelectedAssetId,
    
    // Data state
    visibleAssets: galleryData.visibleAssets,
    folders: galleryData.visibleFolders,
    items: galleryData.items,
    loading: galleryData.loading,
    isFirstLoad: galleryData.isFirstLoad,
    error: galleryData.error,
    
    // Optimistic hiding
    optimisticallyHiddenItemIds: galleryData.optimisticallyHiddenItemIds,
    addOptimisticallyHiddenItem: galleryData.addOptimisticallyHiddenItem,
    removeOptimisticallyHiddenItem: galleryData.removeOptimisticallyHiddenItem,
    clearOptimisticallyHiddenItems: galleryData.clearOptimisticallyHiddenItems,
    
    // Data operations
    refreshGalleryData: galleryData.fetchData,
    updateItems: galleryData.updateItems,
    
    // Selection and bulk operations
    multiSelect: enhancedMultiSelect,
    bulkDialogs: bulkOperations.bulkDialogs,
    closeBulkDialog: bulkOperations.closeBulkDialog,
    
    // Service integrations
    folderNavigation: stateManager.folderNavigation,
    upload: stateManager.upload,
    dialogManager: stateManager.dialogManager,
    assetItemDialogs: stateManager.assetItemDialogs,
  };
}; 