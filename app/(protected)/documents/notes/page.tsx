import React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react'; // Icon for Add button

// Components required for the Dialog and new structure
import { AddNoteDialog } from '@/components/notes/add-note-dialog';
import { NoteList } from '@/components/notes/note-list'; // Wrap list logic
import { EmptyState } from '@/components/ui/empty-state'; // Import EmptyState

// Import server actions from the separate file
import { addNote, deleteNote, editNote } from './actions';
import { getActiveOrganizationId } from '@/lib/auth/server-action'; // <-- IMPORT UTILITY

// Type for Server Action Response (keep for action definitions)
// interface ActionResult {
//   success: boolean;
//   message: string;
// }

// Server Action for adding notes (definition remains)
// --- REMOVE ACTION DEFINITIONS FROM HERE --- 
// async function addNote(prevState: any, formData: FormData): Promise<ActionResult> {
//   'use server';
   // ... entire addNote function ...
// }

// Server Action for deleting notes
// async function deleteNote(prevState: any, formData: FormData): Promise<ActionResult> {
//   'use server';
   // ... entire deleteNote function ...
// }

// Server Action for editing notes
// async function editNote(prevState: any, formData: FormData): Promise<ActionResult> {
//   'use server';
   // ... entire editNote function ...
// }
// --- TO HERE ---

// Define Note type based on table structure (or Supabase generated types)
interface Note {
    id: string;
    user_id: string;
    title: string | null; // Add title
    content: string | null;
    created_at: string;
    updated_at: string | null; // Add updated_at
}

// Props for dependency injection of organization ID fetcher
interface NotesPageProps {
  getOrgId?: () => Promise<string | null>;
}

export default async function NotesPage(
  { getOrgId = getActiveOrganizationId }: NotesPageProps = {}
) {
  const supabase = createClient();

  // Fetch user first (unchanged)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Fetch notes data (unchanged logic, added type assertion)
  let notes: Note[] = []; // Use the Note type
  let fetchError: string | null = null;
  let activeOrgId: string | null = null; // <-- DECLARE activeOrgId

  if (userError) {
    console.error('Error fetching user:', userError.message);
    fetchError = 'Could not fetch user data.';
  } else if (!user) {
    console.error('No user found');
    fetchError = 'No authenticated user found.';
  } else {
    // Fetch active organization ID AFTER user is confirmed
    try {
      activeOrgId = await getOrgId();
      if (!activeOrgId) {
        console.error('Active organization ID not found for user:', user.id);
        fetchError = 'Active organization context is missing. Please select or create an organization.';
      }
    } catch (orgError: any) {
      console.error('Error fetching active organization ID:', orgError.message);
      fetchError = 'Could not determine active organization.';
    }

    // Proceed to fetch notes only if user and activeOrgId are present and no prior fetchError
    if (user && activeOrgId && !fetchError) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', activeOrgId) // <-- ADD organization_id FILTER
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching notes:', error.message);
        fetchError = 'Could not fetch notes.';
        // notes remains empty as initialized
      } else {
        notes = (data as Note[]) || []; // Assert type here
      }
    } else if (user && !activeOrgId && !fetchError) {
      // This case is now handled by the activeOrgId check above,
      // but kept for clarity if logic changes.
      // fetchError would already be set if activeOrgId is missing.
      // notes remains empty as initialized
    }
  }

  // --- Render Logic --- 
  const renderContent = () => {
    if (fetchError) {
      return <p className="text-red-600">Error: {fetchError}</p>;
    }
    if (notes.length === 0) {
      // Use EmptyState - Pass AddNoteDialog as action
      return (
        <EmptyState 
          icon={PlusCircleIcon} 
          title="No Notes Yet"
          description="Get started by adding your first note."
          action={<AddNoteDialog addNoteAction={addNote} triggerButtonText="Add First Note" />}
        />
      );
    }
    // Use NoteList component
    return <NoteList initialNotes={notes} deleteNoteAction={deleteNote} editNoteAction={editNote} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Notes</h1>
        {/* Show Add button only if there are notes already */}
        {!fetchError && notes.length > 0 && (
           <AddNoteDialog addNoteAction={addNote} triggerButtonText="Add New Note" />
        )}
      </div>
      
      <div className="mt-4">
        {renderContent()} 
      </div>
    </div>
  );
} 