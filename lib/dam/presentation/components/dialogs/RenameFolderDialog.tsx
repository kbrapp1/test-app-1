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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useFolderStore } from '@/lib/store/folderStore';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';
import { useFolderRename } from '@/lib/dam/hooks/useAssets';
import { Loader2 } from 'lucide-react';

interface RenameFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  currentName: string;
}

// Removed initialState and SubmitButton - using React Query mutation instead

/**
 * Domain RenameFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities (Folder)
 * - Uses React Query mutations for proper cache management
 * - Clean separation of UI and business logic
 * - Proper error handling and state management
 */
export function RenameFolderDialog({
  isOpen,
  onClose,
  folderId,
  currentName,
}: RenameFolderDialogProps) {
  const folderRenameMutation = useFolderRename();
  const { updateFolderNodeInStore, forceRefresh, refetchFolderData } = useFolderStore();
  const [newName, setNewName] = useState(currentName || '');

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim() || newName.trim() === currentName) {
      return;
    }

    try {
      await folderRenameMutation.mutateAsync({
        folderId,
        newName: newName.trim()
      });

      toast.success(`Folder renamed to "${newName.trim()}" successfully.`);
      
      // Refetch the folder tree data from server to get the updated folder name
      // This ensures the tree view shows the renamed folder immediately
      try {
        await refetchFolderData();
      } catch (error) {
        // Silently handle folder tree refresh failure
        forceRefresh();
      }
      
      onClose();
    } catch (error) {
      toast.error(`Error: ${(error as Error).message || 'Failed to rename folder'}`);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter the new name for the folder below. The current name is &ldquo;{currentName}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                New Name
              </Label>
              <Input
                id="folderName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                required
                disabled={folderRenameMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={folderRenameMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={folderRenameMutation.isPending || !newName.trim() || newName.trim() === currentName}
            >
              {folderRenameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {folderRenameMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
