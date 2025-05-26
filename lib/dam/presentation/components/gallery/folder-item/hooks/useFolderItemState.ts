'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface UseFolderItemStateProps {
  folder: GalleryItemDto & { type: 'folder' };
}

interface FolderItemState {
  // Drag and drop refs
  setNodeRef: (node: HTMLElement | null) => void;
  // Drag state
  attributes: any;
  listeners: any;
  transform: any;
  isDragging: boolean;
  // Drop state
  isOver: boolean;
  // Computed styles
  style: React.CSSProperties;
}

/**
 * Hook for managing folder item state
 * 
 * Single Responsibility: Drag-drop state management and style calculations
 * Encapsulates dnd-kit integration and transformation logic
 */
export function useFolderItemState({
  folder
}: UseFolderItemStateProps): FolderItemState {
  
  // Drop zone functionality for receiving dragged assets and folders
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    data: { 
      type: 'folder', 
      item: folder,
      accepts: ['asset', 'folder']
    }
  });

  // Drag functionality for moving this folder
  const { 
    attributes, 
    listeners, 
    setNodeRef: setDragRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: folder.id,
    data: { type: 'folder', item: folder },
  });

  // Combine refs for both drag and drop
  const setNodeRef = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  // Computed drag style
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    willChange: isDragging ? 'transform' : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  return {
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
    isOver,
    style
  };
} 