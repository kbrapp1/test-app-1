import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Folder } from '@/types/dam';
import { RenameFolderDialog } from './RenameFolderDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { useFolderFetch } from '@/hooks/useFolderFetch';

export interface FolderItemProps {
  folderNode: FolderNode;
  level: number;
  currentFolderId: string | null;
}

/**
 * Recursive component that renders a folder item based on data from the Zustand store
 */
export function FolderItem({ 
  folderNode,
  level,
  currentFolderId,
}: FolderItemProps) {

  // Get actions and fetcher from store/hook
  const { toggleExpand, fetchAndSetChildren } = useFolderStore();
  const { fetchFolderChildren } = useFolderFetch(); // Fetcher function

  // Dialog state remains local
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0); // Key for forcing dialog re-render
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);

  const handleToggleExpand = async () => {
    toggleExpand(folderNode.id);
    // If expanding and children haven't been fetched, fetch them
    if (!folderNode.isExpanded && folderNode.children === null) {
      await fetchAndSetChildren(folderNode.id, fetchFolderChildren);
    }
  };

  const isActive = folderNode.id === currentFolderId;

  const handleOpenRenameDialog = () => {
    setDialogKey(prevKey => prevKey + 1);
    setIsRenameDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogKey(prevKey => prevKey + 1);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div>
      <div className={cn(
        "flex items-center justify-between px-1 py-0.5 rounded-md group relative",
        isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )} style={{ paddingLeft: `${level * 1.5}rem` }}>
        <div className="flex items-center flex-1 truncate mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggleExpand}
            className="p-1 h-4 w-4 mr-1 flex items-center justify-center"
            disabled={folderNode.isLoading}
          >
            {folderNode.isLoading ? (
              <span className="animate-spin h-4 w-4">⏳</span>
            ) : folderNode.hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : folderNode.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          <Link href={`/dam?folderId=${folderNode.id}`} className="flex items-center truncate">
            <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate font-medium text-sm" title={folderNode.name}>{folderNode.name}</span>
          </Link>
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100",
                        isActive && "opacity-100"
                    )}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Folder options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenRenameDialog}>
                    Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenDeleteDialog}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-1">
        {folderNode.isExpanded && folderNode.children && folderNode.children.map(childNode => (
          <FolderItem 
            key={childNode.id} 
            folderNode={childNode} 
            level={level + 1} 
            currentFolderId={currentFolderId}
          />
        ))}
      </div>
      
      <RenameFolderDialog 
        key={`rename-${dialogKey}`}
        isOpen={isRenameDialogOpen} 
        onClose={() => setIsRenameDialogOpen(false)}
        folderId={folderNode.id}
        currentName={folderNode.name}
      />
      <DeleteFolderDialog
        key={`delete-${deleteDialogKey}`}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        folderId={folderNode.id}
        folderName={folderNode.name}
      />
    </div>
  );
} 