'use client';

import React, { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useFolderStore } from '@/lib/store/folderStore';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useFolderCreate } from '@/lib/dam/hooks/useAssets';

// Props for the NewFolderDialog component
interface NewFolderDialogOwnProps {
  currentFolderId: string | null;
  asIcon?: boolean;
  onFolderCreated?: () => void; // Optional callback when folder is created
}

// Combine own props with props forwarded from TooltipTrigger
type NewFolderDialogProps = NewFolderDialogOwnProps & 
  Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>, 'asChild'>;

/**
 * Domain NewFolderDialog Component
 * 
 * Follows DDD principles:
 * - Uses domain entities (Folder)
 * - Delegates to React Query mutations for proper cache management
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
  const [folderName, setFolderName] = useState('');
  const { refetchFolderData } = useFolderStore();
  const folderCreateMutation = useFolderCreate();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      return;
    }

    try {
      await folderCreateMutation.mutateAsync({
        name: folderName.trim(),
        parentFolderId: currentFolderId
      });

      // Close dialog and reset form
      setIsOpen(false);
      setFolderName('');
      
      toast.success('Folder created successfully!');
      
      // Refetch the folder tree data from server to show the new folder immediately
      try {
        await refetchFolderData();
      } catch {
        // Silently handle folder tree refresh failure
      }
      
      // Call callback if provided
      if (onFolderCreated) {
        onFolderCreated();
      }
      
    } catch (error) {
      toast.error(`Error: ${(error as Error).message || 'Failed to create folder'}`);
    }
  };

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
        <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Marketing Assets"
                className="col-span-3" 
                required 
                autoComplete="off"
                disabled={folderCreateMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                setFolderName('');
              }} 
              disabled={folderCreateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={folderCreateMutation.isPending || !folderName.trim()}
            >
              {folderCreateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {folderCreateMutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
