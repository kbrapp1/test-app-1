import React, { useState, useTransition, useEffect, useRef } from 'react';
import type { CombinedItem, Folder, Asset } from '@/types/dam';
import { Folder as FolderIcon, FileText as FileIcon, MoreVertical } from 'lucide-react'; // Common icons
import { Button } from '@/components/ui/button';
import { AssetActionDropdownMenu } from './AssetActionDropdownMenu'; // Will be similar to this
import { useAssetItemDialogs } from './hooks/useAssetItemDialogs';
import { useAssetItemActions } from './hooks/useAssetItemActions';
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
import { deleteAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast } from 'sonner';
import { damTableColumns } from './dam-column-config'; // Added import

export interface AssetListItemProps {
  item: CombinedItem;
  onDataChange: () => Promise<void>;
  // selected: boolean; // If we add selection
  // onSelect: (itemId: string) => void;
}

export const AssetListItem: React.FC<AssetListItemProps> = ({ item, onDataChange }) => {
  const isFolder = item.type === 'folder';
  const asset = item as Asset; // Type assertion for convenience, use with caution or type check
  // const folder = item as Folder;

  const { 
    renameDialog, openRenameDialog, closeRenameDialog, 
    detailsDialog, openDetailsDialog, closeDetailsDialog,
    moveDialog, openMoveDialog, closeMoveDialog
  } = useAssetItemDialogs();

  const itemActions = !isFolder ? useAssetItemActions({ 
    item: asset, // This needs to be conditional or handled if it's a folder
    onDataChange,
    closeRenameDialog,
    closeMoveDialog,
  }) : null;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // This function is called by the DropdownMenuItem, so it should not be async directly
  // It will now open the confirmation dialog
  const requestDelete = () => {
    if (isFolder) {
      console.warn("Folder deletion from list item not yet implemented via this menu.");
      toast.info("Folder deletion from this menu is not yet available.");
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  // This function is called when the user confirms deletion in the AlertDialog
  const handleConfirmDelete = async () => {
    if (isFolder || !asset) return;

    startDeleteTransition(async () => {
      try {
        // Directly use the deleteAsset server action
        const result = await deleteAsset(asset.id);
        if (result.success) {
          toast.success(`Asset "${asset.name}" deleted successfully.`);
          await onDataChange(); // Refresh data
        } else {
          toast.error(result.error || 'Failed to delete asset.');
        }
      } catch (error) {
        toast.error('An unexpected error occurred during deletion.');
        console.error("Delete error:", error);
      } finally {
        setIsDeleteDialogOpen(false); // Close the dialog regardless of outcome
      }
    });
  };

  const lastModified = item.created_at;
  // const fileSize = asset.metadata?.size ? prettyBytes(asset.metadata.size) : '-'; // If we add prettyBytes
  const fileSize = !isFolder && asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : '-';

  return (
    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md gap-4 border-b last:border-b-0">
      {damTableColumns.map((col) => {
        let content: React.ReactNode = null;
        let displayColumn = true;

        // Determine content based on column ID and item type
        switch (col.id) {
          case 'icon':
            content = isFolder ? <FolderIcon className="h-5 w-5 text-blue-500" /> : <FileIcon className="h-5 w-5 text-gray-500" />;
            break;
          case 'name':
            content = <p className="text-sm font-medium truncate">{item.name}</p>;
            break;
          case 'location':
            if (col.isAssetOnly && !isFolder) {
              content = asset.parentFolderName || '-';
            } else if (col.isAssetOnly && isFolder && (col.cellStyle?.width || col.cellClassName?.includes('w-'))) {
              content = <div />; // Placeholder for fixed-width asset-only columns in folder rows
            } else if (!col.isAssetOnly) {
              // Future: if location can also be for folders
              content = '-'; // Default for non-assetOnly if not handled
            } else {
              displayColumn = false;
            }
            break;
          case 'owner':
            content = item.ownerName || '-';
            break;
          case 'size':
            if (col.isAssetOnly && !isFolder) {
              content = fileSize;
            } else if (col.isAssetOnly && isFolder && (col.cellStyle?.width || col.cellClassName?.includes('w-'))) {
              content = <div />; // Placeholder
            } else if (!col.isAssetOnly) {
              content = '-'; 
            } else {
              displayColumn = false;
            }
            break;
          case 'lastModified':
            content = new Date(lastModified).toLocaleDateString() + ' ' + new Date(lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            break;
          case 'actions':
            if (!isFolder && itemActions) {
              content = (
                <AssetActionDropdownMenu
                  item={asset}
                  onViewDetails={(e) => { e.stopPropagation(); openDetailsDialog(asset); }}
                  onOpenRenameDialog={(e) => { e.stopPropagation(); openRenameDialog(asset); }}
                  onOpenMoveDialog={(e) => { e.stopPropagation(); openMoveDialog(asset); }}
                  onDownload={itemActions.handleDownload}
                  onDelete={requestDelete}
                  isDownloading={itemActions.isDownloading}
                  isPendingRename={itemActions.isPendingRename}
                  isPendingMove={itemActions.isPendingMove}
                />
              );
            } else {
              // Placeholder for folders or if no actions, ensure it takes up space if column is fixed width
              if (col.cellStyle?.width || col.cellClassName?.includes('w-')) {
                content = <div className="h-full w-full" />;
              } else {
                displayColumn = false; // Don't render if not a fixed-width column and no actions
              }
            }
            break;
          default:
            displayColumn = false;
        }

        if (!displayColumn) return null;

        return (
          <div
            key={`${item.id}-${col.id}`}
            className={col.cellClassName}
            style={col.cellStyle}
          >
            {content}
          </div>
        );
      })}

      {!isFolder && itemActions && renameDialog.isOpen && renameDialog.data && (
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
      {!isFolder && detailsDialog.isOpen && detailsDialog.data && (
        <AssetDetailsDialog 
          isOpen={detailsDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeDetailsDialog()}
          asset={detailsDialog.data}
          onAssetDataChange={onDataChange}
        />
      )}
      {!isFolder && itemActions && moveDialog.isOpen && moveDialog.data && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeMoveDialog()}
          onFolderSelect={itemActions.handleMoveConfirm}
          currentAssetFolderId={moveDialog.data.folder_id}
          assetName={moveDialog.data.name}
        />
      )}

      {!isFolder && (
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
      )}
    </div>
  );
}; 