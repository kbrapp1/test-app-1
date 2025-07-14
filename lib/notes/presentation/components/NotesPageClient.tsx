'use client';

/**
 * Notes Page Client - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Uses unified context exclusively to prevent duplicate API calls
 * - Single API call (3+ → 1) with optimistic updates for instant UI feedback
 * - Maintains all security guarantees while improving performance
 * - Follows unified context pattern with optimistic updates
 * - Follow @golden-rule unified context patterns exactly
 */

import { useNotesUnifiedContext } from '../hooks/useNotesUnifiedContext';
import { createNote, updateNote, deleteNote, updateNoteOrder } from '../actions/notesUnifiedActions';
import { NoteList } from '@/components/notes/note-list';
import { AddNoteDialog } from '@/components/notes/add-note-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PlusCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Note } from '@/types/notes';
import { InsufficientPermissions, FeatureNotAvailable } from '@/components/access-guards';

export function NotesPageClient() {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // OPTIMIZATION: Use unified context exclusively (single API call + optimistic updates)
  const { 
    user,
    organizationId: activeOrganizationId, 
    isLoading,
    isNotesEnabled,
    notes, // ✅ CRITICAL: Notes data from unified context
    error,
    fromCache,
    refreshContext,
    // ✅ OPTIMIZATION: Optimistic update functions
    addNoteOptimistic,
    updateNoteOptimistic,
    deleteNoteOptimistic,
    reorderNotesOptimistic
  } = useNotesUnifiedContext();

  // Extract permissions from unified context
  const canCreate = Boolean(user && !isLoading && isNotesEnabled);
  const canUpdate = Boolean(user && !isLoading && isNotesEnabled);
  const canDelete = Boolean(user && !isLoading && isNotesEnabled);

  // ✅ CRITICAL: Ensure notes is always an array to prevent "filter is not a function" errors
  const safeNotes = Array.isArray(notes) ? notes : [];

  // OPTIMIZATION: Log cache performance in development
  if (fromCache && process.env.NODE_ENV === 'development') {
    console.log('[NOTES_OPTIMIZATION] Using cached unified context - no API calls needed');
  }

  // ✅ OPTIMIZATION: Optimistic add note handler
  const handleAddNote = async (noteData: { title: string; content: string; color_class?: string }) => {
    if (!user || !activeOrganizationId) return;

    // 1. Create temporary note for optimistic update
    const tempNote: Note = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      organization_id: activeOrganizationId,
      title: noteData.title,
      content: noteData.content,
      color_class: noteData.color_class || 'bg-yellow-200',
      position: notes.length, // Add at end
      created_at: new Date().toISOString(),
      updated_at: null
    };

    // 2. Optimistic update (instant UI feedback)
    addNoteOptimistic(tempNote);
    
    // 3. Show immediate success feedback
    toast.success('Note added!');

    try {
      // 4. Server action (background)
      const result = await createNote(noteData);
      
      if (result.success && result.note) {
        // 5. Replace temporary note with real note data (single operation)
        deleteNoteOptimistic(tempNote.id);
        addNoteOptimistic(result.note);
      } else {
        // 6. Rollback optimistic update on error
        deleteNoteOptimistic(tempNote.id);
        toast.error(result.error || 'Failed to add note');
      }
    } catch (error) {
      // Rollback optimistic update on exception
      deleteNoteOptimistic(tempNote.id);
      toast.error('Failed to add note');
      console.error('Add note error:', error);
    }
  };

  // ✅ OPTIMIZATION: Optimistic update note handler
  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    // 1. Optimistic update (instant UI feedback)
    updateNoteOptimistic(noteId, updates);
    
    // 2. Show immediate success feedback
    toast.success('Note updated!');

    try {
      // 3. Server action (background)
             const result = await updateNote({ 
         id: noteId, 
         title: updates.title || undefined,
         content: updates.content || undefined,
         position: updates.position,
         color_class: updates.color_class || undefined
       });
      
      if (result.success && result.note) {
        // 4. Sync with server response (in case server modified data)
        updateNoteOptimistic(noteId, result.note);
      } else {
        // 5. Rollback optimistic update on error
        await refreshContext(); // Refresh to get original state
        toast.error(result.error || 'Failed to update note');
      }
    } catch (error) {
      // Rollback optimistic update on exception
      await refreshContext(); // Refresh to get original state
      toast.error('Failed to update note');
      console.error('Update note error:', error);
    }
  };

  // ✅ OPTIMIZATION: Optimistic delete note handler
  const handleDeleteNote = async (noteId: string) => {
    // 1. Store original note for potential rollback
    const originalNote = notes.find(note => note.id === noteId);
    
    // 2. Optimistic update (instant UI feedback)
    deleteNoteOptimistic(noteId);
    
    // 3. Show immediate success feedback
    toast.success('Note deleted!');

    try {
      // 4. Server action (background)
      const result = await deleteNote(noteId);
      
      if (!result.success) {
        // 5. Rollback optimistic update on error
        if (originalNote) {
          addNoteOptimistic(originalNote);
        }
        toast.error(result.error || 'Failed to delete note');
      }
    } catch (error) {
      // Rollback optimistic update on exception
      if (originalNote) {
        addNoteOptimistic(originalNote);
      }
      toast.error('Failed to delete note');
      console.error('Delete note error:', error);
    }
  };

  // ✅ OPTIMIZATION: Optimistic reorder notes handler
  const handleReorderNotes = async (orderedNoteIds: string[]) => {
    // 1. Store original order for potential rollback
    const originalNotes = [...notes];
    
    // 2. Optimistic update (instant UI feedback)
    reorderNotesOptimistic(orderedNoteIds);

    try {
      // 3. Server action (background)
      const result = await updateNoteOrder(orderedNoteIds);
      
      if (!result.success) {
        // 4. Rollback optimistic update on error
        originalNotes.forEach(note => addNoteOptimistic(note));
        toast.error(result.error || 'Failed to reorder notes');
      }
    } catch (error) {
      // Rollback optimistic update on exception
      originalNotes.forEach(note => addNoteOptimistic(note));
      toast.error('Failed to reorder notes');
      console.error('Reorder notes error:', error);
    }
  };

  // SECURITY: Wait for organization context to load before rendering (check loading first)
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-2">Unified context pattern (1 API call)</p>
          )}
        </div>
      </div>
    );
  }

  // Handle Notes feature access error
  if (error) {
    // Check if it's a permission error vs other errors
    if (error.includes('permission') || error.includes('access denied')) {
      return <InsufficientPermissions 
        feature="Notes" 
        title="Notes Access Error"
        description={error}
      />;
    }
    
    // Generic error fallback
    return <FeatureNotAvailable 
      feature="Notes" 
      description={error}
      showUpgrade={false}
      showContact={true}
    />;
  }

  // Handle Notes feature disabled (business feature flag) - only after loading completes
  if (!isNotesEnabled) {
    return <FeatureNotAvailable 
      feature="Notes" 
      description="Notes feature is not enabled for your organization. Contact your administrator to enable this feature."
    />;
  }

  // SECURITY: Server actions handle all validation with organization context
  return (
    <div className="space-y-6" data-organization-id={activeOrganizationId}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Notes</h1>
        {/* Show Add button only if there are notes already */}
        {safeNotes.length > 0 && (
          <AddNoteDialog 
            triggerButtonText="Add New Note"
            canCreate={canCreate}
            isLoading={isLoading}
            organizationId={activeOrganizationId}
            onAddNote={handleAddNote}
          />
        )}
      </div>
      
      <div className="mt-4">
        {safeNotes.length === 0 ? (
          <EmptyState 
            icon={PlusCircleIcon} 
            title="No Notes Yet"
            description="Get started by adding your first note."
            action={
              <AddNoteDialog 
                triggerButtonText="Add First Note"
                canCreate={canCreate}
                isLoading={isLoading}
                organizationId={activeOrganizationId}
                onAddNote={handleAddNote}
              />
            }
          />
        ) : (
          <NoteList 
            initialNotes={safeNotes}
            canUpdate={canUpdate}
            canDelete={canDelete}
            isLoading={isLoading}
            organizationId={activeOrganizationId}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onReorderNotes={handleReorderNotes}
          />
        )}
      </div>
      
      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs">
          <div>Notes: {safeNotes.length}</div>
          <div>Context Cache: {fromCache ? 'HIT' : 'MISS'}</div>
          <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
          <div>API Calls: 1 (Unified)</div>
        </div>
      )}
    </div>
  );
} 