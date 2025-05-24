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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * ConfirmationDialog - Domain-Driven Confirmation Component
 * 
 * This component demonstrates proper DDD presentation patterns:
 * - Uses domain language and concepts
 * - Focused on user intent and domain actions
 * - Clean separation from business logic
 * - Reusable across different domain contexts
 */

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  trigger,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const confirmButtonClass = variant === 'destructive' 
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Domain-specific confirmation dialogs for common DAM operations
export interface DeleteAssetConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const DeleteAssetConfirmation: React.FC<DeleteAssetConfirmationProps> = ({
  open,
  onOpenChange,
  assetName,
  onConfirm,
  onCancel,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Delete Asset"
    description={`Are you sure you want to delete "${assetName}"? This action cannot be undone.`}
    confirmText="Delete Asset"
    cancelText="Cancel"
    variant="destructive"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export interface DeleteFolderConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const DeleteFolderConfirmation: React.FC<DeleteFolderConfirmationProps> = ({
  open,
  onOpenChange,
  folderName,
  onConfirm,
  onCancel,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Delete Folder"
    description={`Are you sure you want to delete the folder "${folderName}" and all its contents? This action cannot be undone.`}
    confirmText="Delete Folder"
    cancelText="Cancel"
    variant="destructive"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export default ConfirmationDialog; 