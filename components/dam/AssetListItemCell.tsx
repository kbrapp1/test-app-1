import React from 'react';
import type { CombinedItem, Asset, Tag } from '@/types/dam';
import { Folder as FolderIcon, FileText as FileIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AssetActionDropdownMenu } from './AssetActionDropdownMenu';
import type { damTableColumns } from './dam-column-config'; // Use type import if only type is needed
import type { useAssetItemActions } from './hooks/useAssetItemActions'; // Type for itemActions return

// Helper function to determine cell content
export const getCellContent = (
  col: typeof damTableColumns[0],
  item: CombinedItem,
  isFolder: boolean,
  asset: Asset | null,
  inlineTags: Tag[],
  overflowCount: number,
  assetTags: Tag[],
  fileSize: string,
  lastModified: string,
  itemActions: ReturnType<typeof useAssetItemActions> | null,
  openDetailsDialog: (data: Asset) => void,
  openRenameDialog: (data: Asset) => void,
  openMoveDialog: (data: Asset) => void,
  requestDelete: () => void
) => {
  let content: React.ReactNode = null;
  let displayColumn = true;

  switch (col.id) {
    case 'icon':
      content = isFolder ? <FolderIcon className="h-5 w-5 text-blue-500" /> : <FileIcon className="h-5 w-5 text-gray-500" />;
      break;
    case 'name':
      content = <p className="text-sm font-medium truncate">{item.name}</p>;
      break;
    case 'location':
      if (col.isAssetOnly && asset) {
        content = asset.parentFolderName || '-';
      } else if (col.isAssetOnly && isFolder && (col.cellStyle?.width || col.cellClassName?.includes('w-'))) {
        content = <div />;
      } else if (!col.isAssetOnly) {
        content = '-';
      } else {
        displayColumn = false;
      }
      break;
    case 'tags':
      if (col.isAssetOnly && asset) {
        content = (
          <div className="flex items-center gap-1">
            {inlineTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-pointer">
                    +{overflowCount} more
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="p-2 flex flex-wrap gap-1 max-w-xs">
                  {assetTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      } else if (col.isAssetOnly && isFolder && (col.cellStyle?.width || col.cellClassName?.includes('w-'))) {
        content = <div />;
      } else if (!col.isAssetOnly) {
        content = '-';
      } else {
        displayColumn = false;
      }
      break;
    case 'owner':
      content = item.ownerName || '-';
      break;
    case 'size':
      if (col.isAssetOnly && asset) {
        content = fileSize;
      } else if (col.isAssetOnly && isFolder && (col.cellStyle?.width || col.cellClassName?.includes('w-'))) {
        content = <div />;
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
      if (itemActions && asset) {
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
        if (col.cellStyle?.width || col.cellClassName?.includes('w-')) {
          content = <div className="h-full w-full" />;
        } else {
          displayColumn = false;
        }
      }
      break;
    default:
      displayColumn = false;
  }
  return { content, displayColumn };
}; 