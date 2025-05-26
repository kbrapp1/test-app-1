import { useState, useEffect, useCallback } from 'react';
import { useMultiSelect } from '../../../selection/useMultiSelect';
import { Selection } from '../../../../../domain/entities/Selection';

interface GallerySelectionProps {
  enableMultiSelect?: boolean;
  onSelectionChange?: (selectedAssets: string[], selectedFolders: string[]) => void;
  activeFolderId: string | null;
}

/**
 * useGallerySelection - Presentation Layer State Hook
 * 
 * Single Responsibility: Manage gallery selection state and multi-select behavior
 * Follows DDD principles by focusing solely on selection concerns
 */
export const useGallerySelection = (props: GallerySelectionProps) => {
  const { enableMultiSelect = false, onSelectionChange, activeFolderId } = props;
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Multi-select integration with debounced updates
  const multiSelect = useMultiSelect({
    onSelectionChange: useCallback((selection: Selection) => {
      const selectedAssets = selection.getSelectedAssets();
      const selectedFolders = selection.getSelectedFolders();
      
      // Emit selection update for drag and drop
      window.dispatchEvent(new CustomEvent('damSelectionUpdate', {
        detail: { selectedAssets, selectedFolders }
      }));
      
      onSelectionChange?.(selectedAssets, selectedFolders);
    }, [onSelectionChange])
  });

  // Clear selection on folder navigation
  useEffect(() => {
    if (enableMultiSelect) {
      multiSelect.clearSelection();
    }
  }, [activeFolderId, enableMultiSelect]);

  // Auto-enter selection mode when multi-select is enabled
  useEffect(() => {
    if (enableMultiSelect && !multiSelect.isSelecting) {
      multiSelect.enterSelectionMode();
    } else if (!enableMultiSelect && multiSelect.isSelecting) {
      multiSelect.exitSelectionMode();
    }
  }, [enableMultiSelect, multiSelect.isSelecting]);

  // Handle item selection with keyboard modifiers
  const handleItemSelection = useCallback((id: string, type: 'asset' | 'folder', event?: MouseEvent) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectItem(id, type, event);
  }, [enableMultiSelect, multiSelect]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    if (!enableMultiSelect) return;
    
    multiSelect.toggleSelectionMode();
  }, [enableMultiSelect, multiSelect]);

  // Select all files handler
  const handleSelectAllFiles = useCallback((items: any[]) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectAllFiles(items);
  }, [enableMultiSelect, multiSelect]);

  // Select all folders handler
  const handleSelectAllFolders = useCallback((items: any[]) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectAllFolders(items);
  }, [enableMultiSelect, multiSelect]);

  return {
    // Single selection state
    selectedAssetId,
    setSelectedAssetId,
    
    // Multi-select state and operations
    multiSelect: enableMultiSelect ? {
      ...multiSelect,
      handleItemSelection,
      toggleSelectionMode,
      handleSelectAllFiles,
      handleSelectAllFolders,
    } : null,
  };
}; 