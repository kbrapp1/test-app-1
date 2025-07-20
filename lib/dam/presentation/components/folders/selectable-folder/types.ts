import React from 'react';
import type { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';

export interface SelectableFolderProps {
  folder: GalleryItemDto;
  isSelected: boolean;
  onSelect: (folderId: string) => void;
  onDoubleClick: (folderId: string) => void;
  className?: string;
  
  // Drag and drop props with proper typing
  _dragListeners?: Record<string, (event: Event) => void>;
  _dragAttributes?: Record<string, unknown>;
}

export interface SelectableFolderItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  isSelected?: boolean;
  onSelect?: (folder: GalleryItemDto) => void;
  onDoubleClick?: (folder: GalleryItemDto) => void;
  onContextMenu?: (event: React.MouseEvent, folder: GalleryItemDto) => void;
  className?: string;
  disabled?: boolean;
  showCheckbox?: boolean;
  dragListeners?: Record<string, (event: React.SyntheticEvent) => void>;
  dragAttributes?: Record<string, unknown>;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  enableNavigation?: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  isSelecting?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
}

export interface SelectableFolderState {
  // Drag & Drop state
  dragRef: (node: HTMLElement | null) => void;
  dropRef: (node: HTMLElement | null) => void;
  nodeRef: (node: HTMLElement | null) => void;
  dragAttributes: Record<string, unknown>;
  dragListeners: Record<string, (event: Event) => void>;
  transform: { x: number; y: number } | null;
  isDragging: boolean;
  isOver: boolean;
  style: React.CSSProperties;
  
  // Derived state
  shouldHide: boolean;
  dragClasses: string;
  dropClasses: string;
}

export interface FolderComponentProps extends SelectableFolderItemProps {
  state: SelectableFolderState;
} 