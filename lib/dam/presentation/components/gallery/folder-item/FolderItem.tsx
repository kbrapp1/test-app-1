'use client';

import React from 'react';
import { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { useFolderItemState } from './hooks/useFolderItemState';
import { useFolderItemActions } from './hooks/useFolderItemActions';
import { FolderItemList } from './components/FolderItemList';
import { FolderItemGrid } from './components/FolderItemGrid';

interface FolderItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  onClick: () => void;
  enableNavigation: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
  // Selection props
  isSelected?: boolean;
  isSelecting?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

/**
 * Main FolderItem component
 * 
 * Single Responsibility: Component coordination and variant selection
 * Orchestrates modular sub-components and delegates to appropriate variant
 * Follows DDD principles with clear separation of concerns
 */
export const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  onClick,
  enableNavigation,
  onAction,
  variant = 'grid',
  isOptimisticallyHidden = false,
  isSelected = false,
  isSelecting = false,
  onSelectionChange
}) => {
  // State management hook
  const {
    setNodeRef,
    attributes,
    listeners,
    isDragging,
    isOver,
    style
  } = useFolderItemState({ folder });

  // Actions management hook
  const { handleClick } = useFolderItemActions({
    isSelecting,
    isSelected,
    onSelectionChange,
    onClick
  });

  // Common props for both variants
  const commonProps = {
    folder,
    isDragging,
    isOptimisticallyHidden,
    isSelected,
    isSelecting,
    isOver,
    onClick: handleClick,
    setNodeRef,
    attributes,
    style,
    listeners,
    onAction,
    enableNavigation
  };

  // Delegate to appropriate variant component
  if (variant === 'list') {
    return <FolderItemList {...commonProps} />;
  }

  return <FolderItemGrid {...commonProps} />;
}; 