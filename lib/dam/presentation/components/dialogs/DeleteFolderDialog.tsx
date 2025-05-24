'use client';

import React, { useState, useEffect, useActionState } from 'react';
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
import { deleteFolderAction } from '@/lib/actions/dam/folder.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useFolderStore } from '@/lib/store/folderStore';

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  /** Optional callback when folder is successfully deleted */
  onDeleted?: () => void;
}

interface ActionState {
  success: boolean;
  error?: string;
  folderId?: string; // ID of the deleted folder (returned by deleteFolder)
  parentFolderId?: string | null; // Parent ID for navigation
}

const initialState: ActionState = { success: false };

/**
 * Domain DeleteFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities through actions
 * - Delegates to domain actions (deleteFolderAction)
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
  const [state, formAction, isPending] = useActionState(deleteFolderAction, initialState);
  const { removeFolder } = useFolderStore();

  // Show toast and close dialog on success or show error
  useEffect(() => {
    if (state.success) {
      toast.success(`Folder "${folderName}" deleted successfully.`);
      // Remove folder from store immediately
      if (state.folderId) {
        removeFolder(state.folderId);
      }
      
      // Dispatch global event for gallery refresh
      window.dispatchEvent(new CustomEvent('folderUpdated', { 
        detail: { 
          type: 'delete', 
          folderId: state.folderId, 
          folderName: folderName 
        } 
      }));
      
      // Navigate to parent folder or root after delete
      const parentPath = state.parentFolderId ? `/dam?folderId=${state.parentFolderId}` : '/dam';
      router.push(parentPath);
      router.refresh();
      onClose(); 
      
      // Call optional callback
      if (onDeleted) {
        onDeleted();
      }
    } else if (state.error) {
      toast.error(`Error: ${state.error}`);
    }
  }, [state, folderName, onClose, removeFolder, router, onDeleted]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the folder "{folderName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="folderId" value={folderId} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 