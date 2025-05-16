import React from 'react';
import type { CombinedItem, Folder, Asset } from '@/types/dam';
import { Folder as FolderIcon, FileText as FileIcon, MoreVertical } from 'lucide-react'; // Common icons
import { Button } from '@/components/ui/button';
// import { AssetActionDropdownMenu } from './AssetActionDropdownMenu'; // Will be similar to this
// import { useAssetItemDialogs } from './hooks/useAssetItemDialogs';
// import { useAssetItemActions } from './hooks/useAssetItemActions';

export interface AssetListItemProps {
  item: CombinedItem;
  onDataChange: () => void;
  // selected: boolean; // If we add selection
  // onSelect: (itemId: string) => void;
}

export const AssetListItem: React.FC<AssetListItemProps> = ({ item, onDataChange }) => {
  const isFolder = item.type === 'folder';
  const asset = item as Asset; // Type assertion for convenience, use with caution or type check
  const folder = item as Folder;

  // Placeholder for dialogs and actions hooks
  // const { 
  //   renameDialog, openRenameDialog, closeRenameDialog, 
  //   detailsDialog, openDetailsDialog, closeDetailsDialog,
  //   moveDialog, openMoveDialog, closeMoveDialog
  // } = useAssetItemDialogs();

  // const { 
  //   handleDownload, isDownloading, 
  //   handleRenameSubmit, isPendingRename,
  //   handleMoveConfirm, isPendingMove
  // } = useAssetItemActions({ 
  //   item: asset, // This needs to be conditional or handled if it's a folder
  //   onDataChange,
  //   closeRenameDialog,
  //   closeMoveDialog,
  // });

  // const handleDelete = () => { /* Placeholder */ };

  const lastModified = item.created_at;
  // const fileSize = asset.metadata?.size ? prettyBytes(asset.metadata.size) : '-'; // If we add prettyBytes
  const fileSize = !isFolder && asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : '-';

  return (
    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md gap-4 border-b last:border-b-0">
      <div className="flex-shrink-0">
        {isFolder ? <FolderIcon className="h-5 w-5 text-blue-500" /> : <FileIcon className="h-5 w-5 text-gray-500" />}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {/* <p className="text-xs text-muted-foreground truncate">{item.id}</p> */}
      </div>
      {!isFolder && (
        <div className="flex-shrink-0 text-xs text-muted-foreground w-24 text-right truncate">
          {fileSize}
        </div>
      )}
      <div className="flex-shrink-0 text-xs text-muted-foreground w-32 text-right truncate">
        {new Date(lastModified).toLocaleDateString()} {new Date(lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="flex-shrink-0">
        {/* Placeholder for actions dropdown */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
        {/* 
          <AssetActionDropdownMenu 
            item={asset} // Needs to be conditional if folder actions are different
            onViewDetails={() => openDetailsDialog(asset)}
            onOpenRenameDialog={() => openRenameDialog(asset)}
            onOpenMoveDialog={() => openMoveDialog(asset)}
            onDownload={handleDownload}
            onDelete={handleDelete} // Placeholder
            isDownloading={isDownloading}
            isPendingRename={isPendingRename}
            isPendingMove={isPendingMove}
          />
        */}
      </div>

      {/* Dialogs would go here, similar to AssetGridItem */}
      {/* <InputDialog {...} /> */}
      {/* <AssetDetailsDialog {...} /> */}
      {/* <FolderPickerDialog {...} /> */}
    </div>
  );
}; 