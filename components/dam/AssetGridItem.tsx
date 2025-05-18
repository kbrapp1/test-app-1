import React, { useRef, useEffect } from 'react';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { AssetThumbnail, AssetThumbnailRef } from './AssetThumbnail';
import { FolderThumbnail } from './FolderThumbnail';
import { Folder as FolderIcon, FileText } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { InputDialog } from '@/components/dam/dialogs/InputDialog';
import { AssetDetailsDialog } from '@/components/dam/dialogs/AssetDetailsDialog';
import { FolderPickerDialog } from '@/components/dam/dialogs/FolderPickerDialog';
import { useAssetItemDialogs } from './hooks/useAssetItemDialogs';
import { useAssetItemActions } from './hooks/useAssetItemActions';
import { AssetActionDropdownMenu } from './AssetActionDropdownMenu';
import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/lib/actions/dam/tag.actions';

export interface AssetGridItemProps {
  item: CombinedItem;
  index?: number; 
  priorityThreshold?: number; 
  onDataChange: () => Promise<void>;
}

/**
 * Renders a single item in the asset grid, handling both folders and assets
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

  // Ensure actions hook is only instantiated for assets
  const itemActions = item.type === 'asset' ? useAssetItemActions({
    item: item as Asset,
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
            onViewDetails={(e) => { e.stopPropagation(); openDetailsDialog(item as Asset); }}
            onOpenRenameDialog={(e) => { e.stopPropagation(); openRenameDialog(item as Asset); }}
            onOpenMoveDialog={(e) => { e.stopPropagation(); openMoveDialog(item as Asset); }}
            onDownload={itemActions.handleDownload}
            onDelete={handleDeleteClick} // Delete still needs its specific trigger logic
            isDownloading={itemActions.isDownloading}
            isPendingRename={itemActions.isPendingRename}
            isPendingMove={itemActions.isPendingMove}
          />
        </div>
      )}
      {item.type === 'folder' && (
         <div className="w-[28px] h-[28px] shrink-0" /> // Placeholder for alignment if no dropdown
      )}
    </>
  );

  return (
    <div
      ref={setNodeRef} // Ensure ref from forwardRef is also applied if needed, or use setNodeRef for dnd
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
          src={(item as Asset).publicUrl}
          alt={item.name}
          assetId={item.id}
          folderId={(item as Asset).folder_id}
          type={'asset'}
          isPriority={index !== undefined && priorityThreshold !== undefined && index < priorityThreshold}
          mimeType={(item as Asset).mime_type}
          onDataChange={onDataChange}
        />
      ) : (
        <FolderThumbnail folder={item as Folder} />
      )}

      {/* Display Tags for Assets */}
      {item.type === 'asset' && (item as Asset).tags && (item as Asset).tags!.length > 0 && (
        <div className="p-2 border-t flex flex-wrap gap-1">
          {(item as Asset).tags!.map((tag: Tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {renameDialog.isOpen && renameDialog.data && itemActions && (
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
      {moveDialog.isOpen && moveDialog.data && itemActions && (
        <FolderPickerDialog
          isOpen={moveDialog.isOpen}
          onOpenChange={(isOpen) => !isOpen && closeMoveDialog()}
          onFolderSelect={itemActions.handleMoveConfirm}
          currentAssetFolderId={moveDialog.data.folder_id}
          assetName={moveDialog.data.name}
        />
      )}
    </div>
  );
});

AssetGridItem.displayName = 'AssetGridItem'; 