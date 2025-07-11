/**
 * Add Note Dialog Component
 * 
 * AI INSTRUCTIONS:
 * - Client component with permission-based access control
 * - Shows dialog only if user has CREATE_NOTE permission
 * - Follows fail-secure principles (hide if no permission)
 * - Single responsibility: note creation dialog
 * - Imports server actions directly instead of receiving as props
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // If needed for custom footer buttons
  DialogClose, // To close dialog from within
} from "@/components/ui/dialog";
import { AddNoteForm } from './add-note-form'; // Import the actual form
import { PlusCircleIcon } from 'lucide-react';
import { useNotesPermissions } from '@/lib/shared/access-control/hooks/usePermissions';
import { addNote } from '@/app/(protected)/documents/notes/actions';

interface AddNoteDialogProps {
    triggerButtonText?: string; // Optional custom text for the trigger
}

export function AddNoteDialog({ triggerButtonText = "Add Note" }: AddNoteDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { canCreate, isLoading } = useNotesPermissions();

    // AI: Don't render if no permission or still loading (fail-secure)
    if (isLoading || !canCreate) {
        return null;
    }

    // We need a way for AddNoteForm to tell us it succeeded so we can close the dialog.
    // We can modify AddNoteForm to accept an onFormSuccess callback.
    const handleFormSuccess = () => {
        setIsOpen(false); // Close the dialog
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button>
                     <PlusCircleIcon className="mr-2 h-4 w-4" />
                     {triggerButtonText}
                 </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Note</DialogTitle>
                    <DialogDescription>
                       Enter the content for your new note below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {/* Pass the success callback to the form */}
                    <AddNoteForm addNoteAction={addNote} onFormSuccess={handleFormSuccess} />
                </div>
                {/* 
                    Note: The AddNoteForm now contains its own submit button.
                    We don't need a separate DialogFooter with save/cancel unless 
                    we restructure AddNoteForm.
                 */}
                 {/* <DialogFooter>
                     <DialogClose asChild>
                         <Button type="button" variant="secondary">Cancel</Button>
                     </DialogClose>
                     <Button type="submit" form="add-note-form-id">Save</Button> // Need form ID 
                 </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
} 