/**
 * Add Note Dialog Component
 * 
 * AI INSTRUCTIONS:
 * - Client component with permission-based access control
 * - Shows dialog only if user has CREATE_NOTE permission
 * - Follows fail-secure principles (hide if no permission)
 * - Single responsibility: note creation dialog
 * - Uses callback prop for note creation to support optimistic updates
 */

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddNoteForm } from './add-note-form';
import { PlusCircleIcon } from 'lucide-react';

interface AddNoteDialogProps {
    triggerButtonText?: string;
    canCreate: boolean;
    isLoading: boolean;
    organizationId: string | null;
    onAddNote?: (noteData: { title: string; content: string; color_class?: string }) => Promise<void>; // ✅ OPTIMIZATION: Callback for optimistic updates
}

export function AddNoteDialog({ 
  triggerButtonText = "Add Note", 
  canCreate, 
  isLoading, 
  organizationId: _organizationId,
  onAddNote 
}: AddNoteDialogProps) {
    // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
    const [isOpen, setIsOpen] = useState(false);
    
    // NOTE: Organization context validation is handled by parent NotesPageClient
    
    // AI: Don't render if no permission or still loading (fail-secure)
    if (isLoading || !canCreate) {
        return null;
    }

    // ✅ OPTIMIZATION: Handle note creation with callback or fallback
    const handleCreateNote = async (prevState: unknown, formData: FormData) => {
        const title = formData.get('title')?.toString() || '';
        const content = formData.get('content')?.toString() || '';
        const color_class = formData.get('color_class')?.toString() || 'bg-yellow-200';

        if (!title.trim()) {
            return { success: false, message: 'Title is required' };
        }

        try {
            if (onAddNote) {
                // ✅ OPTIMIZATION: Use callback for optimistic updates
                await onAddNote({ title, content, color_class });
                setIsOpen(false); // Close dialog on success
                return { success: true, message: 'Note added successfully' };
            } else {
                // ✅ FALLBACK: Use direct server action if no callback provided
                const { createNote } = await import('@/lib/notes/presentation/actions/notesUnifiedActions');
                const result = await createNote({ title, content, color_class });
                
                if (result.success) {
                    setIsOpen(false); // Close dialog on success
                    // Note: Without callback, UI won't update optimistically
                    return { success: true, message: 'Note added successfully' };
                } else {
                    return { success: false, message: result.error || 'Failed to add note' };
                }
            }
        } catch (error) {
            console.error('Error creating note:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Failed to add note' 
            };
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="default" 
                    size="sm"
                    disabled={isLoading || !canCreate}
                >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    {triggerButtonText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Note</DialogTitle>
                    <DialogDescription>
                        Create a new note to organize your thoughts and ideas.
                    </DialogDescription>
                </DialogHeader>
                
                {/* ✅ OPTIMIZATION: Pass optimistic update handler to form */}
                <AddNoteForm 
                    addNoteAction={handleCreateNote}
                    onFormSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
} 