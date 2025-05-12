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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateFolder } from '@/lib/actions/dam/folder.actions';
import { toast } from 'sonner';
import { useFolderStore } from '@/lib/store/folderStore';
import type { Folder } from '@/types/dam';

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
  folder?: Folder;
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

export function RenameFolderDialog({
  isOpen,
  onClose,
  folderId,
  currentName,
}: RenameFolderDialogProps) {
  const [name, setName] = useState(currentName);
  const { updateFolderNodeInStore } = useFolderStore();
  
  const [submissionHandled, setSubmissionHandled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setSubmissionHandled(false); 
    }
  }, [isOpen, currentName]);

  const updateFolderWithId = updateFolder.bind(null, initialState);
  
  const dispatchAction = async (prevState: typeof initialState, formPayload: FormData) => {
    formPayload.append('folderId', folderId);
    formPayload.append('newName', name);
    return updateFolderWithId(formPayload);
  };

  const [state, formAction] = useActionState(dispatchAction, initialState);

  useEffect(() => {
    if (submissionHandled) {
      return;
    }

    if (state.success && state.folder) {
      toast.success(`Folder "${currentName}" has been successfully renamed to "${state.folder.name}".`);
      
      if (updateFolderNodeInStore) {
        updateFolderNodeInStore(state.folder);
      }
      
      setSubmissionHandled(true); 
      onClose();
    } else if (state.error) {
      toast.error(state.error);
      setSubmissionHandled(true); 
    }
  }, [state, currentName, name, onClose, updateFolderNodeInStore, submissionHandled]);

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
        </DialogHeader>
        <form action={formAction}>
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