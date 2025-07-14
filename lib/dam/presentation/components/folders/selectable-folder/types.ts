import React from 'react';
import type { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

export interface SelectableFolderProps {
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
  dragAttributes: any;
  dragListeners: any;
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