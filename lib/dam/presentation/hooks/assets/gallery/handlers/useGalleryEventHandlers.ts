import { useEffect } from 'react';

// TypeScript interfaces for better type safety
interface MultiSelectInstance {
  selectedAssets: string[];
  selectedFolders: string[];
  clearSelection: () => void;
  exitSelectionMode: () => void;
  toggleItem: (id: string, type: 'asset' | 'folder') => void;
}

interface GalleryDataInstance {
  folders?: Array<{ id: string; [key: string]: unknown }>;
  items?: Array<{ id: string; type: 'asset' | 'folder'; [key: string]: unknown }>;
  fetchData?: (forceRefresh?: boolean) => void;
}

interface GalleryEventHandlersProps {
  enableMultiSelect?: boolean;
  multiSelect: MultiSelectInstance;
  galleryData: GalleryDataInstance;
  activeFolderId: string | null;
}

/**
 * useGalleryEventHandlers - Presentation Layer Event Hook
 * 
 * Single Responsibility: Handle gallery-related DOM events and window listeners
 * Follows DDD principles by focusing solely on event handling concerns
 */
export const useGalleryEventHandlers = (props: GalleryEventHandlersProps) => {
  const { enableMultiSelect, multiSelect, galleryData, activeFolderId: _activeFolderId } = props;

  // Listen for selection requests from drag and drop
  useEffect(() => {
    const handleGetSelection = () => {
      if (enableMultiSelect) {
        window.dispatchEvent(new CustomEvent('damSelectionUpdate', {
          detail: { 
            selectedAssets: multiSelect.selectedAssets, 
            selectedFolders: multiSelect.selectedFolders 
          }
        }));
      }
    };

    window.addEventListener('damRequestSelection', handleGetSelection);
    return () => window.removeEventListener('damRequestSelection', handleGetSelection);
  }, [enableMultiSelect, multiSelect.selectedAssets, multiSelect.selectedFolders]);

  // Handle escape key for selection mode
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && enableMultiSelect) {
        // Check if we have any selections before clearing
        const hasSelections = multiSelect.selectedAssets.length > 0 || multiSelect.selectedFolders.length > 0;
        if (hasSelections) {
          multiSelect.clearSelection();
          multiSelect.exitSelectionMode();
        }
      }
    };

    if (enableMultiSelect) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, multiSelect.selectedAssets.length, multiSelect.selectedFolders.length, multiSelect.clearSelection, multiSelect.exitSelectionMode]);

  // Handle keyboard shortcuts for selection
  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!enableMultiSelect || !galleryData.items) return;

      // Ctrl+A or Cmd+A to select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        
        galleryData.items.forEach(item => {
          if (item.type === 'asset' || item.type === 'folder') {
            multiSelect.toggleItem(item.id, item.type);
          }
        });
      }
    };

    if (enableMultiSelect) {
      document.addEventListener('keydown', handleKeyboardShortcuts);
      return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableMultiSelect, galleryData.items, multiSelect.toggleItem]);
}; 