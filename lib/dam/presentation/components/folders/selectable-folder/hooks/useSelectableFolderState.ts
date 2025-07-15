'use client';

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { SelectableFolderItemProps, SelectableFolderState } from '../types';

/**
 * Selectable Folder State Hook - State Management
 * 
 * Handles drag & drop functionality and derived state.
 * Follows SRP by focusing solely on state concerns.
 */
export const useSelectableFolderState = (props: SelectableFolderItemProps): SelectableFolderState => {
  const { folder, isOptimisticallyHidden } = props;

  // Drop zone functionality for receiving dragged assets and folders
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    data: { 
      type: 'folder', 
      item: folder,
      accepts: ['asset', 'folder'],
      folderId: folder.id
    }
  });

  // Drag functionality for moving this folder
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: folder.id,
    data: { type: 'folder', item: folder },
  });

  // Combine refs for both drag and drop
  const setNodeRef = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  // Style for dragging
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    willChange: isDragging ? 'transform' : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  // Derived state
  const shouldHide = isDragging || Boolean(isOptimisticallyHidden);
  
  const dragClasses = shouldHide ? 'opacity-0' : '';
  
  const dropClasses = isOver 
    ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200' 
    : '';

  return {
    // Drag & Drop state
    dragRef: setDragRef,
    dropRef: setDropRef,
    nodeRef: setNodeRef,
    dragAttributes: attributes as unknown as Record<string, unknown>,
    dragListeners: listeners as Record<string, (event: Event) => void>,
    transform,
    isDragging,
    isOver,
    style,
    
    // Derived state
    shouldHide,
    dragClasses,
    dropClasses
  };
}; 