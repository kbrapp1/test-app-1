import React, { useState, useTransition } from 'react';
import type { CombinedItem, Asset, Tag } from '@/types/dam';
import { useAssetItemDialogs } from './hooks/useAssetItemDialogs';
import { useAssetItemActions } from './hooks/useAssetItemActions';
import { deleteAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast } from 'sonner';
import { damTableColumns } from './dam-column-config';
import { AssetListItemDialogs } from './AssetListItemDialogs';
import { getCellContent } from './AssetListItemCell';

export interface AssetListItemProps {
  item: CombinedItem;
  onDataChange: () => Promise<void>;
}

export const AssetListItem: React.FC<AssetListItemProps> = ({ item, onDataChange }) => {
  const isFolder = item.type === 'folder';
  const asset = item.type !== 'folder' ? (item as Asset) : null;

  const {
    renameDialog, openRenameDialog, closeRenameDialog, 
    detailsDialog, openDetailsDialog, closeDetailsDialog,
    moveDialog, openMoveDialog, closeMoveDialog
  } = useAssetItemDialogs();

  const itemActions = asset ? useAssetItemActions({ 
    item: asset,
    onDataChange,
    closeRenameDialog,
    closeMoveDialog,
  }) : null;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const requestDelete = () => {
    if (isFolder || !asset) {
      if(isFolder) {
        console.warn("Folder deletion from list item not yet implemented via this menu.");
        toast.info("Folder deletion from this menu is not yet available.");
      }
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!asset) return;

    startDeleteTransition(async () => {
      try {
        const result = await deleteAsset(asset.id);
        if (result.success) {
          toast.success(`Asset "${asset.name}" deleted successfully.`);
          await onDataChange();
        } else {
          toast.error(result.error || 'Failed to delete asset.');
        }
      } catch (error) {
        toast.error('An unexpected error occurred during deletion.');
        console.error("Delete error:", error);
      } finally {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  const lastModified = item.created_at;
  const fileSize = asset?.size ? `${(asset.size / 1024).toFixed(1)} KB` : '-';

  const MAX_INLINE_TAGS = 3;
  const assetTagsData: Tag[] = asset?.tags ?? []; // Renamed to avoid conflict with prop name
  const inlineTagsData = assetTagsData.slice(0, MAX_INLINE_TAGS); // Renamed
  const overflowCountData = assetTagsData.length - inlineTagsData.length; // Renamed

  return (
    <>
      <div className="flex items-center p-2 hover:bg-muted/50 rounded-md gap-4 border-b last:border-b-0">
        {damTableColumns.map((col) => {
          const { content, displayColumn } = getCellContent(
            col,
            item,
            isFolder,
            asset,
            inlineTagsData, // Pass renamed var
            overflowCountData, // Pass renamed var
            assetTagsData, // Pass renamed var
            fileSize,
            lastModified,
            itemActions,
            openDetailsDialog,
            openRenameDialog,
            openMoveDialog,
            requestDelete
          );

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
      </div>
      
      {!isFolder && asset && itemActions && (
        <AssetListItemDialogs 
          asset={asset}
          renameDialog={renameDialog}
          closeRenameDialog={closeRenameDialog}
          detailsDialog={detailsDialog}
          closeDetailsDialog={closeDetailsDialog}
          moveDialog={moveDialog}
          closeMoveDialog={closeMoveDialog}
          itemActions={itemActions}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          handleConfirmDelete={handleConfirmDelete}
          isDeleting={isDeleting}
          onDataChange={onDataChange}
        />
      )}
    </>
  );
}; 