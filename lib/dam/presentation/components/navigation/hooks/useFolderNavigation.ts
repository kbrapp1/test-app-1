'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { FolderTreeFetcher } from '../services/FolderTreeFetcher';

interface UseFolderNavigationProps {
  folderNode: FolderNode;
}

interface UseFolderNavigationReturn {
  isRenameDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  dialogKey: number;
  deleteDialogKey: number;
  setIsRenameDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  handleToggleExpand: () => Promise<void>;
  handleOpenRenameDialog: () => void;
  handleOpenDeleteDialog: () => void;
}

/**
 * useFolderNavigation Hook
 * Follows Single Responsibility Principle - manages folder navigation state and business logic
 */
export const useFolderNavigation = ({ 
  folderNode 
}: UseFolderNavigationProps): UseFolderNavigationReturn => {
  const { toggleExpand, fetchAndSetChildren } = useFolderStore();
  const { toast } = useToast();

  // Local dialog state management
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);

  /**
   * Handle folder expand/collapse with lazy loading
   */
  const handleToggleExpand = useCallback(async () => {
    const aboutToExpand = !folderNode.isExpanded;
    toggleExpand(folderNode.id);

    // Load children if expanding and children not yet loaded
    if (aboutToExpand && folderNode.children === null) {
      try {
        await fetchAndSetChildren(folderNode.id, FolderTreeFetcher.fetchChildFolders);
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message || "An unexpected error occurred while fetching folder data.",
          variant: "destructive",
        });
      }
    }
  }, [folderNode.id, folderNode.isExpanded, folderNode.children, toggleExpand, fetchAndSetChildren, toast]);

  /**
   * Open rename dialog with fresh key for re-mounting
   */
  const handleOpenRenameDialog = useCallback(() => {
    setDialogKey(prevKey => prevKey + 1);
    setIsRenameDialogOpen(true);
  }, []);

  /**
   * Open delete dialog with fresh key for re-mounting
   */
  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteDialogKey(prevKey => prevKey + 1);
    setIsDeleteDialogOpen(true);
  }, []);

  return {
    isRenameDialogOpen,
    isDeleteDialogOpen,
    dialogKey,
    deleteDialogKey,
    setIsRenameDialogOpen,
    setIsDeleteDialogOpen,
    handleToggleExpand,
    handleOpenRenameDialog,
    handleOpenDeleteDialog,
  };
}; 
