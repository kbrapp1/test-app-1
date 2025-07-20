"use client";

import React, { useEffect } from 'react';
import { useAssetGalleryState } from '../../hooks/assets/gallery';
import { useAssetGalleryHandlers } from '../../hooks/assets/useAssetGalleryHandlers';
import { AssetGalleryRenderer } from './AssetGalleryRenderer';
import { GalleryLayout } from './GalleryLayout';
import { GalleryDialogs } from './GalleryDialogs';
import { SelectionToolbar } from '../selection/SelectionToolbar';
import { BulkOperationDialogs } from '../dialogs/BulkOperationDialogs';
import { useCacheInvalidation } from '@/lib/infrastructure/query';
import { GalleryItemDto } from '../../../domain/value-objects/GalleryItem';
import { GalleryMultiSelectState, RendererMultiSelectState } from '../../types/gallery-types';

interface AssetGalleryClientProps {
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
  enableNavigation?: boolean;
  showNavigationUI?: boolean;
  onFolderNavigate?: (folderId: string | null) => void;
  // Multi-select props
  enableMultiSelect?: boolean;
  onSelectionChange?: (selectedAssets: string[], selectedFolders: string[]) => void;
}

/**
 * AssetGalleryClient - Domain-Driven Gallery Component
 * 
 * Refactored to follow DDD best practices:
 * - Single responsibility: orchestrates gallery display
 * - Domain-focused: uses DTOs and domain entities
 * - Clean separation: extracted UI components and business logic
 * - Maintainable: ~100 lines with clear structure
 */
