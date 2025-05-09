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
import { useToast } from '@/components/ui/use-toast';
import { updateFolder } from '@/lib/actions/dam'; // Assuming this is the correct path
import { toast } from 'sonner';
import { useFolderStore } from '@/lib/store/folderStore';

interface RenameFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  currentName: string;
}

const initialState: { success: boolean; error?: string; folderId?: string } = {
  success: false,
  error: undefined,
  folderId: undefined,
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
  const { toast } = useToast();

  // Ensure the input field resets when the currentName prop changes (e.g., opening dialog for a different folder)
  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]); // Also depend on isOpen to reset when dialog re-opens

  // Bind folderId to the action
  const updateFolderWithId = updateFolder.bind(null, initialState);
  // The `prevState` for `updateFolder` is `initialState`
  // The `formData` will be implicitly passed by `form` element
  // However, server actions called by useFormState expect prevState as the first arg, then formData
  // Our `updateFolder` is defined as: export async function updateFolder(prevState: FolderActionResult, formData: FormData)
  // We also need to pass folderId and newName in formData
  
  // Create a new action that preserves prevState and then passes our specific formData
  const dispatchAction = async (prevState: typeof initialState, formPayload: FormData) => {
    formPayload.append('folderId', folderId); // Add folderId to the form data
    formPayload.append('newName', name); // Add newName from local state to form data
    return updateFolderWithId(formPayload); // updateFolder expects prevState, then formData
  };

  const [state, formAction] = useActionState(dispatchAction, initialState);


  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Folder Renamed',
        description: `Folder "${currentName}" has been successfully renamed to "${name}".`,
      });
      onClose(); // Close the dialog on success
      // Consider revalidating relevant paths or relying on `revalidatePath` in server action
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Rename Failed',
        description: state.error,
      });
    }
  }, [state, currentName, name, onClose, toast]);

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
                name="newNameInput" // This name is for the input element, actual newName is passed via formPayload.append
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