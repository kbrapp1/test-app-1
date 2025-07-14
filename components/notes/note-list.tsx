'use client'; // Or server if no client interaction needed beyond passing props

import React from 'react';
// Import Note type from note-list-item
import { NoteListItem } from './note-list-item'; 
import type { Note } from '@/types/notes'; // Import central type
import { useToast } from '@/components/ui/use-toast';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy, // Use grid layout strategy
} from '@dnd-kit/sortable';

interface NoteListProps {
    initialNotes: Note[]; // Notes from unified context
    canUpdate: boolean;
    canDelete: boolean;
    isLoading: boolean;
    organizationId: string | null;
    onUpdateNote?: (noteId: string, updates: Partial<Note>) => Promise<void>; // ✅ Optimistic update callback
    onDeleteNote?: (noteId: string) => Promise<void>; // ✅ Optimistic delete callback
    onReorderNotes?: (orderedNoteIds: string[]) => Promise<void>; // ✅ Optimistic reorder callback
}

// Define sticky note color class pairs
const noteColors = [
    { bg: 'bg-yellow-200', text: 'text-yellow-900', inputBg: 'bg-yellow-100', border: 'border-yellow-300', focusRing: 'focus:ring-yellow-400' },
    { bg: 'bg-pink-200', text: 'text-pink-900', inputBg: 'bg-pink-100', border: 'border-pink-300', focusRing: 'focus:ring-pink-400' },
    { bg: 'bg-blue-200', text: 'text-blue-900', inputBg: 'bg-blue-100', border: 'border-blue-300', focusRing: 'focus:ring-blue-400' },
    { bg: 'bg-green-200', text: 'text-green-900', inputBg: 'bg-green-100', border: 'border-green-300', focusRing: 'focus:ring-green-400' },
    { bg: 'bg-purple-200', text: 'text-purple-900', inputBg: 'bg-purple-100', border: 'border-purple-300', focusRing: 'focus:ring-purple-400' },
    { bg: 'bg-orange-200', text: 'text-orange-900', inputBg: 'bg-orange-100', border: 'border-orange-300', focusRing: 'focus:ring-orange-400' },
];

// Define rotation classes for variety
const rotationClasses = [
    'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', '-rotate-1' // Cycle through a few options
];

// Simple function to get a somewhat stable index based on ID
function getStableIndex(id: string, arrayLength: number): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Ensure positive index
    const index = Math.abs(hash) % arrayLength;
    return index;
}

export function NoteList({ 
  initialNotes, 
  canUpdate, 
  canDelete, 
  isLoading, 
  organizationId: _organizationId,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes
}: NoteListProps) {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  const { toast } = useToast();
  
  // ALL DND HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // ✅ OPTIMIZATION: Use notes directly from unified context (no local state)
  // NOTE: Organization context validation is handled by parent NotesPageClient
  const notes = initialNotes;

  // ✅ OPTIMIZATION: Use callback props for optimistic updates
  const handleDeleteNote = async (prevState: unknown, formData: FormData) => {
    const noteId = formData.get('note_id') as string;
    
    try {
      if (onDeleteNote) {
        // Use optimistic delete callback
        await onDeleteNote(noteId);
        return { success: true, message: 'Note deleted successfully!' };
      } else {
        // Fallback to direct server action
        const { deleteNote } = await import('@/lib/notes/presentation/actions/notesUnifiedActions');
        const result = await deleteNote(noteId);
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Note deleted successfully!',
            variant: 'default',
          });
          return { success: true, message: 'Note deleted successfully!' };
        } else {
          return { success: false, message: result.error || 'Failed to delete note' };
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete note' 
      };
    }
  };

  const handleEditNote = async (prevState: unknown, formData: FormData) => {
    const noteId = formData.get('note_id') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const colorClass = formData.get('color_class') as string;
    
    try {
      if (onUpdateNote) {
        // Use optimistic update callback
        await onUpdateNote(noteId, { title, content, color_class: colorClass });
        return { success: true, message: 'Note updated successfully!' };
      } else {
        // Fallback to direct server action
        const { updateNote } = await import('@/lib/notes/presentation/actions/notesUnifiedActions');
        const result = await updateNote({ 
          id: noteId, 
          title, 
          content,
          color_class: colorClass 
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update note');
        }
        return { success: true, message: 'Note updated successfully!' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update note' 
      };
    }
  };

  // ✅ OPTIMIZATION: No local state needed - using notes directly from unified context

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((note) => note.id === active.id);
      const newIndex = notes.findIndex((note) => note.id === over.id);

      // Calculate new order
      const reorderedNotes = arrayMove(notes, oldIndex, newIndex);
      const orderedIds = reorderedNotes.map(note => note.id);

      try {
        if (onReorderNotes) {
          // Use optimistic reorder callback
          await onReorderNotes(orderedIds);
        } else {
          // Fallback to direct server action
          const { updateNoteOrder } = await import('@/lib/notes/presentation/actions/notesUnifiedActions');
          const result = await updateNoteOrder(orderedIds);
          if (!result.success) {
            throw new Error(result.error || 'Failed to reorder notes');
          }
        }
      } catch (error) {
        console.error("Drag end error:", error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An unexpected error occurred while saving note order.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={notes.map(note => note.id)} // Pass array of IDs
        strategy={rectSortingStrategy} // Use grid strategy
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 p-4">
          {notes.map((note) => { // Remove index from map parameters
            // Rotation derived from ID
            const rotationIndex = getStableIndex(note.id, rotationClasses.length);
            const rotation = rotationClasses[rotationIndex];
            // Color comes from note.color_class (handled in NoteListItem)
            // Remove color calculation logic:
            // const colorIndex = getStableIndex(note.id, noteColors.length);
            // const color = noteColors[colorIndex]; 
            return (
                <NoteListItem 
                  key={note.id} 
                  id={note.id} // Pass ID for dnd-kit
                  note={note} 
                  deleteNoteAction={handleDeleteNote} 
                  editNoteAction={handleEditNote}
                  // Remove colorClasses prop:
                  // colorClasses={color} 
                  rotationClass={rotation}
                  availableColors={noteColors} // Pass available colors for picker
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  isLoading={isLoading}
                />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
} 