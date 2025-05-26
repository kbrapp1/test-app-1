'use client';

import React from 'react';
import { FolderPickerDialog } from '../../FolderPickerDialog';
import { useBulkMoveHandler } from '../hooks';

interface BulkMoveDialogProps {
  isOpen: boolean;
  selectedAssets: string[];
  selectedFolders: string[];
  selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  currentFolderId: string | null;
  isLoading: boolean;
  onClose: () => void;
  onOperationComplete: () => void;
}

/**
 * Dialog component for bulk move operations
 * 
 * Single Responsibility: UI for move operations
 */
export const BulkMoveDialog: React.FC<BulkMoveDialogProps> = ({
  isOpen,
  selectedAssets,
  selectedFolders,
  selectedItems = [],
  currentFolderId,
  isLoading,
  onClose,
  onOperationComplete
}) => {
  const { handleBulkMove } = useBulkMoveHandler({
    selectedAssets,
    selectedFolders,
    onOperationComplete,
    onClose
  });

  const totalItems = selectedAssets.length + selectedFolders.length;
  
  // Generate dialog title based on selection
  const getDialogTitle = (): string => {
    if (totalItems === 1 && selectedItems.length > 0) {
      return `Move "${selectedItems[0].name}"`;
    }
    
    if (totalItems > 1) {
      const assetCount = selectedAssets.length;
      const folderCount = selectedFolders.length;
      
      if (assetCount > 0 && folderCount > 0) {
        return `Move ${totalItems} items`;
      } else if (assetCount > 0) {
        return `Move ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
      } else {
        return `Move ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
      }
    }
    
    return "Move Items";
  };

  const getDialogDescription = (): string => {
    return totalItems === 1 
      ? "Select a destination folder or move to root."
      : `Select a destination folder for the ${totalItems} selected items.`;
  };

  return (
    <FolderPickerDialog
      isOpen={isOpen}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      onFolderSelect={handleBulkMove}
      currentAssetFolderId={currentFolderId}
      assetName={totalItems === 1 && selectedItems.length > 0 ? selectedItems[0].name : undefined}
      dialogTitle={getDialogTitle()}
      dialogDescription={getDialogDescription()}
      isMoving={isLoading}
    />
  );
}; 