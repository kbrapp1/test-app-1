'use client';

import React, { useState, useActionState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createFolder } from '@/lib/actions/dam/index'; // Updated import path
import { toast } from 'sonner'; // Assuming you use sonner for toasts
import { FolderPlus } from 'lucide-react';
import { useFolderStore } from '@/lib/store/folderStore';
import { type Folder } from '@/types/dam';
import { useRouter } from 'next/navigation';

// Simplified state for the action
interface ActionState {
  success: boolean;
  error?: string;
  folder?: Folder;
  folderId?: string;
}

// Add prop for current folder ID
interface NewFolderDialogProps {
  currentFolderId: string | null;
}

const initialState: ActionState = {
  success: false,
};

export function NewFolderDialog({ currentFolderId }: NewFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addFolder } = useFolderStore();
  const [state, formAction, isPending] = useActionState(createFolder, initialState);
  const formRef = useRef<HTMLFormElement>(null); // Ref to reset form
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success('Folder created successfully!');
      if (state.folder) {
        addFolder(state.folder);
        router.push(`/dam?folderId=${state.folder.id}`);
      }
      setIsOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(`Error: ${state.error}`);
    }
  }, [state, addFolder, router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="mr-2 h-4 w-4" /> New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4">
          {/* Hidden input for parentFolderId */}
          {currentFolderId && (
            <input type="hidden" name="parentFolderId" value={currentFolderId} />
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name"
                name="name" // Make sure name attribute matches expected input for action
                placeholder="e.g., Marketing Assets"
                className="col-span-3" 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 