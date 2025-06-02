'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useFolderStore } from '@/lib/store/folderStore';
import { useFolderDelete } from '@/lib/dam/hooks/useAssets';
import { Loader2 } from 'lucide-react';

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  /** Optional callback when folder is successfully deleted */
  onDeleted?: () => void;
}

/**
 * Domain DeleteFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities through React Query mutations
 * - Delegates to React Query mutations for proper cache management
 * - Clean separation of UI and business logic
 * - Proper error handling and navigation
 */
export function DeleteFolderDialog({ 
  isOpen, 
  onClose, 
  folderId, 
  folderName, 
  onDeleted 
}: DeleteFolderDialogProps) {
  if (!isOpen) return null;
  
  const router = useRouter();
  const { removeFolder, refetchFolderData } = useFolderStore();
  const folderDeleteMutation = useFolderDelete();

  const handleConfirmDelete = async () => {
    try {
      await folderDeleteMutation.mutateAsync(folderId);
      
      toast.success(`Folder "${folderName}" deleted successfully.`);
      
      // Remove folder from store immediately for optimistic update
      removeFolder(folderId);
      
      // Refetch folder tree data to ensure consistency
      try {
        await refetchFolderData();
      } catch (error) {
        // Silently handle folder tree refresh failure
      }
      
      // Close dialog
      onClose();
      
      // Call optional callback
      if (onDeleted) {
        onDeleted();
      }
      
    } catch (error) {
      toast.error(`Error: ${(error as Error).message || 'Failed to delete folder'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the folder "{folderName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={folderDeleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirmDelete}
            disabled={folderDeleteMutation.isPending}
          >
            {folderDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {folderDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
