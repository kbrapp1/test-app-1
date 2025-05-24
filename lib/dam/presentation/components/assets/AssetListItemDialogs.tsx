import React from 'react';
import type { ComponentAsset } from '@/lib/dam/types/component';
import type { Asset as DomainAsset } from '../../../domain/entities/Asset';
import { InputDialog, AssetDetailsModal, FolderPickerDialog } from '../dialogs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UseAssetItemDialogsReturn } from '../../hooks';
import type { UseAssetItemActionsReturn } from '../../hooks';

export interface AssetListItemDialogsProps {
  asset: ComponentAsset | null; // Component asset from list
  renameDialog: UseAssetItemDialogsReturn['renameDialog'];
  closeRenameDialog: UseAssetItemDialogsReturn['closeRenameDialog'];
  detailsDialog: UseAssetItemDialogsReturn['detailsDialog'];
  closeDetailsDialog: UseAssetItemDialogsReturn['closeDetailsDialog'];
  moveDialog: UseAssetItemDialogsReturn['moveDialog'];
  closeMoveDialog: UseAssetItemDialogsReturn['closeMoveDialog'];
  itemActions: UseAssetItemActionsReturn | null;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  handleConfirmDelete: () => void;
  isDeleting: boolean;
  onDataChange: () => Promise<void>; // For AssetDetailsModal
}

/**
 * Domain presentation component for managing dialogs in asset list items
 * Consolidates rename, details, move, and delete dialogs with proper state management
 * Uses domain dialog components and hooks for consistent behavior
 */
export const AssetListItemDialogs: React.FC<AssetListItemDialogsProps> = ({
  asset,
  renameDialog,
  closeRenameDialog,
  detailsDialog,
  closeDetailsDialog,
  moveDialog,
  closeMoveDialog,
  itemActions,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  handleConfirmDelete,
  isDeleting,
  onDataChange,
}) => {
  if (!asset || !itemActions) return null; // Dialogs are mostly for assets and need actions

  return (
    <>
      {renameDialog.isOpen && renameDialog.data && (
        <InputDialog
          isOpen={renameDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeRenameDialog()}
          title={`Rename Asset`}
          description={`Renaming "${renameDialog.data.name}". Enter a new name below.`}
          initialValue={renameDialog.data.name}
          inputLabel="New Name"
          onSubmit={itemActions.handleRenameSubmit}
          isLoading={itemActions.isPendingRename}
        />
      )}
      {detailsDialog.isOpen && detailsDialog.data && (
        <AssetDetailsModal 
          open={detailsDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeDetailsDialog()}
          assetId={detailsDialog.data.id}
          onAssetUpdated={() => onDataChange()}
        />
      )}
      {moveDialog.isOpen && moveDialog.data && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && closeMoveDialog()}
          onFolderSelect={itemActions.handleMoveConfirm}
          currentAssetFolderId={moveDialog.data.folderId}
          assetName={moveDialog.data.name}
        />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete "{asset.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 