/**
 * Notes Mutations Hooks - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Extracted from useNotesQuery.ts to follow 250-line rule
 * - React Query mutations for CRUD operations
 * - Organization-aware optimistic updates
 * - Follow @golden-rule patterns exactly
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Note } from '@/types/notes';
import { createNote, updateNote, deleteNote, updateNoteOrder } from '../actions/notesUnifiedActions';

/**
 * React Query mutation for creating notes with optimistic updates
 */
export function useCreateNoteMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteData: { title: string; content: string; position?: number }) => {
      if (!organizationId) {
        throw new Error('Organization context required');
      }
      
      const result = await createNote(noteData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create note');
      }
      return result.note;
    },
    onMutate: async (newNoteData) => {
      const queryKey = ['notes-complete'];
      await queryClient.cancelQueries({ queryKey });
      
      const previousResult = queryClient.getQueryData<any>(queryKey);
      
      if (previousResult?.notes) {
        const optimisticNote: Note = {
          id: 'temp-' + Date.now(),
          title: newNoteData.title,
          content: newNoteData.content,
          position: newNoteData.position || previousResult.notes.length,
          user_id: '',
          organization_id: organizationId || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isOptimistic: true,
        } as Note & { isOptimistic: boolean };
        
        const updatedResult = {
          ...previousResult,
          notes: [...previousResult.notes, optimisticNote]
        };
        
        queryClient.setQueryData(queryKey, updatedResult);
      }
      
      return { previousResult };
    },
    onError: (error, newNoteData, context) => {
      if (context?.previousResult) {
        queryClient.setQueryData(['notes-complete'], context.previousResult);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-complete'] });
    }
  });
}

/**
 * React Query mutation for updating notes with optimistic updates
 */
export function useUpdateNoteMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteUpdate: { id: string; title?: string; content?: string; position?: number }) => {
      const result = await updateNote(noteUpdate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update note');
      }
      return result.note;
    },
    onMutate: async (noteUpdate) => {
      const queryKey = ['notes-complete'];
      await queryClient.cancelQueries({ queryKey });
      
      const previousResult = queryClient.getQueryData<any>(queryKey);
      
      if (previousResult?.notes) {
        const updatedNotes = previousResult.notes.map((note: Note) => 
          note.id === noteUpdate.id 
            ? { 
                ...note, 
                ...noteUpdate,
                updated_at: new Date().toISOString(),
                isOptimistic: true 
              }
            : note
        );
        
        const updatedResult = {
          ...previousResult,
          notes: updatedNotes
        };
        
        queryClient.setQueryData(queryKey, updatedResult);
      }
      
      return { previousResult };
    },
    onError: (error, noteUpdate, context) => {
      if (context?.previousResult) {
        queryClient.setQueryData(['notes-complete'], context.previousResult);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-complete'] });
    }
  });
}

/**
 * React Query mutation for deleting notes with optimistic updates
 */
export function useDeleteNoteMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteId: string) => {
      const result = await deleteNote(noteId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete note');
      }
      return result.note;
    },
    onMutate: async (noteId) => {
      const queryKey = ['notes-complete'];
      await queryClient.cancelQueries({ queryKey });
      
      const previousResult = queryClient.getQueryData<any>(queryKey);
      
      if (previousResult?.notes) {
        const updatedNotes = previousResult.notes.filter((note: Note) => note.id !== noteId);
        
        const updatedResult = {
          ...previousResult,
          notes: updatedNotes
        };
        
        queryClient.setQueryData(queryKey, updatedResult);
      }
      
      return { previousResult };
    },
    onError: (error, noteId, context) => {
      if (context?.previousResult) {
        queryClient.setQueryData(['notes-complete'], context.previousResult);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-complete'] });
    }
  });
}

/**
 * React Query mutation for updating note order with optimistic updates
 */
export function useUpdateNoteOrderMutation(organizationId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderedNoteIds: string[]) => {
      const result = await updateNoteOrder(orderedNoteIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update note order');
      }
      return result.notes;
    },
    onMutate: async (orderedNoteIds) => {
      const queryKey = ['notes-complete'];
      await queryClient.cancelQueries({ queryKey });
      
      const previousResult = queryClient.getQueryData<any>(queryKey);
      
      if (previousResult?.notes) {
        const noteMap = new Map(previousResult.notes.map((note: Note) => [note.id, note]));
        const reorderedNotes = orderedNoteIds
          .map((id, index) => {
            const note = noteMap.get(id);
            return note ? { ...note, position: index, isOptimistic: true } : null;
          })
          .filter(Boolean);
        
        const updatedResult = {
          ...previousResult,
          notes: reorderedNotes
        };
        
        queryClient.setQueryData(queryKey, updatedResult);
      }
      
      return { previousResult };
    },
    onError: (error, orderedNoteIds, context) => {
      if (context?.previousResult) {
        queryClient.setQueryData(['notes-complete'], context.previousResult);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-complete'] });
    }
  });
} 