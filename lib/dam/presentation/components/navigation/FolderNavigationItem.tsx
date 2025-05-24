"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown, AlertCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { RenameFolderDialog } from '@/lib/dam/presentation/components/dialogs/RenameFolderDialog';
import { DeleteFolderDialog } from '@/lib/dam/presentation/components/dialogs/DeleteFolderDialog';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

/**
 * Props for the folder navigation item component
 */
export interface FolderNavigationItemProps {
  /** Folder node data from the store */
  folderNode: FolderNode;
  /** Nesting level for visual indentation */
  level: number;
  /** Currently selected folder ID */
  currentFolderId: string | null;
}

/**
 * Domain Folder Navigation Item Component
 * 
 * Recursive component that renders individual folder items in the navigation tree with:
 * - Expandable/collapsible hierarchy
 * - Active state highlighting
 * - Folder management actions (rename, delete)
 * - Loading and error states
 * - Domain entity integration
 * 
 * @component
 * @example
 * ```tsx
 * <FolderNavigationItem 
 *   folderNode={folderNode} 
 *   level={0} 
 *   currentFolderId={selectedId} 
 * />
 * ```
 */
export function FolderNavigationItem({ 
  folderNode,
  level,
  currentFolderId,
}: FolderNavigationItemProps) {

  // Get folder store actions
  const { toggleExpand, fetchAndSetChildren } = useFolderStore();
  const { toast } = useToast();

  // Local dialog state management
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);

  /**
   * Fetcher function for loading child folders from API
   */
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

  /**
   * Handle folder expand/collapse with lazy loading
   */
  const handleToggleExpand = async () => {
    const aboutToExpand = !folderNode.isExpanded;
    toggleExpand(folderNode.id);

    // Load children if expanding and children not yet loaded
    if (aboutToExpand && folderNode.children === null) { 
      await fetchAndSetChildren(folderNode.id, treeFetcherFunction);
    }
  };

  const isActive = folderNode.id === currentFolderId;

  /**
   * Open rename dialog with fresh key for re-mounting
   */
  const handleOpenRenameDialog = () => {
    setDialogKey(prevKey => prevKey + 1);
    setIsRenameDialogOpen(true);
  };

  /**
   * Open delete dialog with fresh key for re-mounting
   */
  const handleOpenDeleteDialog = () => {
    setDeleteDialogKey(prevKey => prevKey + 1);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div>
      {/* Folder Item Row */}
      <div className={cn(
        "flex items-center justify-between px-1 rounded-md group relative py-2",
        isActive 
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
          : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )} style={{ paddingLeft: `${level * 1.25}rem` }}>
        
        {/* Expand/Collapse Button and Folder Link */}
        <div className="flex items-center flex-1 min-w-0 mr-2">
          <Button 
            variant="ghost" 
            onClick={handleToggleExpand}
            className="pl-2 pr-1 py-1 h-6 w-6 mr-1 flex items-center justify-center flex-shrink-0"
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
            className="flex items-center min-w-0 flex-1">
            <FolderIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span 
              className="truncate font-medium text-sm flex-1" 
              title={folderNode.name || '[NO NAME]'}
            >
              {folderNode.name || '[NO NAME]'}
            </span>
          </Link>
        </div>
        
        {/* Folder Actions Menu */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0",
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

      {/* Child Folders (Recursive) */}
      <div className="mt-1">
        {folderNode.isExpanded && folderNode.children && folderNode.children.map(childNode => (
          <FolderNavigationItem 
            key={childNode.id} 
            folderNode={childNode} 
            level={level + 1} 
            currentFolderId={currentFolderId}
          />
        ))}
      </div>

      {/* Management Dialogs */}
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