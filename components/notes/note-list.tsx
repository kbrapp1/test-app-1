'use client'; // Or server if no client interaction needed beyond passing props

import React, { useState, useEffect } from 'react';
// Import Note type from note-list-item
import { NoteListItem } from './note-list-item'; 
import type { Note } from '@/types/notes'; // Import central type
import { updateNoteOrder } from '@/app/(protected)/documents/notes/actions'; // Import the new action
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

// Types matching NotesPage
// Remove local Note definition
// interface Note {
//     id: string;
//     user_id: string;
//     content: string | null;
//     created_at: string;
// }

interface ActionResult {
  success: boolean;
  message: string;
}

type DeleteNoteAction = (prevState: any, formData: FormData) => Promise<ActionResult>;
type EditNoteAction = (prevState: any, formData: FormData) => Promise<ActionResult>;

interface NoteListProps {
    initialNotes: Note[]; // Rename prop
    deleteNoteAction: DeleteNoteAction;
    editNoteAction: EditNoteAction;
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

export function NoteList({ initialNotes, deleteNoteAction, editNoteAction }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const { toast } = useToast();

  // Update local state if initialNotes prop changes (e.g., after adding/deleting)
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((note) => note.id === active.id);
      const newIndex = notes.findIndex((note) => note.id === over.id);

      // Update local state immediately for smooth UI
      const reorderedNotes = arrayMove(notes, oldIndex, newIndex);
      setNotes(reorderedNotes);

      // Prepare data for server action (array of IDs in the new order)
      const orderedIds = reorderedNotes.map(note => note.id);

      // Call server action to persist the new order
      try {
        const result = await updateNoteOrder(orderedIds);
        if (!result.success) {
          // Revert local state if server update fails
          setNotes(notes);
          toast({
            title: 'Error Updating Order',
            description: result.message || 'Could not save the new note order.',
            variant: 'destructive',
          });
        } else {
          // Optionally show success toast (maybe too noisy)
          // toast({ title: 'Success', description: 'Note order saved.' });
        }
      } catch (error) {
        console.error("Drag end error:", error);
        setNotes(notes); // Revert on unexpected error
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while saving note order.',
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
                  deleteNoteAction={deleteNoteAction} 
                  editNoteAction={editNoteAction}
                  // Remove colorClasses prop:
                  // colorClasses={color} 
                  rotationClass={rotation}
                  availableColors={noteColors} // Pass available colors for picker
                />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
} 