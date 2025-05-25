'use client';

import React from 'react';
import { AssetDetailsModal } from '../dialogs/AssetDetailsModal';
import { RenameFolderDialog } from '../dialogs/RenameFolderDialog';
import { DeleteFolderDialog } from '../dialogs/DeleteFolderDialog';
import { InputDialog } from '../dialogs/InputDialog';
import { DeleteAssetConfirmation } from '../dialogs/ConfirmationDialog';
import { FolderPickerDialog } from '../dialogs/FolderPickerDialog';

interface GalleryDialogsProps {
  selectedAssetId: string | null;
  onCloseAssetDetails: () => void;
  onAssetUpdated: () => void;
  onAssetDeleted: (assetId: string) => void;
  dialogManager: any;
  moveDialog: any;
  activeFolderId: string | null;
  onMoveAssetConfirm: (folderId: string | null) => void;
  onRenameAssetSubmit: (newName: string) => void;
  onDeleteAssetConfirm: () => void;
  onFolderActionComplete: () => void;
  onRefresh: () => void;
}

export const GalleryDialogs: React.FC<GalleryDialogsProps> = ({
  selectedAssetId,
  onCloseAssetDetails,
  onAssetUpdated,
  onAssetDeleted,
  dialogManager,
  moveDialog,
  activeFolderId,
  onMoveAssetConfirm,
  onRenameAssetSubmit,
  onDeleteAssetConfirm,
  onFolderActionComplete,
  onRefresh,
}) => {
  return (
    <>
      {/* Asset Details Modal */}
      <AssetDetailsModal
        open={!!selectedAssetId}
        onOpenChange={(open) => !open && onCloseAssetDetails()}
        assetId={selectedAssetId}
        onAssetUpdated={onAssetUpdated}
        onAssetDeleted={onAssetDeleted}
      />

      {/* Folder Action Dialogs */}
      {dialogManager.folderActionDialog.type === 'rename' && dialogManager.folderActionDialog.folderId && (
        <RenameFolderDialog
          isOpen={true}
          onClose={onFolderActionComplete}
          folderId={dialogManager.folderActionDialog.folderId}
          currentName={dialogManager.folderActionDialog.folderName || ''}
        />
      )}

      {dialogManager.folderActionDialog.type === 'delete' && dialogManager.folderActionDialog.folderId && (
        <DeleteFolderDialog
          isOpen={true}
          onClose={onFolderActionComplete}
          folderId={dialogManager.folderActionDialog.folderId}
          folderName={dialogManager.folderActionDialog.folderName || ''}
          onDeleted={onFolderActionComplete}
        />
      )}

      {/* Asset Action Dialogs */}
      {dialogManager.assetDetailsDialog.isOpen && dialogManager.assetDetailsDialog.assetId && (
        <AssetDetailsModal
          open={dialogManager.assetDetailsDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              dialogManager.closeAssetDetails();
            }
          }}
          assetId={dialogManager.assetDetailsDialog.assetId}
          onAssetUpdated={onAssetUpdated}
          onAssetDeleted={onAssetDeleted}
        />
      )}

      {dialogManager.renameAssetDialog.isOpen && dialogManager.renameAssetDialog.asset && (
        <InputDialog
          isOpen={dialogManager.renameAssetDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              dialogManager.closeRenameAsset();
            }
          }}
          onSubmit={onRenameAssetSubmit}
          title="Rename Asset"
          description={`Enter a new name for "${dialogManager.renameAssetDialog.asset.name}"`}
          inputPlaceholder="Enter asset name"
          initialValue={dialogManager.renameAssetDialog.asset.name}
          submitButtonText="Rename"
        />
      )}

      {dialogManager.deleteAssetDialog.isOpen && dialogManager.deleteAssetDialog.asset && (
        <DeleteAssetConfirmation
          open={dialogManager.deleteAssetDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              dialogManager.closeDeleteAsset();
            }
          }}
          assetName={dialogManager.deleteAssetDialog.asset.name}
          onConfirm={onDeleteAssetConfirm}
          onCancel={() => dialogManager.closeDeleteAsset()}
        />
      )}

      {/* Move Asset Dialog */}
      {moveDialog.isOpen && moveDialog.data && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              // This should call closeMoveDialog from the parent
            }
          }}
          onFolderSelect={onMoveAssetConfirm}
          currentAssetFolderId={moveDialog.data.folderId}
          assetName={moveDialog.data.name}
        />
      )}
    </>
  );
}; 
