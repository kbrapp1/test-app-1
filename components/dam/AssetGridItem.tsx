import React, { useRef, useTransition } from 'react';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { AssetThumbnail, AssetThumbnailRef } from './AssetThumbnail';
import { FolderThumbnail } from './FolderThumbnail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, Edit3, Trash2, Folder as FolderIcon, FileText, Loader2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getAssetDownloadUrl } from '@/lib/actions/dam/asset.actions';
import { toast } from 'sonner';

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
  const [isDownloading, startDownloadTransition] = useTransition();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type: item.type, item: item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : undefined,
  };
  
  const dynamicCardStyle = isDragging ? { opacity: 0.5 } : {};

  const handleDownload = async () => {
    if (item.type === 'asset') {
      const asset = item as Asset;
      startDownloadTransition(async () => {
        try {
          console.log('Requesting download URL for asset:', asset.name);
          const result = await getAssetDownloadUrl(asset.id);

          if (result.success && result.url) {
            console.log('Received signed URL:', result.url);
            const link = document.createElement('a');
            link.href = result.url;
            link.setAttribute('download', asset.name || 'download');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Downloading ${asset.name}...`);
          } else {
            console.error('Failed to get download URL:', result.error);
            toast.error(result.error || 'Could not prepare download.');
          }
        } catch (error) {
          console.error('Error during download process:', error);
          toast.error('An unexpected error occurred while trying to download.');
        }
      });
    }
  };

  const handleDeleteClick = () => {
    console.log('AssetGridItem: handleDeleteClick triggered for item:', item.id);
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
          ? <FolderIcon className="w-4 h-4 mr-2 flex-shrink-0" /> 
          : <FileText className="w-4 h-4 mr-2 flex-shrink-0" />}
        <span className="truncate font-medium text-sm">{item.name}</span>
      </div>
      
      {item.type === 'asset' ? (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48" 
              align="end" 
              side="bottom"
              sideOffset={5}
              alignOffset={0}
            >
              <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteClick} 
                className="text-red-600 hover:!text-red-600 focus:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50 focus:!bg-red-50 dark:focus:!bg-red-900/50 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="w-[28px] h-[28px] flex-shrink-0" />
      )}
    </>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group/card relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          isPriority={index !== undefined && priorityThreshold !== undefined && index < priorityThreshold && (item as Asset).mime_type?.startsWith('image/')}
          mimeType={(item as Asset).mime_type}
          onDataChange={onDataChange}
        />
      ) : (
        <FolderThumbnail folder={item as Folder} />
      )}
    </div>
  );
});

AssetGridItem.displayName = 'AssetGridItem'; 