export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = (props) => {
  const { 
    viewMode,
    enableNavigation = false,
    showNavigationUI = true,
    onFolderNavigate,
    enableMultiSelect = true,
    onSelectionChange,
  } = props;

  // Cache invalidation hook
  const { invalidateByPattern } = useCacheInvalidation();

  // Extract state management
  const state = useAssetGalleryState({ 
    ...props, 
    enableNavigation, 
    onFolderNavigate,
    enableMultiSelect,
    onSelectionChange 
  });

  // Listen for global drag and drop events
  useEffect(() => {
    const handleDragDropUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ itemId: string; itemType: string; assetId?: string }>;
      const itemId = customEvent.detail?.itemId || customEvent.detail?.assetId;
      if (itemId) {
        // Set optimistic hiding for the dragged item (asset or folder)
        state.addOptimisticallyHiddenItem(itemId);
      }
    };

    const handleDragDropClear = (event: Event) => {
      const customEvent = event as CustomEvent<{ itemId: string; itemType: string; assetId?: string }>;
      const itemId = customEvent.detail?.itemId || customEvent.detail?.assetId;
      if (itemId) {
        // Clear optimistic hiding for this specific item
        state.removeOptimisticallyHiddenItem(itemId);
      }
    };

    const handleDataRefresh = () => {
      state.refreshGalleryData();
    };

    const handleReactQueryCacheInvalidation = (event: Event) => {
      const customEvent = event as CustomEvent<{ patterns: string[]; queries: string[] }>;
      const { patterns } = customEvent.detail || {};
      
      // Invalidate the React Query cache patterns directly
      if (patterns && patterns.length > 0) {
        patterns.forEach(pattern => {
          invalidateByPattern(pattern);
        });
      }
      
      // Also force a refetch of current query as backup
      state.refreshGalleryData(true);
    };

    window.addEventListener('damDragDropUpdate', handleDragDropUpdate);
    window.addEventListener('damDragDropClear', handleDragDropClear);
    window.addEventListener('damDataRefresh', handleDataRefresh);
    window.addEventListener('reactQueryInvalidateCache', handleReactQueryCacheInvalidation);

    return () => {
      window.removeEventListener('damDragDropUpdate', handleDragDropUpdate);
      window.removeEventListener('damDragDropClear', handleDragDropClear);
      window.removeEventListener('damDataRefresh', handleDataRefresh);
      window.removeEventListener('reactQueryInvalidateCache', handleReactQueryCacheInvalidation);
    };
  }, [state, invalidateByPattern]);
  
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'dam-gallery-invalidate') {
        invalidateByPattern('dam-assets');
        invalidateByPattern('dam-folders');
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [invalidateByPattern]);

  // Extract event handlers
  const handlers = useAssetGalleryHandlers({
    activeFolderId: state.activeFolderId,
    enableNavigation,
    items: state.items,
    folderNavigation: state.folderNavigation,
    dialogManager: state.dialogManager,
    moveDialog: state.assetItemDialogs.moveDialog,
    closeMoveDialog: state.assetItemDialogs.closeMoveDialog,
    openMoveDialog: state.assetItemDialogs.openMoveDialog,
    setSelectedAssetId: state.setSelectedAssetId,
    addOptimisticallyHiddenItem: state.addOptimisticallyHiddenItem,
    refreshGalleryData: state.refreshGalleryData,
    onFolderNavigate,
  });

  // Transform multiSelect to match GalleryLayout interface
  const multiSelectAdapter: GalleryMultiSelectState | undefined = state.multiSelect ? {
    selectedAssets: state.multiSelect.selectedAssets,
    selectedFolders: state.multiSelect.selectedFolders,
    isSelecting: state.multiSelect.isSelecting,
    selectedCount: state.multiSelect.selectedCount,
    selectItem: (id: string, type: 'asset' | 'folder') => {
      state.multiSelect?.selectItem(id, type);
    },
    toggleSelectionMode: () => {
      state.multiSelect?.toggleSelectionMode();
    },
    clearSelection: () => {
      state.multiSelect?.clearSelection();
    },
    selectAll: (items: GalleryItemDto[]) => {
      state.multiSelect?.selectAll(items);
    },
    handleSelectAllFiles: (items: GalleryItemDto[]) => {
      state.multiSelect?.handleSelectAllFiles(items);
    },
    handleSelectAllFolders: (items: GalleryItemDto[]) => {
      state.multiSelect?.handleSelectAllFolders(items);
    },
    handleBulkOperation: (operation: 'move' | 'delete' | 'download' | 'addTags') => {
      state.multiSelect?.handleBulkOperation(operation);
    }
  } : undefined;

  // Transform multiSelect to match AssetGalleryRenderer interface
  const rendererMultiSelectAdapter: RendererMultiSelectState | undefined = state.multiSelect ? {
    selectedAssets: state.multiSelect.selectedAssets,
    selectedFolders: state.multiSelect.selectedFolders,
    isSelectionMode: state.multiSelect.isSelecting,
    selectItem: (id: string, type: 'asset' | 'folder') => {
      state.multiSelect?.selectItem(id, type);
    },
    toggleSelectionMode: () => {
      state.multiSelect?.toggleSelectionMode();
    },
    clearSelection: () => {
      state.multiSelect?.clearSelection();
    }
  } : undefined;

  // Render functions
  const renderAssets = () => (
    <AssetGalleryRenderer
      viewMode={viewMode}
      folders={state.folders.filter(item => item.type === 'folder')}
      assets={state.visibleAssets.filter(item => item.type === 'asset')}
      enableNavigation={enableNavigation}
      onItemClick={handlers.handleItemClick}
      onFolderAction={state.dialogManager.openFolderAction}
      createAssetActions={handlers.createAssetActions}
      renderType="assets"
      optimisticallyHiddenItemIds={state.optimisticallyHiddenItemIds}
      // Multi-select props
      enableMultiSelect={enableMultiSelect}
      multiSelect={rendererMultiSelectAdapter}
    />
  );

  const renderFolders = () => (
    <AssetGalleryRenderer
      viewMode={viewMode}
      folders={state.folders.filter(item => item.type === 'folder')}
      assets={state.visibleAssets.filter(item => item.type === 'asset')}
      enableNavigation={enableNavigation}
      onItemClick={handlers.handleItemClick}
      onFolderAction={state.dialogManager.openFolderAction}
      createAssetActions={handlers.createAssetActions}
      renderType="folders"
      // Multi-select props
      enableMultiSelect={enableMultiSelect}
      multiSelect={rendererMultiSelectAdapter}
    />
  );

  return (
    <>
      <GalleryLayout
        loading={state.loading}
        isFirstLoad={state.isFirstLoad}
        error={state.error}
        folderNavigation={enableNavigation ? state.folderNavigation : undefined}
        showNavigationUI={showNavigationUI}
        activeFolderId={state.activeFolderId}
        upload={state.upload || undefined}
        onRefresh={state.refreshGalleryData}
        folders={state.folders.filter(item => item.type === 'folder')}
        assets={state.visibleAssets.filter(item => item.type === 'asset')}
        searchTerm={props.searchTerm}
        enableNavigation={enableNavigation}
        renderFolders={renderFolders}
        renderAssets={renderAssets}
        // Multi-select props
        enableMultiSelect={enableMultiSelect}
        multiSelect={multiSelectAdapter}
      />

      {/* Selection Toolbar */}
      {enableMultiSelect && state.multiSelect && state.multiSelect.isSelecting && (
        <SelectionToolbar
          selectedCount={state.multiSelect.selectedCount}
          totalCount={state.items.length}
          isVisible={state.multiSelect.isSelecting}
          onClearSelection={state.multiSelect.clearSelection}
          onSelectAll={() => state.multiSelect?.selectAll(state.items)}
          onSelectAllFiles={() => state.multiSelect?.handleSelectAllFiles(state.items)}
          onSelectAllFolders={() => state.multiSelect?.handleSelectAllFolders(state.items)}
          onMove={() => state.multiSelect?.handleBulkOperation('move')}
          onDelete={() => state.multiSelect?.handleBulkOperation('delete')}
          onDownload={() => state.multiSelect?.handleBulkOperation('download')}
          onAddTags={() => state.multiSelect?.handleBulkOperation('addTags')}
          selectedAssets={state.multiSelect.selectedAssets}
          selectedFolders={state.multiSelect.selectedFolders}
        />
      )}

      <GalleryDialogs
        selectedAssetId={state.selectedAssetId}
        onCloseAssetDetails={() => state.setSelectedAssetId(null)}
        onAssetUpdated={handlers.handleAssetUpdated}
        onAssetDeleted={handlers.handleAssetDeleted}
        dialogManager={state.dialogManager}
        moveDialog={state.assetItemDialogs.moveDialog}
        onCloseMoveDialog={state.assetItemDialogs.closeMoveDialog}
        _activeFolderId={state.activeFolderId}
        onMoveAssetConfirm={handlers.handleMoveAssetConfirm}
        onRenameAssetSubmit={handlers.handleRenameAssetSubmit}
        onDeleteAssetConfirm={handlers.handleDeleteAssetConfirm}
        onFolderActionComplete={() => {
          state.dialogManager.closeFolderAction();
          state.refreshGalleryData(true); // Force refresh after folder operations
        }}
        _onRefresh={state.refreshGalleryData}
      />

      {/* Bulk Operation Dialogs */}
      {enableMultiSelect && (
        <BulkOperationDialogs
          bulkDialogs={state.bulkDialogs}
          onClose={state.closeBulkDialog}
          onOperationComplete={() => {
            state.refreshGalleryData(true); // Force refresh after bulk operations
            state.multiSelect?.clearSelection();
          }}
          currentFolderId={state.activeFolderId}
        />
      )}
    </>
  );
};
