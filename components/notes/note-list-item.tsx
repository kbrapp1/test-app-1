/**
 * Note List Item Component
 * 
 * AI INSTRUCTIONS:
 * - Individual note card with permission-based action buttons
 * - Shows edit/delete buttons only if user has respective permissions
 * - Follows fail-secure principles (hide if no permission)
 * - Single responsibility: individual note display and interaction
 */

'use client';

import React, { useEffect, useActionState, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2Icon, Loader2, PencilIcon, XIcon, CheckIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import type { Note } from '@/types/notes'; // Import central type
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NoteEditForm } from './note-edit-form'; // Import the new form component
import type { ColorOption } from '@/types/notes'; // Import central ColorOption
import { useNotesPermissions } from '@/lib/shared/access-control/hooks/usePermissions';

// Type for the Server Action function signatures
type DeleteNoteAction = (prevState: any, formData: FormData) => Promise<{
    success: boolean;
    message: string;
}>;
type EditNoteAction = (prevState: any, formData: FormData) => Promise<{ success: boolean; message: string; }>;

const initialActionState = {
  success: false,
  message: '',
};

// Submit button for the delete form
function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="ghost" size="icon" type="submit" aria-label="Delete note" disabled={pending} aria-disabled={pending} className={`text-destructive hover:text-destructive ${pending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2Icon className="h-4 w-4" />}
        </Button>
    );
}

function EditButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" type="button" aria-label="Edit note" onClick={onClick} className="opacity-0 group-hover:opacity-100 transition-opacity">
             <PencilIcon className="h-4 w-4" />
        </Button>
    );
}

interface NoteListItemProps {
    id: string;
    note: Note;
    deleteNoteAction: DeleteNoteAction;
    editNoteAction: EditNoteAction;
    rotationClass?: string;
    availableColors: ColorOption[];
}

export function NoteListItem({ 
    id,
    note, 
    deleteNoteAction, 
    editNoteAction, 
    rotationClass,
    availableColors
}: NoteListItemProps) {
  const [deleteState, deleteFormAction] = useActionState(deleteNoteAction, initialActionState);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { canUpdate, canDelete, isLoading } = useNotesPermissions();

  // dnd-kit hook
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging
  } = useSortable({ id: id });

  // Style for dnd-kit transforms
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  // Determine background color (default if missing)
  const currentBgClass = note.color_class || availableColors[0]?.bg || 'bg-yellow-200';
  // Find matching text color (less critical, but good practice)
  const currentTextColor = availableColors.find(c => c.bg === currentBgClass)?.text || 'text-yellow-900';
  const currentInputBg = availableColors.find(c => c.bg === currentBgClass)?.inputBg || 'bg-yellow-100';
  const currentBorder = availableColors.find(c => c.bg === currentBgClass)?.border || 'border-yellow-300';
  const currentFocusRing = availableColors.find(c => c.bg === currentBgClass)?.focusRing || 'focus:ring-yellow-400';

  // Show delete toasts (if delete fails - success handled by removal)
  useEffect(() => {
    if (deleteState?.message && !deleteState.success) { 
      toast({
        title: 'Error',
        description: deleteState.message,
        variant: 'destructive',
      });
    }
  }, [deleteState, toast]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  // Function to handle color change click
  const handleColorChange = (newColorClass: string) => {
    // Manually create FormData
    const formData = new FormData();
    formData.append('note_id', note.id);
    formData.append('title', note.title || ''); // Use original note data
    formData.append('content', note.content || ''); // Use original note data
    formData.append('color_class', newColorClass);

    // Need to call the original editNoteAction prop within a transition
    // We don't have useActionState here, so use startTransition directly
    React.startTransition(() => {
        editNoteAction(null, formData) // Pass null for prevState
            .then(result => {
                 // Handle toast feedback directly here if needed
                if (result?.message) {
                    toast({
                        title: result.success ? 'Color Updated' : 'Error',
                        description: result.message,
                        variant: result.success ? 'default' : 'destructive',
                    });
                }
            })
            .catch(err => {
                console.error("Color change action error:", err);
                toast({ title: 'Error', description: 'Failed to update color.', variant: 'destructive' });
            });
    });
  };

  // Format the date
  const updatedAt = note.updated_at ? new Date(note.updated_at) : null;
  const timeAgo = updatedAt ? formatDistanceToNow(updatedAt, { addSuffix: true }) : '';

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className={cn(
        "group relative p-4 rounded-md shadow-md flex flex-col justify-between break-words aspect-square touch-none",
        "transition-transform duration-150 ease-in-out hover:scale-105",
        currentBgClass,
        currentTextColor,
        rotationClass,
        "after:absolute after:content-[''] after:bottom-0 after:right-0 after:w-0 after:h-0",
        "after:border-15 after:border-l-transparent after:border-t-transparent",
        "after:border-b-black/15 after:border-r-black/15",
        "dark:after:border-b-white/15 dark:after:border-r-white/15",
        "after:shadow-xs after:transition-all after:duration-150",
        "hover:after:border-20 hover:after:border-l-transparent hover:after:border-t-transparent",
        isDragging ? 'z-10 shadow-xl' : ''
    )}>
      {isEditing ? (
        <NoteEditForm 
            initialNote={note}
            editAction={editNoteAction}
            onCancel={handleCancelClick}
            onSaveSuccess={() => setIsEditing(false)}
            currentInputBg={currentInputBg}
            currentBorder={currentBorder}
            currentFocusRing={currentFocusRing}
            currentTextColor={currentTextColor}
        />
      ) : (
        <>
            {/* AI: Show color picker only if user can update */}
            {!isLoading && canUpdate && (
              <div className="absolute bottom-1 left-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                {availableColors.map((colorOption) => (
                  <button
                    key={colorOption.bg}
                    type="button"
                    aria-label={`Set color to ${colorOption.bg.split('-')[1]}`}
                    className={cn(
                      "h-4 w-4 rounded-full border border-black/20 dark:border-white/20 shadow-xs",
                      colorOption.bg,
                      currentBgClass === colorOption.bg ? 'ring-2 ring-offset-1 ring-black/50 dark:ring-white/50' : '' 
                    )}
                    onClick={() => handleColorChange(colorOption.bg)}
                    disabled={currentBgClass === colorOption.bg}
                  />
                ))}
              </div>
            )}
            <h3 
                className="font-semibold mb-1 break-words pr-10 cursor-grab"
                {...listeners}
            >
                {note.title || 'Untitled Note'}
            </h3>
            <span className="block whitespace-pre-wrap grow overflow-y-auto text-sm break-words mb-1">
                {note.content || ''}
            </span>
            <span className="text-xs mt-auto self-end opacity-70">
                {timeAgo}
            </span>
            
            {/* AI: Show action buttons only if user has permissions and not loading */}
            {!isLoading && (canUpdate || canDelete) && (
              <div 
                  className="absolute top-1 right-1 flex items-center space-x-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  {...(!isDragging ? {} : { 'data-no-dnd': 'true' })}
              >
                  {/* AI: Show edit button only if user can update */}
                  {canUpdate && <EditButton onClick={handleEditClick} />}
                  {/* AI: Show delete button only if user can delete */}
                  {canDelete && (
                    <form action={deleteFormAction} className="leading-none">
                        <input type="hidden" name="note_id" value={note.id} />
                        <DeleteButton />
                    </form>
                  )}
              </div>
            )}
        </>
      )}
    </li>
  );
} 