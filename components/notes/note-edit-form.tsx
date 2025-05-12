'use client';

import React, { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { Loader2, CheckIcon, XIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Note } from '@/types/notes';

// --- Action Type --- 
// Define explicitly here or import if centralized
type EditNoteAction = (prevState: any, formData: FormData) => Promise<{ success: boolean; message: string; }>;
const initialActionState = {
  success: false,
  message: '',
};

// --- Props --- 
interface NoteEditFormProps {
    initialNote: Note;
    editAction: EditNoteAction;
    onCancel: () => void;
    // Pass required style info
    currentInputBg: string;
    currentBorder: string;
    currentFocusRing: string;
    currentTextColor: string;
    onSaveSuccess?: () => void; // Optional callback on success
}

// --- Helper Components (Internalized) --- 
function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="ghost" size="icon" type="submit" aria-label="Save note" disabled={pending} aria-disabled={pending} className="text-green-600 hover:text-green-700">
             {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
        </Button>
    );
}

function CancelButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" type="button" aria-label="Cancel edit" onClick={onClick}>
             <XIcon className="h-4 w-4" />
        </Button>
    );
}

// --- Main Component --- 
export function NoteEditForm({
    initialNote,
    editAction,
    onCancel,
    currentInputBg,
    currentBorder,
    currentFocusRing,
    currentTextColor,
    onSaveSuccess
}: NoteEditFormProps) {
    const [editState, formAction] = useActionState(editAction, initialActionState);
    const { toast } = useToast();
    const [editedTitle, setEditedTitle] = useState(initialNote.title || '');
    const [editedContent, setEditedContent] = useState(initialNote.content || '');
    const inputRef = useRef<HTMLInputElement>(null); // Use input ref for title
    const formRef = useRef<HTMLFormElement>(null);

    // Show edit toasts 
    // Note: The parent NoteListItem no longer needs to handle edit toasts
    useEffect(() => {
        if (editState?.message) { 
            toast({
                title: editState.success ? 'Success' : 'Error',
                description: editState.message,
                variant: editState.success ? 'default' : 'destructive',
            });
            // We don't automatically cancel/close here; parent NoteListItem handles that
            // based on receiving a successful state if needed (though current setup doesn't need it)
            // --- Call the success callback --- 
            if (editState.success && onSaveSuccess) {
                onSaveSuccess();
            }
        }
    }, [editState, toast, onSaveSuccess]);

    // Focus title input on mount/initial render
    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Select text for easy replacement
    }, []);

    return (
        <form 
            ref={formRef} 
            action={formAction} 
            className="flex flex-col h-full"
            data-testid="note-edit-form"
        >
            {/* Hidden fields needed by the action */}
            <input type="hidden" name="note_id" value={initialNote.id} />
            <input type="hidden" name="color_class" value={initialNote.color_class || 'bg-yellow-200'} /> 
            
            <Input 
                ref={inputRef} // Attach ref here
                type="text"
                name="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={cn(
                    "mb-2 font-semibold border text-sm p-1 rounded-sm cursor-text", 
                    currentInputBg, 
                    currentBorder, 
                    currentFocusRing,
                    currentTextColor
                )}
                required
                placeholder="Title"
                data-no-dnd='true' // Prevent drag from input
            />
            <Textarea 
                name="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={cn(
                    "grow mb-2 border focus:ring-2 text-sm rounded-sm p-2 resize-none cursor-text", 
                    currentInputBg, 
                    currentBorder, 
                    currentFocusRing,
                    currentTextColor
                )}
                rows={3}
                placeholder="Note content..."
                data-no-dnd='true' // Prevent drag from textarea
            />
           <div 
                className="flex items-center justify-end space-x-1 self-end mt-auto pt-1" 
                data-no-dnd='true' // Prevent drag from button area
            >
               <SaveButton />
               <CancelButton onClick={onCancel} />
           </div>
        </form>
    );
} 