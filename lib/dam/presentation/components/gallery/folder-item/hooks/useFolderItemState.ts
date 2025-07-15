'use client';

import React, { useState, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface FolderItemStateProps {
  folder: GalleryItemDto & { type: 'folder' };
  onFolderClick?: (folderId: string) => void;
  onFolderSelect?: (folderId: string, isShiftKey: boolean) => void;
}

interface FolderItemStateReturn {
  // Drag & Drop state
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
  listeners: Record<string, (event: Event) => void>;
  isDragging: boolean;
  isOver: boolean;
  style: React.CSSProperties;
  // UI interaction state
  isHovered: boolean;
  isPressed: boolean;
  // Event handlers
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  handleClick: (e: React.MouseEvent) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
}

/**
 * useFolderItemState - Presentation Layer State Hook
 * 
 * Single Responsibility: Manage folder item drag & drop state
 * Follows DDD principles by focusing solely on UI state concerns
 */
export const useFolderItemState = (props: FolderItemStateProps): FolderItemStateReturn => {
  const { folder, onFolderClick, onFolderSelect } = props;

  // UI interaction state
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

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

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFolderSelect) {
      onFolderSelect(folder.id, e.shiftKey);
    }
  }, [folder.id, onFolderSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFolderClick) {
      onFolderClick(folder.id);
    }
  }, [folder.id, onFolderClick]);

  return {
    setNodeRef,
    attributes: attributes as unknown as Record<string, unknown>,
    listeners: listeners as Record<string, (event: Event) => void>,
    isDragging,
    isOver,
    style,
    isHovered,
    isPressed,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
  };
}; 