import { useState, useEffect, useCallback } from 'react';
import { useMultiSelect } from '../../../selection/useMultiSelect';
import { Selection } from '../../../../../domain/entities/Selection';
import { GalleryItemDto } from '../../../../../domain/value-objects/GalleryItem';

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

  // Clear selection on folder navigation - using defensive approach
  useEffect(() => {
    if (enableMultiSelect && multiSelect?.clearSelection) {
      multiSelect.clearSelection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolderId, enableMultiSelect]);

  // Auto-enter selection mode when multi-select is enabled - using defensive approach
  useEffect(() => {
    if (enableMultiSelect && !multiSelect?.isSelecting && multiSelect?.enterSelectionMode) {
      multiSelect.enterSelectionMode();
    } else if (!enableMultiSelect && multiSelect?.isSelecting && multiSelect?.exitSelectionMode) {
      multiSelect.exitSelectionMode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect?.isSelecting]);

  // Handle item selection with keyboard modifiers - now stable
  const handleItemSelection = useCallback((id: string, type: 'asset' | 'folder', event?: MouseEvent) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectItem(id, type, event);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect.selectItem]);

  // Toggle selection mode - now stable
  const toggleSelectionMode = useCallback(() => {
    if (!enableMultiSelect) return;
    
    multiSelect.toggleSelectionMode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect.toggleSelectionMode]);

  // Select all files handler - now stable
  const handleSelectAllFiles = useCallback((items: GalleryItemDto[]) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectAllFiles(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect.selectAllFiles]);

  // Select all folders handler - now stable
  const handleSelectAllFolders = useCallback((items: GalleryItemDto[]) => {
    if (!enableMultiSelect) return;
    
    multiSelect.selectAllFolders(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect.selectAllFolders]);

  return {
    // Single selection state
    selectedAssetId,
    setSelectedAssetId,
    
    // Multi-select state and operations (simple approach)
    multiSelect: enableMultiSelect ? {
      ...multiSelect,
      handleItemSelection,
      toggleSelectionMode,
      handleSelectAllFiles,
      handleSelectAllFolders,
    } : null,
  };
}; 