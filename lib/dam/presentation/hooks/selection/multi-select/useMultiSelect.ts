'use client';

import { useMultiSelectState } from './state/useMultiSelectState';
import { useMultiSelectOperations } from './operations/useMultiSelectOperations';
import { useMultiSelectEventHandlers } from './handlers/useMultiSelectEventHandlers';
import { useMultiSelectValidation } from './validation/useMultiSelectValidation';
import type { UseMultiSelectOptions, UseMultiSelectReturn } from './types'; 

/**
 * Multi-select hook - Main coordinator
 * 
 * Follows DDD principles by delegating to specialized hooks.
 * Maintains clean separation of concerns.
 */
export const useMultiSelect = (options: UseMultiSelectOptions = {}): UseMultiSelectReturn => {
  // State management
  const stateHook = useMultiSelectState(options);
  
  // Operations
  const operationsHook = useMultiSelectOperations(stateHook);
  
  // Event handling
  const eventHandlersHook = useMultiSelectEventHandlers(stateHook, operationsHook);
  
  // Validation
  const validationHook = useMultiSelectValidation(stateHook);

  return {
    // State
    selection: stateHook.selection,
    selectionMode: stateHook.selectionMode,
    isSelecting: stateHook.isSelecting,
    selectedCount: stateHook.selectedCount,
    selectedAssets: stateHook.selectedAssets,
    selectedFolders: stateHook.selectedFolders,
    
    // Mode management
    toggleSelectionMode: stateHook.toggleSelectionMode,
    enterSelectionMode: stateHook.enterSelectionMode,
    exitSelectionMode: stateHook.exitSelectionMode,
    
    // Operations
    selectItem: operationsHook.selectItem,
    selectRange: operationsHook.selectRange,
    selectAll: operationsHook.selectAll,
    selectAllFiles: operationsHook.selectAllFiles,
    selectAllFolders: operationsHook.selectAllFolders,
    clearSelection: operationsHook.clearSelection,
    toggleItem: operationsHook.toggleItem,
    
    // Validation
    isSelected: validationHook.isSelected,
    canPerformOperation: validationHook.canPerformOperation,
    getSelectionSummary: validationHook.getSelectionSummary,
    
    // Event handling
    handleKeyDown: eventHandlersHook.handleKeyDown
  };
}; 