import React from 'react';
import { Selection } from '../../../../domain/entities/Selection';
import { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { BulkOperationType } from '../../../../domain/value-objects/BulkOperation';

export type SelectionMode = 'none' | 'single' | 'multiple';
export type ItemType = 'asset' | 'folder';

export interface UseMultiSelectOptions {
  initialMode?: SelectionMode;
  maxSelection?: number;
  onSelectionChange?: (selection: Selection) => void;
  onModeChange?: (mode: SelectionMode) => void;
}

export interface UseMultiSelectReturn {
  // State
  selection: Selection;
  selectionMode: SelectionMode;
  isSelecting: boolean;
  selectedCount: number;
  selectedAssets: string[];
  selectedFolders: string[];
  
  // Actions
  toggleSelectionMode: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  selectItem: (id: string, type: ItemType, event?: MouseEvent | React.MouseEvent) => void;
  selectRange: (startId: string, endId: string, items: GalleryItemDto[]) => void;
  selectAll: (items: GalleryItemDto[]) => void;
  selectAllFiles: (items: GalleryItemDto[]) => void;
  selectAllFolders: (items: GalleryItemDto[]) => void;
  clearSelection: () => void;
  toggleItem: (id: string, type: ItemType) => void;
  
  // Queries
  isSelected: (id: string, type: ItemType) => boolean;
  canPerformOperation: (operation: BulkOperationType) => boolean;
  getSelectionSummary: () => { assets: number; folders: number; total: number };
  
  // Keyboard support
  handleKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => void;
}

export interface MultiSelectState {
  selection: Selection;
  selectionMode: SelectionMode;
  isSelecting: boolean;
  selectedCount: number;
  selectedAssets: string[];
  selectedFolders: string[];
  lastSelectedId: string | null;
  lastSelectedType: ItemType | null;
  
  // State setters
  setSelection: (selection: Selection) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setLastSelectedId: (id: string | null) => void;
  setLastSelectedType: (type: ItemType | null) => void;
  
  // Mode management
  toggleSelectionMode: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  
  // Options
  options: UseMultiSelectOptions;
  
  // Internal method for operations
  updateSelection: (action: any, params?: any) => Promise<void>;
} 