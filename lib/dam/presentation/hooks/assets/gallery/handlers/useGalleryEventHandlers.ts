import { useEffect, useCallback } from 'react';

interface GalleryEventHandlersProps {
  enableMultiSelect?: boolean;
  multiSelect: any; // Multi-select hook instance
  galleryData: any; // Gallery data hook instance
  activeFolderId: string | null;
}

/**
 * useGalleryEventHandlers - Presentation Layer Event Hook
 * 
 * Single Responsibility: Handle gallery-related DOM events and window listeners
 * Follows DDD principles by focusing solely on event handling concerns
 */
export const useGalleryEventHandlers = (props: GalleryEventHandlersProps) => {
  const { enableMultiSelect, multiSelect, galleryData, activeFolderId } = props;

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

  // Listen for folder updates
  useEffect(() => {
    const handleFolderUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, folderId } = customEvent.detail;
      
      // Check if we need to refresh - either the renamed folder is in our current view
      // or we're viewing the parent folder that contains the renamed folder
      const isInCurrentView = galleryData.folders?.some((folder: any) => folder.id === folderId);
      const isCurrentFolder = activeFolderId === folderId;
      const shouldRefresh = type === 'rename' && (isInCurrentView || isCurrentFolder);
      
      if (shouldRefresh) {
        // Force refresh gallery data when folders are updated
        setTimeout(() => {
          galleryData.fetchData?.(true); // Force refresh to bypass any caching
        }, 100);
      }
    };
    
    window.addEventListener('folderUpdated', handleFolderUpdate);
    return () => window.removeEventListener('folderUpdated', handleFolderUpdate);
  }, [galleryData.fetchData, galleryData.folders, activeFolderId]);

  // Handle selection persistence during data refresh
  useEffect(() => {
    if (enableMultiSelect && galleryData.items?.length > 0) {
      // Validate current selection against new data
      const currentAssets = multiSelect?.selectedAssets || [];
      const currentFolders = multiSelect?.selectedFolders || [];
      
      const validAssets = currentAssets.filter((id: string) => 
        galleryData.items.some((item: any) => item.id === id && item.type === 'asset')
      );
      const validFolders = currentFolders.filter((id: string) => 
        galleryData.items.some((item: any) => item.id === id && item.type === 'folder')
      );
      
      // Update selection if items were removed
      if (validAssets.length !== currentAssets.length || validFolders.length !== currentFolders.length) {
        // Clear and re-select valid items
        multiSelect?.clearSelection();
        validAssets.forEach((id: string) => multiSelect?.toggleItem(id, 'asset'));
        validFolders.forEach((id: string) => multiSelect?.toggleItem(id, 'folder'));
      }
    }
  }, [galleryData.items, enableMultiSelect, multiSelect]);

  return {
    // Event handlers are side effects only, no return values needed
    // All functionality is handled through useEffect hooks
  };
}; 