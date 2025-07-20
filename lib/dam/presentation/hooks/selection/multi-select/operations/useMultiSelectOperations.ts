'use client';

import React, { useCallback } from 'react';
import type { MultiSelectState, ItemType } from '../types';
import type { GalleryItemDto } from '../../../../../domain/value-objects/GalleryItem';

/**
 * Multi-select operations hook - Business Operations
 * 
 * Handles all selection operations and business logic.
 * Follows SRP by focusing solely on operations.
 */
export const useMultiSelectOperations = (state: MultiSelectState) => {
  const {
    isSelecting,
    enterSelectionMode,
    selectedCount,
    options: { maxSelection },
    selectionMode,
    lastSelectedId,
    lastSelectedType,
    setLastSelectedId,
    setLastSelectedType,
    updateSelection
  } = state;

  // Check if item is selected
  const isSelected = useCallback((id: string, type: ItemType): boolean => {
    return type === 'asset' 
      ? state.selection.isAssetSelected(id)
      : state.selection.isFolderSelected(id);
  }, [state.selection]);

  // Select individual item
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
  }, [
    isSelecting, 
    enterSelectionMode, 
    maxSelection, 
    selectedCount, 
    isSelected, 
    lastSelectedId, 
    lastSelectedType, 
    selectionMode, 
    updateSelection,
    setLastSelectedId,
    setLastSelectedType
  ]);

  // Select range of items
  const selectRange = useCallback((startId: string, endId: string, items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    updateSelection('range', { startId, endId, items });
  }, [isSelecting, enterSelectionMode, updateSelection]);

  // Select all items
  const selectAll = useCallback((items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    
    // Respect max selection limit
    const itemsToSelect = maxSelection ? items.slice(0, maxSelection) : items;
    updateSelection('all', { items: itemsToSelect });
  }, [isSelecting, enterSelectionMode, maxSelection, updateSelection]);

  // Select all files (assets)
  const selectAllFiles = useCallback((items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    
    // Filter only assets and respect max selection limit
    const assetItems = items.filter(item => item.type === 'asset');
    const itemsToSelect = maxSelection ? assetItems.slice(0, maxSelection) : assetItems;
    updateSelection('allFiles', { items: itemsToSelect });
  }, [isSelecting, enterSelectionMode, maxSelection, updateSelection]);

  // Select all folders
  const selectAllFolders = useCallback((items: GalleryItemDto[]) => {
    if (!isSelecting) {
      enterSelectionMode();
    }
    
    // Filter only folders and respect max selection limit
    const folderItems = items.filter(item => item.type === 'folder');
    const itemsToSelect = maxSelection ? folderItems.slice(0, maxSelection) : folderItems;
    updateSelection('allFolders', { items: itemsToSelect });
  }, [isSelecting, enterSelectionMode, maxSelection, updateSelection]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    // Batch state updates
    setLastSelectedId(null);
    setLastSelectedType(null);
    updateSelection('clear');
  }, [updateSelection, setLastSelectedId, setLastSelectedType]);

  // Toggle single item
  const toggleItem = useCallback((id: string, type: ItemType) => {
    updateSelection('toggle', { itemId: id, itemType: type });
  }, [updateSelection]);

  return {
    selectItem,
    selectRange,
    selectAll,
    selectAllFiles,
    selectAllFolders,
    clearSelection,
    toggleItem,
    isSelected
  };
}; 