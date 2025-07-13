/**
 * Notes Unified Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Single server action file for all Notes operations
 * - Uses NotesUnifiedContextService for consolidated validation
 * - Maintains all security guarantees while reducing API calls
 * - CRITICAL: Uses apiDeduplicationService to prevent multiple simultaneous calls
 * - Follow @golden-rule unified context patterns exactly
 */

'use server';

import { NotesUnifiedContextService, NotesUnifiedContext } from '../../application/services/NotesUnifiedContextService';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';
import { createClient } from '@/lib/supabase/server';
import { Note } from '@/types/notes';

export interface NotesUnifiedContextResult {
  success: boolean;
  data?: NotesUnifiedContext;
  error?: string;
}

export interface NotesDataResult {
  success: boolean;
  notes?: Note[];
  user?: any; // User from context
  organizationId?: string; // Organization ID from context
  isNotesEnabled?: boolean; // Feature flag from context
  error?: string;
}

export interface NoteActionResult {
  success: boolean;
  note?: Note;
  error?: string;
}

export interface NotesActionResult {
  success: boolean;
  notes?: Note[];
  error?: string;
}

/**
 * OPTIMIZATION: Get all Notes context in single server action
 * Replaces separate calls to useOrganizationContext + validation + feature flags
 * CRITICAL: Uses deduplication to prevent multiple simultaneous calls
 */
export async function getNotesUnifiedContext(): Promise<NotesUnifiedContextResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'getNotesUnifiedContext',
    [], // No parameters needed
    async () => {
      try {
        // Log for debugging rapid refresh issues
        if (process.env.NODE_ENV === 'development') {
          console.log('[NOTES_UNIFIED_ACTION] Processing request at', new Date().toISOString());
        }
        
        const unifiedService = NotesUnifiedContextService.getInstance();
        const result = await unifiedService.getUnifiedNotesContext();
        
        if (!result.isValid) {
          return {
            success: false,
            error: result.error || 'Notes context validation failed'
          };
        }

        if (!result.unifiedContext) {
          return {
            success: false,
            error: 'Unified context data not available'
          };
        }

        return {
          success: true,
          data: result.unifiedContext
        };

      } catch (error) {
        console.error('[NOTES_UNIFIED_ACTION] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load Notes context'
        };
      }
    },
    'notes-operations'
  );
}

/**
 * OPTIMIZATION: Fetch notes data with deduplication
 * Reuses unified context validation instead of duplicating it
 */
export async function getNotesData(): Promise<NotesDataResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'getNotesData',
    [], // No parameters needed
    async () => {
      try {
        // OPTIMIZATION: Reuse the unified context result instead of calling service again
        const contextResult = await getNotesUnifiedContext();
        
        if (!contextResult.success || !contextResult.data?.isNotesEnabled) {
          return {
            success: false,
            error: contextResult.error || 'Notes access denied'
          };
        }

        const { user, organizationId } = contextResult.data;
        
        if (!user || !organizationId) {
          return {
            success: false,
            error: 'User or organization context missing'
          };
        }

        // Fetch notes from database
        const supabase = createClient();
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .order('position', { ascending: true });

        if (error) {
          console.error('[NOTES_DATA_ACTION] Database error:', error);
          return {
            success: false,
            error: 'Failed to fetch notes from database'
          };
        }

        return {
          success: true,
          notes: (data as Note[]) || [],
          user: user,
          organizationId: organizationId,
          isNotesEnabled: contextResult.data.isNotesEnabled
        };

      } catch (error) {
        console.error('[NOTES_DATA_ACTION] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load notes data'
        };
      }
    },
    'notes-operations'
  );
}

/**
 * Unified context validation helper
 * Reuses unified context service for consistent validation
 */
async function validateNotesAccess(): Promise<
  | { success: true; user: any; organizationId: string }
  | { success: false; error: string }
> {
  try {
    const unifiedService = NotesUnifiedContextService.getInstance();
    const result = await unifiedService.getUnifiedNotesContext();
    
    if (!result.isValid) {
      return { success: false, error: result.error || 'Notes access validation failed' };
    }

    if (!result.unifiedContext?.isNotesEnabled) {
      return { success: false, error: 'Notes feature disabled for this organization' };
    }

    const { user, organizationId } = result.unifiedContext;
    
    if (!user || !organizationId) {
      return { success: false, error: 'User or organization context missing' };
    }

    return { success: true, user, organizationId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation error' 
    };
  }
}

/**
 * Create a new note with unified context validation
 */
