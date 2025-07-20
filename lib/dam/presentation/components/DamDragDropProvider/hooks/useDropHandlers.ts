import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDamDragAndDrop } from '../../../hooks/gallery/useDamDragAndDrop';
import { DragDropOperations } from '../services/DragDropOperations';
import type { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';

interface DragItem {
  type: 'asset' | 'folder';
  item: GalleryItemDto;
}

interface DropHandlersParams {
  activeItem: DragItem | null;
  selectedAssets: string[];
  selectedFolders: string[];
  startProcessing: () => void;
  completeDragSuccess: () => void;
  cancelDrag: () => void;
}

interface DragEndResult {
  success?: boolean;
}

interface ToastData {
  variant?: 'destructive' | 'default';
  title: string;
  description?: string;
}

/**
 * Hook for handling drag end/drop events and operations
 * 
 * Single Responsibility: Drop event handling and result processing
 */
export function useDropHandlers({
  activeItem,
  selectedAssets,
  selectedFolders,
  startProcessing,
  completeDragSuccess,
  cancelDrag
}: DropHandlersParams) {

  // Global drag and drop functionality for the entire DAM interface
  const dragAndDrop = useDamDragAndDrop({
    onItemsUpdate: () => {
      // Individual galleries will handle their own optimistic updates
      // No need to dispatch here since we do it in handleDragEnd
    },
    onToast: (toastData: ToastData) => {
      DragDropOperations.showToast({
        variant: toastData.variant === 'destructive' ? 'destructive' : undefined,
        title: toastData.title,
        description: toastData.description
      });
    },
    onRefreshData: async () => {
      DragDropOperations.refreshGlobalData();
    }
  });

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    // Get the item ID that will be optimistically hidden (asset or folder)
    // Use activeItem state if event data is not available (e.g., when cancelled)
    const activeItemType = event.active?.data?.current?.type || activeItem?.type;
    const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? 
      String(event.active.id || activeItem?.item?.id) : null;
    
    // Dispatch event with all items being processed IMMEDIATELY
    if (activeItemId && activeItemType) {
      DragDropOperations.processDragUpdate(
        activeItemId,
        activeItemType,
        selectedAssets,
        selectedFolders
      );
    }
    
    // Start processing state but keep overlay visible
    startProcessing();
    
    // Small delay to ensure optimistic hiding takes effect before calling drag handler
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Call the actual drag end handler with current selection state and active item
    const result: DragEndResult = await dragAndDrop.handleDragEnd(
      event, 
      { selectedAssets, selectedFolders }, 
      activeItem?.item
    );
    
    // Handle the result - only clear optimistic hiding if operation was successful
    if (result?.success) {
      // Successful operation - complete the drag success immediately for UI feedback
      completeDragSuccess();
      
      // For folder moves, coordinate with the folder tree refresh and React Query cache
      if (activeItemType === 'folder') {
        // Listen for tree refresh completion to avoid the flash
        const clearOptimisticState = () => {
          if (activeItemId && activeItemType) {
            DragDropOperations.processDragClear(
              activeItemId,
              activeItemType,
              selectedAssets,
              selectedFolders
            );
          }
        };

        // Set up a race between tree refresh signal and fallback timer
        let cleared = false;
        
        const treeRefreshHandler = () => {
          if (!cleared) {
            cleared = true;
            clearOptimisticState();
            window.removeEventListener('folderTreeRefreshComplete', treeRefreshHandler);
          }
        };

        // Listen for tree refresh completion
        window.addEventListener('folderTreeRefreshComplete', treeRefreshHandler);
        
        // Fallback timer in case the event doesn't fire
        setTimeout(() => {
          if (!cleared) {
            cleared = true;
            clearOptimisticState();
            window.removeEventListener('folderTreeRefreshComplete', treeRefreshHandler);
          }
        }, 1000);
      } else {
        // For assets, shorter delay is sufficient
        setTimeout(() => {
          if (activeItemId && activeItemType) {
            DragDropOperations.processDragClear(
              activeItemId,
              activeItemType,
              selectedAssets,
              selectedFolders
            );
          }
        }, 300);
      }
    } else {
      // Failed or cancelled operation - restore items immediately
      cancelDrag();
      
      // Restore the items by clearing optimistic hiding immediately
      if (activeItemId && activeItemType) {
        DragDropOperations.processDragClear(
          activeItemId,
          activeItemType,
          selectedAssets,
          selectedFolders
        );
      }
    }
  }, [
    activeItem,
    selectedAssets,
    selectedFolders,
    startProcessing,
    completeDragSuccess,
    cancelDrag,
    dragAndDrop
  ]);

  return {
    handleDragEnd
  };
} 