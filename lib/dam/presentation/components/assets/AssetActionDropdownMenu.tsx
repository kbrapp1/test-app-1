import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Download, 
  Edit3, 
  Trash2, 
  Loader2, 
  Info, 
  MoveIcon, 
  Star as _Star, 
  ArchiveIcon as _ArchiveIcon, 
  FolderKanban,
  Heart,
  Archive,
} from 'lucide-react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

export interface AssetActionDropdownMenuProps {
  item: GalleryItemDto;
  onViewDetails: (e: React.MouseEvent) => void;
  onOpenRenameDialog: (e: React.MouseEvent) => void;
  onOpenMoveDialog: (e: React.MouseEvent) => void;
  onDownload: () => void;
  onDelete: () => void;
  isDownloading: boolean;
  isPendingRename: boolean;
  isPendingMove: boolean;
}

/**
 * Domain presentation component for asset action dropdown menu
 * Provides comprehensive asset management actions with loading states
 * Uses domain patterns for consistent action handling
 */
export const AssetActionDropdownMenu: React.FC<AssetActionDropdownMenuProps> = ({
  item,
  onViewDetails,
  onOpenRenameDialog,
  onOpenMoveDialog,
  onDownload,
  onDelete,
  isDownloading,
  isPendingRename,
  isPendingMove,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm border border-gray-200/50">
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56"
        align="end" 
        side="bottom"
        sideOffset={5}
        alignOffset={0}
      >
        <DropdownMenuItem onClick={onViewDetails}>
          <Info className="mr-2 h-4 w-4" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenRenameDialog} disabled={isPendingRename}>
          {isPendingRename ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Edit3 className="mr-2 h-4 w-4" />
          )}
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Organize</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem onClick={onOpenMoveDialog} disabled={isPendingMove}>
                {isPendingMove ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MoveIcon className="mr-2 h-4 w-4" />
                )}
                <span>Move</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Implement add to favorites */}}>
                <Heart className="mr-2 h-4 w-4" />
                <span>Add to Favorites</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Implement archive */}}>
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onDelete} 
          className="text-red-600 hover:text-red-600! focus:text-red-600! hover:bg-red-50! dark:hover:bg-red-900/50! focus:bg-red-50! dark:focus:bg-red-900/50! cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 
