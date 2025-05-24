import React, { useState, useTransition } from 'react';
import type { CombinedItem, ComponentAsset as Asset } from '@/lib/dam/types/component';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import type { Asset as DomainAsset } from '../../../domain/entities/Asset';
import { Asset as DomainAssetClass } from '../../../domain/entities/Asset';
import { Tag as DomainTag } from '../../../domain/entities/Tag';
import { useAssetItemDialogs, useAssetItemActions } from '../../hooks';
import { deleteAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast } from 'sonner';
import { damTableColumns, AssetListItemDialogs, getCellContent } from './';

// Helper function to convert component Asset to domain Asset
function componentAssetToDomainAsset(componentAsset: Asset): DomainAsset {
  return new DomainAssetClass({
    id: componentAsset.id,
    userId: componentAsset.user_id,
    name: componentAsset.name,
    storagePath: componentAsset.storage_path,
    mimeType: componentAsset.mime_type,
    size: componentAsset.size,
    createdAt: new Date(componentAsset.created_at),
    updatedAt: componentAsset.updated_at ? new Date(componentAsset.updated_at) : undefined,
    folderId: componentAsset.folder_id,
    organizationId: componentAsset.organization_id,
    tags: componentAsset.tags?.map(tag => new DomainTag({
      id: tag.id,
      name: tag.name,
      userId: tag.userId,
      organizationId: tag.organizationId,
      createdAt: new Date(tag.createdAt),
      updatedAt: tag.updatedAt ? new Date(tag.updatedAt) : undefined
    })),
    publicUrl: componentAsset.publicUrl || undefined,
  });
}

export interface AssetListItemProps {
  item: CombinedItem;
  onDataChange: () => Promise<void>;
}

/**
 * Domain presentation component for rendering a single item in the asset list view
 * Handles both folders and assets with proper domain architecture patterns
 */
export const AssetListItem: React.FC<AssetListItemProps> = ({ item, onDataChange }) => {
  const isFolder = item.type === 'folder';
  const asset = item.type !== 'folder' ? (item as Asset) : null;

  const {
    renameDialog, openRenameDialog: openRenameDialogDomain, closeRenameDialog, 
    detailsDialog, openDetailsDialog: openDetailsDialogDomain, closeDetailsDialog,
    moveDialog, openMoveDialog: openMoveDialogDomain, closeMoveDialog
  } = useAssetItemDialogs();

  // Create wrapper functions to convert ComponentAsset to Domain Asset
  const openRenameDialog = (asset: Asset) => openRenameDialogDomain(componentAssetToDomainAsset(asset));
  const openDetailsDialog = (asset: Asset) => openDetailsDialogDomain(componentAssetToDomainAsset(asset));
  const openMoveDialog = (asset: Asset) => openMoveDialogDomain(componentAssetToDomainAsset(asset));

  const itemActions = asset ? useAssetItemActions({ 
    item: componentAssetToDomainAsset(asset),
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

  // Use the appropriate timestamp for "Last Modified" display
  let lastModified: string;
  if (asset) {
    // For assets, use updated_at if available, otherwise fall back to created_at
    lastModified = asset.updated_at || asset.created_at;
  } else {
    // For folders, use updatedAt if available, otherwise fall back to createdAt
    const folder = item as any; // Type assertion since we know it's a folder
    lastModified = folder.updatedAt ? folder.updatedAt.toISOString() : folder.createdAt.toISOString();
  }

  const fileSize = asset?.size ? `${(asset.size / 1024).toFixed(1)} KB` : '-';

  const MAX_INLINE_TAGS = 3;
  const assetTagsData: any[] = asset?.tags ?? []; // Use any[] to avoid PlainTag vs Tag type mismatch
  const inlineTagsData = assetTagsData.slice(0, MAX_INLINE_TAGS);
  const overflowCountData = assetTagsData.length - inlineTagsData.length;

  return (
    <>
      <div className="flex w-full items-center p-2 hover:bg-muted/50 rounded-md gap-4 border-b last:border-b-0">
        {damTableColumns.map((col) => {
          const { content, displayColumn } = getCellContent(
            col,
            item,
            isFolder,
            asset,
            inlineTagsData,
            overflowCountData,
            assetTagsData,
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