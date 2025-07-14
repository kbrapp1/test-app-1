import { useCallback } from 'react';
import { type DragStartEvent } from '@dnd-kit/core';
import { DragDropOperations } from '../services/DragDropOperations';
import type { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface DragItem {
  type: 'asset' | 'folder';
  item: GalleryItemDto;
}

interface DragHandlersParams {
  startDrag: (item: DragItem) => void;
  selectedAssets: string[];
  selectedFolders: string[];
}

/**
 * Hook for handling drag start events and operations
 * 
 * Single Responsibility: Drag start event handling and coordination
 */
export function useDragHandlers({
  startDrag,
  selectedAssets,
  selectedFolders
}: DragHandlersParams) {

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggedItem = event.active.data.current;
    if (draggedItem && typeof draggedItem === 'object' && 'type' in draggedItem && 'item' in draggedItem) {
      startDrag(draggedItem as DragItem);
    }

    // Get current selection state from the multi-select system
    DragDropOperations.requestCurrentSelection();

    // Immediately hide items for visual feedback during drag
    setTimeout(() => {
      const activeItemType = event.active?.data?.current?.type;
      const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? 
        String(event.active.id) : null;
      
      if (activeItemId && activeItemType) {
        DragDropOperations.processDragUpdate(
          activeItemId,
          activeItemType,
          selectedAssets,
          selectedFolders
        );
      }
    }, 50); // Small delay to ensure selection state is updated
  }, [startDrag, selectedAssets, selectedFolders]);

  return {
    handleDragStart
  };
} 