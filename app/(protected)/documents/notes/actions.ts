'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/types/notes';

// Type for Server Action Response
interface ActionResult {
    success: boolean;
    message: string;
}

// Server Action for adding notes 
export async function addNote(prevState: any, formData: FormData): Promise<ActionResult> {
    const title = formData.get('title')?.toString();
    const content = formData.get('content')?.toString();
    const defaultColor = 'bg-yellow-200'; // Define default color

    if (!title) {
        return { success: false, message: 'Note title cannot be empty.' };
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Auth Error (Add Note):', userError?.message);
        // Return a user-friendly message, log the specific error
        return { success: false, message: 'Authentication error. Please log in again.' };
    }

    // Get the highest current position
    const { data: maxPosData, error: maxPosError } = await supabase
        .from('notes')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (maxPosError) {
        console.error('Error fetching max position:', maxPosError);
        // This error might not need to be fatal for the user, but log it.
        // We continue assuming position 0. No user-facing message needed here unless critical.
    }
    const nextPosition = (maxPosData?.position ?? -1) + 1;

    const { error: insertError } = await supabase
        .from('notes')
        .insert({ 
            title: title,
            content: content, 
            user_id: user.id, 
            position: nextPosition, // Set the position
            color_class: defaultColor // Set default color on creation
        });

    if (insertError) {
        console.error('Insert Error (Add Note):', insertError.message);
        // Return a generic user-friendly message, log the specific error
        return { success: false, message: 'Failed to save the note. Please try again.' };
    }

    revalidatePath('/documents/notes');
    return { success: true, message: 'Note added successfully.' };
}

// Server Action for deleting notes
export async function deleteNote(prevState: any, formData: FormData): Promise<ActionResult> {
    const noteId = formData.get('note_id')?.toString();

    if (!noteId) {
        return { success: false, message: 'Note ID missing.' };
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Auth Error (Delete Note):', userError?.message);
        return { success: false, message: 'Authentication error. Please log in again.' };
    }

    const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .match({ id: noteId, user_id: user.id });

    if (deleteError) {
        console.error('Delete Error (Delete Note):', deleteError.message);
        // Return a generic user-friendly message, log the specific error
        return { success: false, message: 'Failed to delete the note. Please try again.' };
    }

    revalidatePath('/documents/notes'); 
    return { success: true, message: 'Note deleted.' }; // Provide message for consistency
}

// Server Action for editing notes
export async function editNote(prevState: any, formData: FormData): Promise<ActionResult> {
    const noteId = formData.get('note_id')?.toString();
    const newTitle = formData.get('title')?.toString();
    const newContent = formData.get('content')?.toString();
    const newColorClass = formData.get('color_class')?.toString(); // Get color class

    if (!noteId) { return { success: false, message: 'Note ID missing.' }; }
    // Title and content validation might need adjustment if only color is changing
    // For now, we require them when calling this action
    if (!newTitle) {
        return { success: false, message: 'Note title cannot be empty.' };
    }
    if (newContent === null || newContent === undefined) { 
        return { success: false, message: 'Note content missing.' };
    }
    // Color validation (optional, could check against allowed list)
    if (!newColorClass) {
        return { success: false, message: 'Color selection missing.' };
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Auth Error (Edit Note):', userError?.message); 
        // Return a generic user-friendly message, log the specific error
        return { success: false, message: 'Authentication error. Please log in again.' };
    }

    const { error: updateError } = await supabase
        .from('notes')
        .update({ 
            title: newTitle,
            content: newContent, 
            color_class: newColorClass // Update the color class
            // updated_at handled by trigger
        })
        .match({ id: noteId, user_id: user.id });

    if (updateError) {
        console.error('Update Error (Edit Note):', updateError.message); 
        // Return a generic user-friendly message, log the specific error
        return { success: false, message: 'Failed to update the note. Please try again.' };
    }

    revalidatePath('/documents/notes');
    return { success: true, message: 'Note updated successfully.' };
}

// --- NEW ACTION --- 
// Server Action to update note order
export async function updateNoteOrder(orderedNoteIds: string[]): Promise<ActionResult> {
    if (!Array.isArray(orderedNoteIds)) {
        return { success: false, message: 'Invalid order data.' };
    }
    
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Auth Error (Update Order):', userError?.message);
        return { success: false, message: 'Authentication error. Please log in again.' };
    }

    // Create an array of objects for the upsert operation
    const updates = orderedNoteIds.map((id, index) => ({
        id: id,
        user_id: user.id, // Include user_id for RLS
        position: index   // Set position based on array index
    }));

    try {
        // Use upsert which acts like update here since we provide existing IDs
        const { error } = await supabase
            .from('notes')
            .upsert(updates, { onConflict: 'id' }); // Update based on ID match

        if (error) {
            console.error('Supabase order update error:', error);
            // Return a generic user-friendly message, log the specific error
            return { success: false, message: 'Failed to update note order. Please try again.' };
        }

        revalidatePath('/documents/notes'); // Revalidate to reflect potential order changes
        return { success: true, message: 'Note order updated.' };
    } catch (error) {
        console.error('Error updating note order:', error);
        // Return a generic user-friendly message, log the specific error
        return { success: false, message: 'An unexpected error occurred while updating note order.' };
    }
} 