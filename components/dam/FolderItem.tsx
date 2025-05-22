import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown, AlertCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { RenameFolderDialog } from './RenameFolderDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

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

  // Get actions from store
  const { toggleExpand, fetchAndSetChildren } = useFolderStore();
  const { toast } = useToast();

  // Dialog state remains local
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);

  // Define the tree-specific fetcher function
  const treeFetcherFunction = useCallback(async (parentId: string | null): Promise<DomainFolder[]> => {
    const url = parentId 
      ? `/api/dam/folders/tree?parentId=${parentId}` 
      : '/api/dam/folders/tree';
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch child folders' }));
        throw new Error(errorData.message || 'Failed to fetch child folders');
      }
      const jsonData = await response.json();
      if (!Array.isArray(jsonData)) {
        console.error('API did not return an array for child folders:', jsonData);
        if (jsonData && typeof jsonData === 'object' && 'message' in jsonData) {
            throw new Error(jsonData.message || 'API returned an object instead of an array for child folders.');
        }
        throw new Error('API did not return an array for child folders.');
      }
      return jsonData as DomainFolder[];
    } catch (error) {
      console.error('Error fetching child folders:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "An unexpected error occurred while fetching folder data.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const handleToggleExpand = async () => {
    const aboutToExpand = !folderNode.isExpanded;
    toggleExpand(folderNode.id);

    if (aboutToExpand && folderNode.children === null) { 
      await fetchAndSetChildren(folderNode.id, treeFetcherFunction);
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
        "flex items-center justify-between px-1 rounded-md group relative",
        "py-2",
        isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )} style={{ paddingLeft: `${level * 1.25}rem` }}>
        <div className="flex items-center flex-1 truncate mr-2">
          <Button 
            variant="ghost" 
            onClick={handleToggleExpand}
            className="pl-2 pr-1 py-1 h-6 w-6 mr-1 flex items-center justify-center"
            disabled={folderNode.isLoading}
          >
            {folderNode.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : folderNode.hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : folderNode.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          <Link
            href={`/dam?folderId=${folderNode.id}`}
            className="flex items-center truncate"
            legacyBehavior={undefined}>
            <>
              <FolderIcon className="h-5 w-5 mr-2 shrink-0" />
              <span className="truncate font-medium text-sm" title={folderNode.name}>{folderNode.name}</span>
            </>
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