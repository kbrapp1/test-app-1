'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { updateFolderAction } from '@/lib/actions/dam/folder.actions';
import { toast } from 'sonner';
import { useFolderStore } from '@/lib/store/folderStore';
import type { PlainFolder } from '@/lib/dam/types/dam.types';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

interface RenameFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  currentName: string;
}

const initialState: {
  success: boolean;
  error?: string;
  folderId?: string;
  parentFolderId?: string | null;
  folder?: PlainFolder;
} = {
  success: false,
  error: undefined,
  folderId: undefined,
  parentFolderId: null,
  folder: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Renaming...' : 'Rename'}
    </Button>
  );
}

/**
 * Domain RenameFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities (Folder)
 * - Delegates to domain actions (updateFolderAction)
 * - Clean separation of UI and business logic
 * - Proper error handling and state management
 */
export function RenameFolderDialog({
  isOpen,
  onClose,
  folderId,
  currentName,
}: RenameFolderDialogProps) {
    const [name, setName] = useState(currentName);  const [submissionHandled, setSubmissionHandled] = useState(false);    const { updateFolderNodeInStore } = useFolderStore();  useEffect(() => {    if (isOpen) {      setName(currentName);      setSubmissionHandled(false);     }  }, [isOpen, currentName]);  const [state, formAction, isPending] = useActionState(updateFolderAction, initialState);

  useEffect(() => {
    if (submissionHandled) return;

    if (state.success && state.folder) {
      toast.success(`Folder renamed to "${state.folder.name}" successfully.`);
      
            // Convert PlainFolder to DomainFolder for the store      const domainFolder = new DomainFolder({        id: state.folder.id,        name: state.folder.name,        userId: state.folder.userId,        createdAt: state.folder.createdAt,        updatedAt: state.folder.updatedAt,        parentFolderId: state.folder.parentFolderId,        organizationId: state.folder.organizationId,        has_children: state.folder.has_children,      });            console.log('🔄 Updating folder in store:', {        folderId: domainFolder.id,        oldName: currentName,        newName: domainFolder.name,        folderObject: domainFolder      });            updateFolderNodeInStore(domainFolder);
      
      // Dispatch global event for gallery refresh
      window.dispatchEvent(new CustomEvent('folderUpdated', { 
        detail: { 
          type: 'rename', 
          folderId: state.folder.id, 
          newName: state.folder.name 
        } 
      }));
      
      setSubmissionHandled(true); 
      onClose();
    } else if (state.error) {
      toast.error(`Error: ${state.error}`);
      setSubmissionHandled(true); 
    }
  }, [state, currentName, onClose, updateFolderNodeInStore, submissionHandled]);

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
            Enter the new name for the folder below. The current name is "{currentName}".
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="folderId" value={folderId} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                New Name
              </Label>
              <Input
                id="folderName"
                name="newNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 