'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Folder as DomainFolder } from '../../../domain/entities/Folder';
import { FolderIcon, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { InputDialog } from '../dialogs/InputDialog';
import { ConfirmationDialog } from '../dialogs/ConfirmationDialog';
import { renameFolderClientAction, deleteFolderClientAction } from '@/lib/actions/dam/folder.actions';
import { useToast } from '@/components/ui/use-toast';

export interface FolderListItemProps {
  folder: DomainFolder;
  onDataChange: () => void;
}

/**
 * Domain presentation component for rendering a single folder in list view
 * Uses domain entities and follows DDD patterns
 */
export const FolderListItem: React.FC<FolderListItemProps> = ({ folder, onDataChange }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      accepts: ['asset'],
    },
  });
  const { toast } = useToast();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRenameSubmit = async (newName: string) => {
    try {
      const result = await renameFolderClientAction(folder.id, newName);
      if (result.success) {
        toast({ title: 'Folder renamed', description: `Folder "${folder.name}" was successfully renamed to "${newName}".` });
        onDataChange();
        setIsRenameDialogOpen(false);
      } else {
        console.error("Error renaming folder, raw result.error:", result.error);
        toast({ title: 'Error Renaming', description: result.error || 'An unknown error occurred.' });
      }
    } catch (error) {
      console.error("Caught error in handleRenameSubmit:", error);
      toast({ title: 'Submit Error', description: 'An unexpected error occurred while submitting the new name.' });
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteFolderClientAction(folder.id);
      if (result.success) {
        toast({ title: 'Folder Deleted', description: `Folder "${folder.name}" was successfully deleted.` });
        onDataChange();
        setIsDeleteDialogOpen(false);
      } else {
        console.error("Error deleting folder, raw result.error:", result.error);
        toast({ title: 'Error Deleting Folder', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Caught error in handleDeleteConfirm:", error);
      toast({ title: 'Delete Error', description: 'An unexpected error occurred while deleting the folder.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          "group relative flex-none w-[180px] flex items-center rounded-lg border border-input bg-background shadow-sm hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors",
          isOver && "bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500 border-transparent"
        )}
      >
        <Link
          href={`/dam?folderId=${folder.id}`}
          className={cn(
            "flex items-center p-3 h-12 w-full truncate",
            "focus:outline-none"
          )}
          title={folder.name}
        >
          <FolderIcon className="w-5 h-5 mr-3 shrink-0 text-blue-500" />
          <span className="truncate text-sm font-medium text-foreground whitespace-nowrap">
            {folder.name}
          </span>
        </Link>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions for folder {folder.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault(); 
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600 hover:!text-red-600 focus:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <InputDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        title={`Rename Folder`}
        description={`Enter a new name for the folder "${folder.name}".`}
        initialValue={folder.name}
        onSubmit={handleRenameSubmit}
        inputPlaceholder="Enter new folder name"
        submitButtonText="Rename"
      />
            <ConfirmationDialog        open={isDeleteDialogOpen}        onOpenChange={setIsDeleteDialogOpen}        title={`Delete Folder`}        description={`Are you sure you want to delete the folder "${folder.name}"? This action cannot be undone. All contents within this folder will also be deleted.`}        onConfirm={handleDeleteConfirm}        confirmText="Delete"        variant="destructive"      />
    </>
  );
}; 