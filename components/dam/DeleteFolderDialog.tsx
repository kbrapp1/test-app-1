'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { deleteFolder } from '@/lib/actions/dam/index';
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

export function DeleteFolderDialog({ isOpen, onClose, folderId, folderName, onDeleted }: DeleteFolderDialogProps) {
  if (!isOpen) return null;
  const router = useRouter();
  // Bind deleteFolder action
  const [state, formAction, isPending] = useActionState(deleteFolder, initialState);
  const { removeFolder } = useFolderStore(); // Get store action

  // Show toast and close dialog on success or show error
  useEffect(() => {
    if (state.success) {
      toast.success(`Folder "${folderName}" deleted successfully.`);
      // Remove folder from store immediately
      if (state.folderId) {
        removeFolder(state.folderId);
      }
      // Navigate to parent folder or root after delete
      const parentPath = state.parentFolderId ? `/dam?folderId=${state.parentFolderId}` : '/dam';
      router.push(parentPath);
      router.refresh();
      onClose(); 
    } else if (state.error) {
      toast.error(`Error: ${state.error}`);
    }
  }, [state, folderName, onClose, removeFolder, router]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="folderId" value={folderId} />
          <p>
            Are you sure you want to delete the folder "{folderName}"? This action cannot be undone.
          </p>
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