import { useCallback } from 'react';
import { useDamDragAndDrop } from '../../../hooks/gallery/useDamDragAndDrop';
import { DragDropOperations } from '../services/DragDropOperations';

interface DropHandlersParams {
  activeItem: any | null;
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

  const handleDragEnd = useCallback(async (event: any) => {
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
      activeItem
    );
    
    // Handle the result - only clear optimistic hiding if operation was successful
    if (result?.success) {
      // Successful operation - keep items hidden and clear after delay
      setTimeout(() => {
        completeDragSuccess();
        
        // Clear the global optimistic state for all items
        if (activeItemId && activeItemType) {
          DragDropOperations.processDragClear(
            activeItemId,
            activeItemType,
            selectedAssets,
            selectedFolders
          );
        }
      }, 400); // Slightly longer delay for folders
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