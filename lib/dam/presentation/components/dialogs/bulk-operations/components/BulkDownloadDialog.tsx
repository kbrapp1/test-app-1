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
import { useBulkDownloadHandler } from '../hooks';

interface BulkDownloadDialogProps {
  isOpen: boolean;
  selectedAssets: string[];
  selectedFolders: string[];
  selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  isLoading: boolean;
  onClose: () => void;
  onOperationComplete: () => void;
}

/**
 * Dialog component for bulk download operations
 * 
 * Single Responsibility: UI for download operations
 */
export const BulkDownloadDialog: React.FC<BulkDownloadDialogProps> = ({
  isOpen,
  selectedAssets,
  selectedFolders,
  selectedItems = [],
  isLoading,
  onClose,
  onOperationComplete
}) => {
  const { handleBulkDownload } = useBulkDownloadHandler({
    selectedAssets,
    selectedFolders,
    onOperationComplete,
    onClose
  });

  const assetCount = selectedAssets.length;
  const folderCount = selectedFolders.length;
  const totalItems = assetCount + folderCount;
  const isSingleAsset = assetCount === 1 && folderCount === 0;

  // Generate title based on selection
  const getTitle = (): string => {
    if (isSingleAsset) {
      return 'Download Asset';
    } else if (assetCount > 0 && folderCount > 0) {
      return `Download ${totalItems} items`;
    } else if (assetCount > 0) {
      return `Download ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
    } else {
      return `Download ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
    }
  };

  // Generate description based on selection
  const getDescription = (): string => {
    if (isSingleAsset) {
      return 'The asset will be downloaded directly to your computer.';
    } else if (folderCount > 0) {
      return 'Items will be downloaded as a ZIP file containing all assets from selected folders.';
    } else {
      return 'Assets will be downloaded as a ZIP file. This may take a moment for large files.';
    }
  };

  const getButtonText = (): string => {
    if (isLoading) {
      return 'Downloading...';
    }
    return isSingleAsset ? 'Download' : 'Download as ZIP';
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
            onClick={handleBulkDownload}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 