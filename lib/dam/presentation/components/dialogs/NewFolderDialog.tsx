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
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createFolderActionForm } from '@/lib/dam';
import { toast } from 'sonner';
import { FolderPlus } from 'lucide-react';
import { useFolderStore } from '@/lib/store/folderStore';
import { Folder } from '@/lib/dam/domain/entities/Folder';
import { useRouter } from 'next/navigation';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Simplified state for the action
interface ActionState {
  success: boolean;
  error?: string;
  folder?: Folder;
  folderId?: string;
}

// Props for the NewFolderDialog component
interface NewFolderDialogOwnProps {
  currentFolderId: string | null;
  asIcon?: boolean;
  onFolderCreated?: () => void; // Optional callback when folder is created
}

// Combine own props with props forwarded from TooltipTrigger
type NewFolderDialogProps = NewFolderDialogOwnProps & 
  Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>, 'asChild'>;

const initialState: ActionState = {
  success: false,
};

/**
 * Domain NewFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities (Folder)
 * - Delegates to domain actions (createFolderActionForm)
 * - Clean separation of UI and business logic
 * - Proper error handling and optimistic updates
 */
export function NewFolderDialog({ 
  currentFolderId, 
  asIcon, 
  onFolderCreated, 
  ...forwardedProps
}: NewFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addFolder } = useFolderStore();
  const [state, formAction, isPending] = useActionState(createFolderActionForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      // Close dialog immediately to prevent brief reappearance
      setIsOpen(false);
      formRef.current?.reset();
      
      toast.success('Folder created successfully!');
      
      if (state.folder) {
        // Convert PlainFolder to DomainFolder for the store
        const domainFolder = new Folder({
          id: state.folder.id,
          name: state.folder.name,
          userId: state.folder.userId,
          createdAt: state.folder.createdAt,
          updatedAt: state.folder.updatedAt,
          parentFolderId: state.folder.parentFolderId,
          organizationId: state.folder.organizationId,
          has_children: state.folder.has_children,
        });
        
        addFolder(domainFolder);
        
        // Small delay to ensure dialog closes before navigation
        setTimeout(() => {
        router.push(`/dam?folderId=${state.folder.id}`);
          
          // Dispatch gallery refresh event after navigation to ensure fresh data
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('damDataRefresh'));
          }, 200);
          
          // Call optional callback after navigation
          if (onFolderCreated) {
            onFolderCreated();
      }
        }, 100);
      } else {
        // Call callback immediately if no folder to navigate to
      if (onFolderCreated) {
        onFolderCreated();
        }
      }
    } else if (state.error) {
      toast.error(`Error: ${state.error}`);
    }
  }, [state, addFolder, router, onFolderCreated]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {asIcon ? (
          <Button variant="outline" size="icon" aria-label="New Folder" {...forwardedProps}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" {...forwardedProps}>
            <FolderPlus className="mr-2 h-4 w-4" /> New Folder
          </Button>
        )}
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
                name="name"
                placeholder="e.g., Marketing Assets"
                className="col-span-3" 
                required 
                autoComplete="off"
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
