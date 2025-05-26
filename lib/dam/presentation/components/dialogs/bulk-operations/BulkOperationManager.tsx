'use client';

import React from 'react';
import { 
  BulkMoveDialog, 
  BulkDeleteDialog, 
  BulkTagDialog, 
  BulkDownloadDialog 
} from './components';
import { useBulkOperationState } from './hooks';

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

interface BulkOperationManagerProps {
  bulkDialogs: BulkOperationDialogs;
  onClose: (type: keyof BulkOperationDialogs) => void;
  onOperationComplete: () => void;
  currentFolderId: string | null;
}

/**
 * Main coordinator for bulk operation dialogs
 * 
 * Single Responsibility: Coordination of bulk operation dialogs
 */
export const BulkOperationManager: React.FC<BulkOperationManagerProps> = ({
  bulkDialogs,
  onClose,
  onOperationComplete,
  currentFolderId
}) => {
  const { loading } = useBulkOperationState();

  return (
    <>
      <BulkMoveDialog
        isOpen={bulkDialogs.move.isOpen}
        selectedAssets={bulkDialogs.move.selectedAssets}
        selectedFolders={bulkDialogs.move.selectedFolders}
        selectedItems={bulkDialogs.move.selectedItems}
        currentFolderId={currentFolderId}
        isLoading={loading.move}
        onClose={() => onClose('move')}
        onOperationComplete={onOperationComplete}
      />

      <BulkDeleteDialog
        isOpen={bulkDialogs.delete.isOpen}
        selectedAssets={bulkDialogs.delete.selectedAssets}
        selectedFolders={bulkDialogs.delete.selectedFolders}
        selectedItems={bulkDialogs.delete.selectedItems}
        isLoading={loading.delete}
        onClose={() => onClose('delete')}
        onOperationComplete={onOperationComplete}
      />

      <BulkTagDialog
        isOpen={bulkDialogs.tag.isOpen}
        selectedAssets={bulkDialogs.tag.selectedAssets}
        operation={bulkDialogs.tag.operation}
        selectedItems={bulkDialogs.tag.selectedItems}
        isLoading={loading.tag}
        onClose={() => onClose('tag')}
        onOperationComplete={onOperationComplete}
      />

      <BulkDownloadDialog
        isOpen={bulkDialogs.download.isOpen}
        selectedAssets={bulkDialogs.download.selectedAssets}
        selectedFolders={bulkDialogs.download.selectedFolders}
        selectedItems={bulkDialogs.download.selectedItems}
        isLoading={loading.download}
        onClose={() => onClose('download')}
        onOperationComplete={onOperationComplete}
      />
    </>
  );
}; 