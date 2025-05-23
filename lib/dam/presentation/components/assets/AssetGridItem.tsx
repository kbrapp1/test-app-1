import React, { useRef, useEffect, useState } from 'react';
import { ComponentAsset as Asset, ComponentFolder as Folder, CombinedItem } from '@/lib/dam/types/component';import { AssetThumbnail, AssetThumbnailRef } from './AssetThumbnail';import { FolderThumbnail } from '../folders/FolderThumbnail';
import { Folder as FolderIcon, FileText } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { InputDialog, AssetDetailsModal, FolderPickerDialog } from '../dialogs';
import { useAssetItemDialogs, useAssetItemActions } from '../../hooks';import { AssetActionDropdownMenu } from './AssetActionDropdownMenu';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import { Asset as DomainAsset } from '../../../domain/entities/Asset';
import { Tag as DomainTag } from '../../../domain/entities/Tag';

// Helper function to convert component Asset to domain Asset
function componentAssetToDomainAsset(componentAsset: Asset): DomainAsset {
  return new DomainAsset({
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

export interface AssetGridItemProps {
  item: CombinedItem;
  index?: number; 
  priorityThreshold?: number; 
  onDataChange: () => Promise<void>;
}

/**
 * Domain presentation component for rendering a single item in the asset grid
 * Handles both folders and assets with proper domain architecture patterns
 */
export const AssetGridItem = React.forwardRef<
  HTMLDivElement,
  AssetGridItemProps
>(({ item, index, priorityThreshold, onDataChange }, ref) => {
  const assetThumbnailRef = useRef<AssetThumbnailRef>(null);

  const {
    renameDialog,
    openRenameDialog,
    closeRenameDialog,
    detailsDialog,
    openDetailsDialog,
    closeDetailsDialog,
    moveDialog,
    openMoveDialog,
    closeMoveDialog,
  } = useAssetItemDialogs();

  const isFolder = item.type === 'folder';
  const asset = !isFolder ? (item as Asset) : null;

  const itemActions = asset ? useAssetItemActions({
    item: componentAssetToDomainAsset(asset),
    onDataChange,
    closeRenameDialog,
    closeMoveDialog,
  }) : null;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type: item.type, item: item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : undefined,
  };
  
  const dynamicCardStyle = isDragging ? { opacity: 0.5 } : {};

  // Tag clamping configuration
  const MAX_INLINE_TAGS = 3;
  const assetTags: any[] = item.type === 'asset' ? (item as Asset).tags ?? [] : [];
  const inlineTags = assetTags.slice(0, MAX_INLINE_TAGS);
  const overflowCount = assetTags.length - inlineTags.length;

  const handleDeleteClick = () => {
    if (item.type === 'asset' && assetThumbnailRef.current) {
      assetThumbnailRef.current.triggerDeleteDialog();
    } else if (item.type === 'folder') {
      console.warn("Folder deletion not yet implemented via 3-dot menu.");
    }
  };
  
  const cardHeaderContent = (
    <>
      <div className="flex items-center truncate min-w-0">
        {item.type === 'folder' 
          ? <FolderIcon className="w-4 h-4 mr-2 shrink-0" /> 
          : <FileText className="w-4 h-4 mr-2 shrink-0" />}
        <span className="truncate font-medium text-sm">{item.name}</span>
      </div>
      
      {item.type === 'asset' && itemActions && (
        <div className="shrink-0">
          <AssetActionDropdownMenu
            item={item as Asset}
            onViewDetails={(e: React.MouseEvent) => { e.stopPropagation(); openDetailsDialog(componentAssetToDomainAsset(item as Asset)); }}
            onOpenRenameDialog={(e: React.MouseEvent) => { e.stopPropagation(); openRenameDialog(componentAssetToDomainAsset(item as Asset)); }}
            onOpenMoveDialog={(e: React.MouseEvent) => { e.stopPropagation(); openMoveDialog(componentAssetToDomainAsset(item as Asset)); }}
            onDownload={itemActions.handleDownload}
            onDelete={handleDeleteClick}
            isDownloading={itemActions.isDownloading}
            isPendingRename={itemActions.isPendingRename}
            isPendingMove={itemActions.isPendingMove}
          />
        </div>
      )}
      {item.type === 'folder' && (
         <div className="w-[28px] h-[28px] shrink-0" />
      )}
    </>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group/card relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div 
        className="p-2 border-b flex justify-between items-center"
        style={dynamicCardStyle}
      >
        {cardHeaderContent}
      </div>
      {item.type === 'asset' ? (
        <AssetThumbnail
          ref={assetThumbnailRef}
          src={(item as Asset).publicUrl || ''}
          alt={(item as Asset).name}
          assetId={(item as Asset).id}
          folderId={(item as Asset).folder_id}
          type="asset"
          mimeType={(item as Asset).mime_type}
          onDataChange={onDataChange}
        />
      ) : (
        <FolderThumbnail folder={item as Folder} />
      )}

      {/* Display Tags for Assets */}
      {assetTags.length > 0 && (
        <div className="p-2 border-t flex items-center gap-1 overflow-hidden flex-nowrap">
          {inlineTags.map((tag: any) => (
            <Tooltip key={tag.id}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs truncate max-w-[5rem]">
                  {tag.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tag.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflowCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-pointer">
                  +{overflowCount} more
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="p-2 flex flex-wrap gap-1 max-w-xs">
                {assetTags.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs truncate max-w-[7rem]">
                    {tag.name}
                  </Badge>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Dialogs */}
      {renameDialog.isOpen && renameDialog.data && itemActions && (
        <InputDialog
          isOpen={renameDialog.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && closeRenameDialog()}
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
          onOpenChange={(isOpen: boolean) => !isOpen && closeDetailsDialog()}
          assetId={detailsDialog.data.id}
          onAssetUpdated={() => onDataChange()}
        />
      )}
      {moveDialog.isOpen && moveDialog.data && itemActions && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && closeMoveDialog()}
          onFolderSelect={itemActions.handleMoveConfirm}
          currentAssetFolderId={moveDialog.data.folderId}
          assetName={moveDialog.data.name}
        />
      )}
    </div>
  );
});

AssetGridItem.displayName = 'AssetGridItem'; 