export async function createNote(noteData: { 
  title: string; 
  content: string; 
  position?: number; 
  color_class?: string; 
}): Promise<NoteActionResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'createNote',
    [noteData.title, noteData.content],
    async () => {
      try {
        // ✅ UNIFIED: Single validation call using unified context
        const validation = await validateNotesAccess();
        if (!validation.success) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;

        // Validate input
        if (!noteData.title?.trim()) {
          return { success: false, error: 'Note title is required' };
        }

        const supabase = createClient();
        
        // Get the highest current position if not provided
        let position = noteData.position;
        if (position === undefined) {
          const { data: maxPosData, error: maxPosError } = await supabase
            .from('notes')
            .select('position')
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (maxPosError) {
            console.error('[CREATE_NOTE] Error fetching max position:', maxPosError);
            position = 0;
          } else {
            position = (maxPosData?.position || 0) + 1;
          }
        }

        // Create the note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            title: noteData.title.trim(),
            content: noteData.content || '',
            position: position,
            color_class: noteData.color_class || 'bg-yellow-100',
            user_id: user.id,
            organization_id: organizationId
          })
          .select()
          .single();

        if (error) {
          console.error('[CREATE_NOTE] Database error:', error);
          return { success: false, error: 'Failed to create note' };
        }

        // ✅ OPTIMIZATION: Invalidate unified context cache after successful creation
        const unifiedService = NotesUnifiedContextService.getInstance();
        unifiedService.invalidateCacheAfterMutation(user.id, organizationId);

        return { success: true, note: data as Note };

      } catch (error) {
        console.error('[CREATE_NOTE] Unexpected error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create note' 
        };
      }
    },
    'notes-operations'
  );
}

/**
 * Update an existing note with unified context validation
 */
export async function updateNote(noteUpdate: { 
  id: string; 
  title?: string; 
  content?: string; 
  position?: number; 
  color_class?: string; 
}): Promise<NoteActionResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'updateNote',
    [noteUpdate.id, noteUpdate.title, noteUpdate.content],
    async () => {
      try {
        // ✅ UNIFIED: Single validation call using unified context
        const validation = await validateNotesAccess();
        if (!validation.success) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;

        // Validate note ID
        if (!noteUpdate.id?.trim()) {
          return { success: false, error: 'Note ID is required' };
        }

        // Validate title if provided
        if (noteUpdate.title !== undefined && !noteUpdate.title?.trim()) {
          return { success: false, error: 'Note title cannot be empty' };
        }

        const supabase = createClient();

        // Build update object with only provided fields
        const updateData: any = {};
        if (noteUpdate.title !== undefined) updateData.title = noteUpdate.title.trim();
        if (noteUpdate.content !== undefined) updateData.content = noteUpdate.content;
        if (noteUpdate.position !== undefined) updateData.position = noteUpdate.position;
        if (noteUpdate.color_class !== undefined) updateData.color_class = noteUpdate.color_class;
        updateData.updated_at = new Date().toISOString();

        // Update the note
        const { data, error } = await supabase
          .from('notes')
          .update(updateData)
          .eq('id', noteUpdate.id)
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) {
          console.error('[UPDATE_NOTE] Database error:', error);
          return { success: false, error: 'Failed to update note' };
        }

        if (!data) {
          return { success: false, error: 'Note not found or access denied' };
        }

        return { success: true, note: data as Note };

      } catch (error) {
        console.error('[UPDATE_NOTE] Unexpected error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update note' 
        };
      }
    },
    'notes-operations'
  );
}

/**
 * Delete a note with unified context validation
 */
export async function deleteNote(noteId: string): Promise<NoteActionResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'deleteNote',
    [noteId],
    async () => {
      try {
        // ✅ UNIFIED: Single validation call using unified context
        const validation = await validateNotesAccess();
        if (!validation.success) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;

        // Validate note ID
        if (!noteId?.trim()) {
          return { success: false, error: 'Note ID is required' };
        }

        const supabase = createClient();

        // Delete the note
        const { data, error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId)
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) {
          console.error('[DELETE_NOTE] Database error:', error);
          return { success: false, error: 'Failed to delete note' };
        }

        if (!data) {
          return { success: false, error: 'Note not found or access denied' };
        }

        return { success: true, note: data as Note };

      } catch (error) {
        console.error('[DELETE_NOTE] Unexpected error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete note' 
        };
      }
    },
    'notes-operations'
  );
}

/**
 * Update note order with unified context validation
 */
export async function updateNoteOrder(orderedNoteIds: string[]): Promise<NotesActionResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'updateNoteOrder',
    [JSON.stringify(orderedNoteIds)],
    async () => {
      try {
        // ✅ UNIFIED: Single validation call using unified context
        const validation = await validateNotesAccess();
        if (!validation.success) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;

        // Validate input
        if (!Array.isArray(orderedNoteIds) || orderedNoteIds.length === 0) {
          return { success: false, error: 'Valid note order array is required' };
        }

        const supabase = createClient();

        // Update positions for all notes in a transaction
        const updates = orderedNoteIds.map((noteId, index) => 
          supabase
            .from('notes')
            .update({ 
              position: index,
              updated_at: new Date().toISOString()
            })
            .eq('id', noteId)
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
        );

        // Execute all updates
        const results = await Promise.all(updates);
        
        // Check for any errors
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          console.error('[UPDATE_NOTE_ORDER] Database errors:', errors);
          return { success: false, error: 'Failed to update note order' };
        }

        // Fetch updated notes
        const { data: updatedNotes, error: fetchError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .order('position', { ascending: true });

        if (fetchError) {
          console.error('[UPDATE_NOTE_ORDER] Fetch error:', fetchError);
          return { success: false, error: 'Failed to fetch updated notes' };
        }

        return { success: true, notes: (updatedNotes as Note[]) || [] };

      } catch (error) {
        console.error('[UPDATE_NOTE_ORDER] Unexpected error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update note order' 
        };
      }
    },
    'notes-operations'
  );
} 