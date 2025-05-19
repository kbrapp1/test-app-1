import React from 'react';
import type { Asset } from '@/types/dam';
import { InputDialog } from '@/components/dam/dialogs/InputDialog';
import { AssetDetailsDialog } from '@/components/dam/dialogs/AssetDetailsDialog';
import { FolderPickerDialog } from '@/components/dam/dialogs/FolderPickerDialog';
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
import type { UseAssetItemDialogsReturn } from './hooks/useAssetItemDialogs';
import type { UseAssetItemActionsReturn } from './hooks/useAssetItemActions';

interface AssetListItemDialogsProps {
  asset: Asset | null; // Asset specific dialogs need this
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
  onDataChange: () => Promise<void>; // For AssetDetailsDialog
}

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
        <AssetDetailsDialog 
          isOpen={detailsDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeDetailsDialog()}
          asset={detailsDialog.data}
          onAssetDataChange={onDataChange}
        />
      )}
      {moveDialog.isOpen && moveDialog.data && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeMoveDialog()}
          onFolderSelect={itemActions.handleMoveConfirm}
          currentAssetFolderId={moveDialog.data.folder_id}
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