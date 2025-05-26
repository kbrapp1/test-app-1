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
import { useBulkTagHandler } from '../hooks';

interface BulkTagDialogProps {
  isOpen: boolean;
  selectedAssets: string[];
  operation: 'add' | 'remove';
  selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  isLoading: boolean;
  onClose: () => void;
  onOperationComplete: () => void;
}

/**
 * Dialog component for bulk tag operations
 * 
 * Single Responsibility: UI for tag operations
 */
export const BulkTagDialog: React.FC<BulkTagDialogProps> = ({
  isOpen,
  selectedAssets,
  operation,
  selectedItems = [],
  isLoading,
  onClose,
  onOperationComplete
}) => {
  const { handleBulkTag } = useBulkTagHandler({
    selectedAssets,
    operation,
    onOperationComplete,
    onClose
  });

  const getTitle = (): string => {
    const action = operation === 'add' ? 'Add Tags' : 'Remove Tags';
    return `${action} (${selectedAssets.length} assets)`;
  };

  const getDescription = (): string => {
    return `Select tags to ${operation} for the selected assets.`;
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
            onClick={() => handleBulkTag([])}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 