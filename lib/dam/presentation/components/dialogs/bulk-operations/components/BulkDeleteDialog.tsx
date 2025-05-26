'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBulkDeleteHandler } from '../hooks';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  selectedAssets: string[];
  selectedFolders: string[];
  selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  isLoading: boolean;
  onClose: () => void;
  onOperationComplete: () => void;
}

/**
 * Dialog component for bulk delete operations
 * 
 * Single Responsibility: UI for delete operations
 */
export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  selectedAssets,
  selectedFolders,
  selectedItems = [],
  isLoading,
  onClose,
  onOperationComplete
}) => {
  const { handleBulkDelete } = useBulkDeleteHandler({
    selectedAssets,
    selectedFolders,
    onOperationComplete,
    onClose
  });

  const totalItems = selectedAssets.length + selectedFolders.length;
  const assetCount = selectedAssets.length;
  const folderCount = selectedFolders.length;

  // Generate title based on selection
  const getTitle = (): string => {
    if (totalItems === 1) {
      if (selectedItems.length > 0) {
        return selectedItems[0].type === 'folder' ? "Delete Folder" : "Delete Asset";
      }
    }
    
    if (assetCount > 0 && folderCount > 0) {
      return `Delete ${totalItems} items`;
    } else if (assetCount > 0) {
      return `Delete ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
    } else {
      return `Delete ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
    }
    
    return "Delete Asset";
  };

  // Generate description based on selection
  const getDescription = (): string => {
    if (totalItems === 1 && selectedItems.length > 0) {
      return `Are you sure you want to delete "${selectedItems[0].name}"? This action cannot be undone.`;
    }
    
    if (selectedItems.length > 0) {
      const itemNames = selectedItems.slice(0, 3).map(item => `"${item.name}"`).join(', ');
      const remaining = selectedItems.length - 3;
      
      if (remaining > 0) {
        return `Are you sure you want to delete ${itemNames} and ${remaining} other item${remaining > 1 ? 's' : ''}? This action cannot be undone.`;
      } else {
        return `Are you sure you want to delete ${itemNames}? This action cannot be undone.`;
      }
    }
    
    return `Are you sure you want to delete the selected ${totalItems} item${totalItems > 1 ? 's' : ''}? This action cannot be undone.`;
  };

  // Generate button text
  const getButtonText = (): string => {
    if (isLoading) {
      return 'Deleting...';
    }
    
    if (totalItems === 1 && selectedItems.length > 0) {
      return selectedItems[0].type === 'folder' ? 'Delete Folder' : 'Delete Asset';
    }
    
    return 'Delete';
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 