'use client';

/**
 * Notes Page Content Component
 * 
 * AI INSTRUCTIONS:
 * - Client component that receives notes data as props
 * - Receives organizationId as guaranteed non-null prop
 * - Used by the protected notes page wrapper
 * - Single responsibility: notes page rendering
 * - Implements role-based permission checking for UI elements
 */

import React from 'react';
import { PlusCircleIcon } from 'lucide-react';

// Components
import { AddNoteDialog } from '@/components/notes/add-note-dialog';
import { NoteList } from '@/components/notes/note-list';
import { EmptyState } from '@/components/ui/empty-state';

// Note type
import type { Note } from '@/types/notes';

interface NotesPageContentProps {
  organizationId: string;
  notes: Note[];
  fetchError: string | null;
}

export default function NotesPageContent({ organizationId, notes, fetchError }: NotesPageContentProps) {
  // AI: organizationId is required for multi-tenant security but handled by child components via hooks/actions
  // This ensures we maintain org context in the component interface per security requirements
  
  // AI: Render logic
  const renderContent = () => {
    if (fetchError) {
      return <p className="text-red-600">Error: {fetchError}</p>;
    }
    
    if (notes.length === 0) {
      return (
        <EmptyState 
          icon={PlusCircleIcon} 
          title="No Notes Yet"
          description="Get started by adding your first note."
          action={<AddNoteDialog triggerButtonText="Add First Note" />}
        />
      );
    }
    
    return <NoteList initialNotes={notes} />;
  };

  return (
    <div className="space-y-6" data-organization-id={organizationId}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Notes</h1>
        {/* AI: Show Add button only if there are notes already */}
        {!fetchError && notes.length > 0 && (
           <AddNoteDialog triggerButtonText="Add New Note" />
        )}
      </div>
      
      <div className="mt-4">
        {renderContent()} 
      </div>
    </div>
  );
} 