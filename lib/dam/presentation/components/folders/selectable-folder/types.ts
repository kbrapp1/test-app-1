import React from 'react';
import { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

export interface SelectableFolderItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  onClick: () => void;
  enableNavigation: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
  // Selection props
  isSelected: boolean;
  isSelecting?: boolean;
  onSelectionChange: (selected: boolean) => void;
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