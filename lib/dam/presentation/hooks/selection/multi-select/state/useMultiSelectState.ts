'use client';

import { useState, useCallback, useMemo } from 'react';
import { Selection } from '../../../../../domain/entities/Selection';
import { SelectionFactory } from '../../../../../domain/entities/SelectionFactory';
import { UpdateSelectionUseCase, SelectionAction } from '../../../../../application/use-cases/selection/UpdateSelectionUseCase';
import type { UseMultiSelectOptions, SelectionMode, ItemType, MultiSelectState } from '../types';

/**
 * Multi-select state hook - State Management
 * 
 * Handles selection state and mode management.
 * Follows SRP by focusing solely on state concerns.
 */
export const useMultiSelectState = (options: UseMultiSelectOptions): MultiSelectState => {
  const {
    initialMode = 'none',
    onSelectionChange,
    onModeChange
  } = options;

  // Core state
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
    } catch {
      // Selection update failed - handled gracefully
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

  // Internal selection update method for operations
  const internalUpdateSelection = useCallback(async (action: SelectionAction, params: any = {}) => {
    return updateSelection(action, params);
  }, [updateSelection]);

  return {
    // State
    selection,
    selectionMode,
    isSelecting,
    selectedCount,
    selectedAssets,
    selectedFolders,
    lastSelectedId,
    lastSelectedType,
    
    // State setters
    setSelection,
    setSelectionMode,
    setLastSelectedId,
    setLastSelectedType,
    
    // Mode management
    toggleSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    
    // Options
    options,
    
    // Internal method for operations
    updateSelection: internalUpdateSelection
  };
}; 