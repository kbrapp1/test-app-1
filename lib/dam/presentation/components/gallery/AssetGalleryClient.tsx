"use client";

import React, { useEffect } from 'react';
import { useAssetGalleryState } from '../../hooks/assets/useAssetGalleryState';
import { useAssetGalleryHandlers } from '../../hooks/assets/useAssetGalleryHandlers';
import { AssetGalleryRenderer } from './AssetGalleryRenderer';
import { GalleryLayout } from './GalleryLayout';
import { GalleryDialogs } from './GalleryDialogs';

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
  } = props;

  // Extract state management
  const state = useAssetGalleryState({ ...props, enableNavigation, onFolderNavigate });

  // Listen for global drag and drop events
  useEffect(() => {
    const handleDragDropUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ itemId: string; itemType: string; assetId?: string }>;
      const itemId = customEvent.detail?.itemId || customEvent.detail?.assetId;
      if (itemId) {
        // Set optimistic hiding for the dragged item (asset or folder)
        state.setOptimisticallyHiddenItemId(itemId);
      }
    };

    const handleDragDropClear = (event: Event) => {
      const customEvent = event as CustomEvent<{ itemId: string; itemType: string; assetId?: string }>;
      const itemId = customEvent.detail?.itemId || customEvent.detail?.assetId;
      if (itemId) {
        // Clear optimistic hiding
        state.setOptimisticallyHiddenItemId(null);
      }
    };

    const handleDataRefresh = () => {
      state.refreshGalleryData();
    };

    window.addEventListener('damDragDropUpdate', handleDragDropUpdate);
    window.addEventListener('damDragDropClear', handleDragDropClear);
    window.addEventListener('damDataRefresh', handleDataRefresh);

    return () => {
      window.removeEventListener('damDragDropUpdate', handleDragDropUpdate);
      window.removeEventListener('damDragDropClear', handleDragDropClear);
      window.removeEventListener('damDataRefresh', handleDataRefresh);
    };
  }, [state.setOptimisticallyHiddenItemId, state.refreshGalleryData]);
  
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
    setOptimisticallyHiddenItemId: state.setOptimisticallyHiddenItemId,
    updateItems: state.updateItems,
    refreshGalleryData: state.refreshGalleryData,
    onFolderNavigate,
  });

  // Render functions
  const renderAssets = () => (
    <AssetGalleryRenderer
      viewMode={viewMode}
      folders={state.folders}
      assets={state.visibleAssets}
      enableNavigation={enableNavigation}
      onItemClick={handlers.handleItemClick}
      onFolderAction={state.dialogManager.openFolderAction}
      createAssetActions={handlers.createAssetActions}
      renderType="assets"
      optimisticallyHiddenItemId={state.optimisticallyHiddenItemId}
    />
  );

  const renderFolders = () => (
    <AssetGalleryRenderer
      viewMode={viewMode}
      folders={state.folders}
      assets={state.visibleAssets}
      enableNavigation={enableNavigation}
      onItemClick={handlers.handleItemClick}
      onFolderAction={state.dialogManager.openFolderAction}
      createAssetActions={handlers.createAssetActions}
      renderType="folders"
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
        upload={state.upload}
        onRefresh={state.refreshGalleryData}
        folders={state.folders}
        assets={state.visibleAssets}
        searchTerm={props.searchTerm}
                    enableNavigation={enableNavigation}
        renderFolders={renderFolders}
        renderAssets={renderAssets}
      />

      <GalleryDialogs
        selectedAssetId={state.selectedAssetId}
        onCloseAssetDetails={() => state.setSelectedAssetId(null)}
        onAssetUpdated={handlers.handleAssetUpdated}
        onAssetDeleted={handlers.handleAssetDeleted}
        dialogManager={state.dialogManager}
        moveDialog={state.assetItemDialogs.moveDialog}
        activeFolderId={state.activeFolderId}
        onMoveAssetConfirm={handlers.handleMoveAssetConfirm}
        onRenameAssetSubmit={handlers.handleRenameAssetSubmit}
        onDeleteAssetConfirm={handlers.handleDeleteAssetConfirm}
        onFolderActionComplete={() => {
          state.dialogManager.closeFolderAction();
          state.refreshGalleryData();
        }}
        onRefresh={state.refreshGalleryData}
      />
    </>
  );
};
