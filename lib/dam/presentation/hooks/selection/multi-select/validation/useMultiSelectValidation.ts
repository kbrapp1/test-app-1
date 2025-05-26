'use client';

import { useCallback } from 'react';
import type { MultiSelectState, ItemType } from '../types';
import type { BulkOperationType } from '../../../../../domain/value-objects/BulkOperation';

/**
 * Multi-select validation hook - Business Rules
 * 
 * Handles validation logic and business rules for selection.
 * Follows SRP by focusing solely on validation concerns.
 */
export const useMultiSelectValidation = (state: MultiSelectState) => {
  const { selection, selectedFolders, selectedAssets, selectedCount } = state;

  // Check if item is selected
  const isSelected = useCallback((id: string, type: ItemType): boolean => {
    return type === 'asset' 
      ? selection.isAssetSelected(id)
      : selection.isFolderSelected(id);
  }, [selection]);

  // Check if operation can be performed
  const canPerformOperation = useCallback((operation: BulkOperationType): boolean => {
    if (!selection.hasSelection()) return false;
    
    // Tag operations only work with assets
    if ((operation === 'addTags' || operation === 'removeTags') && selectedFolders.length > 0) {
      return false;
    }
    
    return true;
  }, [selection, selectedFolders.length]);

  // Get selection summary
  const getSelectionSummary = useCallback(() => ({
    assets: selectedAssets.length,
    folders: selectedFolders.length,
    total: selectedCount
  }), [selectedAssets.length, selectedFolders.length, selectedCount]);

  return {
    isSelected,
    canPerformOperation,
    getSelectionSummary
  };
}; 