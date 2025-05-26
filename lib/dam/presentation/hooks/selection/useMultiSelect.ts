'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Selection } from '../../../domain/entities/Selection';
import { SelectionFactory } from '../../../domain/entities/SelectionFactory';
import { SelectionOperations } from '../../../domain/services/SelectionOperations';
import { UpdateSelectionUseCase, SelectionAction } from '../../../application/use-cases/selection/UpdateSelectionUseCase';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { BulkOperationType } from '../../../domain/value-objects/BulkOperation';

export type SelectionMode = 'none' | 'single' | 'multiple';
export type ItemType = 'asset' | 'folder';

interface UseMultiSelectOptions {
  initialMode?: SelectionMode;
  maxSelection?: number;
  onSelectionChange?: (selection: Selection) => void;
  onModeChange?: (mode: SelectionMode) => void;
}

interface UseMultiSelectReturn {
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
  clearSelection: () => void;
  toggleItem: (id: string, type: ItemType) => void;
  
  // Queries
  isSelected: (id: string, type: ItemType) => boolean;
  canPerformOperation: (operation: BulkOperationType) => boolean;
  getSelectionSummary: () => { assets: number; folders: number; total: number };
  
  // Keyboard support
  handleKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => void;
}

export const useMultiSelect = (options: UseMultiSelectOptions = {}): UseMultiSelectReturn => {
  const {
    initialMode = 'none',
    maxSelection,
    onSelectionChange,
    onModeChange
  } = options;

  // State
  const [selection, setSelection] = useState<Selection>(() => 
    SelectionFactory.createEmpty().setSelectionMode(initialMode)
  );
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(initialMode);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [lastSelectedType, setLastSelectedType] = useState<ItemType | null>(null);

  // Use case instance
  const updateSelectionUseCase = useMemo(() => new UpdateSelectionUseCase(), []);

  // Derived state
  const isSelecting = selectionMode !== 'none';
  const selectedCount = selection.getSelectedCount();
  const selectedAssets = selection.getSelectedAssets();
  const selectedFolders = selection.getSelectedFolders();

  // Update selection with use case
  const updateSelection = useCallback(async (action: SelectionAction, params: any = {}) => {
    try {
      const result = await updateSelectionUseCase.execute({
        selection,
        action,
        ...params
      });

      if (result.isValid) {
        setSelection(result.selection);
        onSelectionChange?.(result.selection);
      }
    } catch (error) {
      // Selection update failed
    }
  }, [selection, updateSelectionUseCase, onSelectionChange]);

  // Mode management
  const toggleSelectionMode = useCallback(() => {
    const newMode = selectionMode === 'none' ? 'multiple' : 'none';
    setSelectionMode(newMode);
    onModeChange?.(newMode);
    
    if (newMode === 'none') {
      updateSelection('clear');
    } else {
      updateSelection('setMode', { selectionMode: newMode });
    }
  }, [selectionMode, onModeChange, updateSelection]);

  const enterSelectionMode = useCallback(() => {
    if (selectionMode === 'none') {
      setSelectionMode('multiple');
      onModeChange?.('multiple');
      updateSelection('setMode', { selectionMode: 'multiple' });
    }
  }, [selectionMode, onModeChange, updateSelection]);

  const exitSelectionMode = useCallback(() => {
    // Batch state updates to prevent rapid re-renders
    setSelectionMode('none');
    setLastSelectedId(null);
    setLastSelectedType(null);
    
    // Clear selection and notify mode change
    updateSelection('clear');
    
    // Delay mode change notification to prevent rapid state changes
    setTimeout(() => {
      onModeChange?.('none');
    }, 0);
  }, [onModeChange, updateSelection]);

  // Queries
  const isSelected = useCallback((id: string, type: ItemType): boolean => {
    return type === 'asset' 
      ? selection.isAssetSelected(id)
      : selection.isFolderSelected(id);
  }, [selection]);

  // Selection actions
  const selectItem = useCallback((id: string, type: ItemType, event?: MouseEvent | React.MouseEvent) => {
    if (!isSelecting) {
      enterSelectionMode();
    }

    // Check max selection limit
    if (maxSelection && selectedCount >= maxSelection && !isSelected(id, type)) {
      return;
    }

    const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
    const isShift = event?.shiftKey;

    if (isShift && lastSelectedId && lastSelectedType === type) {
      // Range selection - will be handled by selectRange
      return;
    }

    if (isCtrlOrCmd || selectionMode === 'multiple') {
      // Multi-select: toggle item
      updateSelection('toggle', { itemId: id, itemType: type });
    } else {
      // Single select: replace selection
      updateSelection('clear');
      updateSelection('add', { itemId: id, itemType: type });
    }

    setLastSelectedId(id);
    setLastSelectedType(type);
  }, [isSelecting, enterSelectionMode, maxSelection, selectedCount, isSelected, lastSelectedId, lastSelectedType, selectionMode, updateSelection]);

  const selectRange = useCallback((startId: string, endId: string, items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    updateSelection('range', { startId, endId, items });
  }, [isSelecting, enterSelectionMode, updateSelection]);

  const selectAll = useCallback((items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    
    // Respect max selection limit
    const itemsToSelect = maxSelection ? items.slice(0, maxSelection) : items;
    updateSelection('all', { items: itemsToSelect });
  }, [isSelecting, enterSelectionMode, maxSelection, updateSelection]);

  const clearSelection = useCallback(() => {
    // Batch state updates
    setLastSelectedId(null);
    setLastSelectedType(null);
    updateSelection('clear');
  }, [updateSelection]);

  const toggleItem = useCallback((id: string, type: ItemType) => {
    updateSelection('toggle', { itemId: id, itemType: type });
  }, [updateSelection]);

  const canPerformOperation = useCallback((operation: BulkOperationType): boolean => {
    if (!selection.hasSelection()) return false;
    
    // Tag operations only work with assets
    if ((operation === 'addTags' || operation === 'removeTags') && selectedFolders.length > 0) {
      return false;
    }
    
    return true;
  }, [selection, selectedFolders.length]);

  const getSelectionSummary = useCallback(() => ({
    assets: selectedAssets.length,
    folders: selectedFolders.length,
    total: selectedCount
  }), [selectedAssets.length, selectedFolders.length, selectedCount]);

  // Keyboard support
  const handleKeyDown = useCallback((event: KeyboardEvent | React.KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    switch (event.key) {
      case 'Escape':
        if (isSelecting) {
          exitSelectionMode();
          event.preventDefault();
        }
        break;
        
      case 'a':
      case 'A':
        if (isCtrlOrCmd && isSelecting) {
          // selectAll would need items - this should be handled by parent component
          event.preventDefault();
        }
        break;
        
      case 'd':
      case 'D':
        if (isCtrlOrCmd && isSelecting) {
          clearSelection();
          event.preventDefault();
        }
        break;
    }
  }, [isSelecting, exitSelectionMode, clearSelection]);

  // Keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    if (isSelecting) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [isSelecting, handleKeyDown]);

  return {
    // State
    selection,
    selectionMode,
    isSelecting,
    selectedCount,
    selectedAssets,
    selectedFolders,
    
    // Actions
    toggleSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectItem,
    selectRange,
    selectAll,
    clearSelection,
    toggleItem,
    
    // Queries
    isSelected,
    canPerformOperation,
    getSelectionSummary,
    
    // Keyboard support
    handleKeyDown
  };
}; 