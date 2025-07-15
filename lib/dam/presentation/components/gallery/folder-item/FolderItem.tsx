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
  onAction: _onAction,
  variant = 'grid',
  isOptimisticallyHidden: _isOptimisticallyHidden = false,
  isSelected = false,
  isSelecting = false,
  onSelectionChange
}) => {
  // State management hook
  const {
    setNodeRef: _setNodeRef,
    attributes: _attributes,
    listeners: _listeners,
    isDragging: _isDragging,
    isOver: _isOver,
    style: _style
  } = useFolderItemState({ folder });

  // Actions management hook
  const { handleClick: _handleClick } = useFolderItemActions({
    isSelecting,
    isSelected,
    onSelectionChange,
    onClick
  });

  // Extract onClick handlers from complex commonProps
  const onFolderClick = (_folderId: string) => {
    if (enableNavigation) {
      onClick();
    }
  };

  const onFolderSelect = (_folderId: string, _isShiftKey: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(!isSelected);
    }
  };

  // Simple props for variant components
  const variantProps = {
    folder,
    onFolderClick,
    onFolderSelect
  };

  // Delegate to appropriate variant component
  if (variant === 'list') {
    return <FolderItemList {...variantProps} />;
  }

  return <FolderItemGrid {...variantProps} />;
}; 