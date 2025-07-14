import { useState, useCallback } from 'react';
import { BulkOperationType } from '../../../../../domain/value-objects/BulkOperation';
import type { UseMultiSelectReturn } from '../../../selection/multi-select/types';
import type { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface BulkOperationDialogs {
  move: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  delete: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  tag: {
    isOpen: boolean;
    selectedAssets: string[];
    operation: 'add' | 'remove';
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  download: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
}

interface BulkOperationsProps {
  multiSelect: UseMultiSelectReturn | null; // Multi-select hook instance
  galleryItems: GalleryItemDto[]; // Gallery items for context
}

/**
 * useGalleryBulkOperations - Presentation Layer State Hook
 * 
 * Single Responsibility: Manage bulk operation dialogs and state
 * Follows DDD principles by focusing solely on bulk operation concerns
 */
export const useGalleryBulkOperations = (props: BulkOperationsProps) => {
  const { multiSelect, galleryItems } = props;
  
  // Bulk operation dialogs state
  const [bulkDialogs, setBulkDialogs] = useState<BulkOperationDialogs>({
    move: { isOpen: false, selectedAssets: [], selectedFolders: [] },
    delete: { isOpen: false, selectedAssets: [], selectedFolders: [] },
    tag: { isOpen: false, selectedAssets: [], operation: 'add' },
    download: { isOpen: false, selectedAssets: [], selectedFolders: [] }
  });

  // Handle bulk operations
  const handleBulkOperation = useCallback((operation: BulkOperationType) => {
    if (!multiSelect) return;
    
    const selectedAssets = multiSelect.selectedAssets;
    const selectedFolders = multiSelect.selectedFolders;
    
    // Validate tag operations - only allow when assets are selected
    if ((operation === 'addTags' || operation === 'removeTags') && selectedAssets.length === 0) {
      import('sonner').then(({ toast }) => {
        toast.error('Cannot tag folders', {
          description: 'Tags can only be applied to assets. Please select assets to add tags.'
        });
      });
      return;
    }
    
    // Get selected items with names from gallery data
    const selectedItems = galleryItems.filter(item => 
      (item.type === 'asset' && selectedAssets.includes(item.id)) ||
      (item.type === 'folder' && selectedFolders.includes(item.id))
    ).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type as 'asset' | 'folder'
    }));

    switch (operation) {
      case 'move':
        setBulkDialogs(prev => ({
          ...prev,
          move: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
      case 'delete':
        setBulkDialogs(prev => ({
          ...prev,
          delete: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
      case 'addTags':
        setBulkDialogs(prev => ({
          ...prev,
          tag: { isOpen: true, selectedAssets, operation: 'add', selectedItems: selectedItems.filter(item => item.type === 'asset') }
        }));
        break;
      case 'removeTags':
        setBulkDialogs(prev => ({
          ...prev,
          tag: { isOpen: true, selectedAssets, operation: 'remove', selectedItems: selectedItems.filter(item => item.type === 'asset') }
        }));
        break;
      case 'download':
        setBulkDialogs(prev => ({
          ...prev,
          download: { isOpen: true, selectedAssets, selectedFolders, selectedItems }
        }));
        break;
    }
  }, [multiSelect, galleryItems]);

  const closeBulkDialog = useCallback((type: keyof BulkOperationDialogs) => {
    setBulkDialogs(prev => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false }
    }));
  }, []);

  return {
    bulkDialogs,
    handleBulkOperation,
    closeBulkDialog,
  };
}; 