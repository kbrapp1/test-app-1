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
import { Note } from '@/types/notes';
import { User } from '@supabase/supabase-js';
import { NotesCompositionRoot } from '../../infrastructure/composition/NotesCompositionRoot';
import { CreateNoteCommand, UpdateNoteCommand, ReorderNotesCommand } from '../../application/services/NotesApplicationService';
// TODO: Implement proper audit trail service following comprehensive-security-design.md

export interface NotesUnifiedContextResult {
  success: boolean;
  data?: NotesUnifiedContext;
  error?: string;
}

export interface NotesDataResult {
  success: boolean;
  notes?: Note[];
  user?: User; // User from context
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

        // Fetch notes using application service with permission validation
        try {
          const compositionRoot = NotesCompositionRoot.getInstance();
          const applicationService = compositionRoot.getNotesApplicationService();
          // Application service now returns DTOs directly
          const notes: Note[] = await applicationService.getNotes(user.id, organizationId);

          return {
            success: true,
            notes,
            user: user,
            organizationId: organizationId,
            isNotesEnabled: true
          };
        } catch (error) {
          console.error('[NOTES_DATA_ACTION] Application service error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch notes'
          };
        }

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
  | { success: true; user: User; organizationId: string }
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

        // ✅ PERMISSION: Use application service with permission validation
        const applicationService = NotesCompositionRoot.getInstance().getNotesApplicationService();
        
        const command: CreateNoteCommand = {
          title: noteData.title?.trim() || null,
          content: noteData.content || null,
          userId: user.id,
          organizationId,
          position: noteData.position,
          colorClass: noteData.color_class || 'bg-yellow-100'
        };

        const noteDto = await applicationService.createNote(command);

        // ✅ SECURITY: Log audit trail for note creation
        // TODO: Implement proper audit trail service
        console.log('[NOTES_AUDIT]', JSON.stringify({
          timestamp: new Date().toISOString(),
          user_id: user.id,
          organization_id: organizationId,
          action: 'note_created',
          details: {
            note_id: noteDto.id,
            title: command.title,
            feature: 'notes'
          }
        }));

        // ✅ CRITICAL: Invalidate unified context cache after successful mutation
        const unifiedService = NotesUnifiedContextService.getInstance();
        unifiedService.invalidateCacheAfterMutation(user.id, organizationId);

        return { 
          success: true, 
          note: noteDto as Note 
        };

      } catch (error) {
        console.error('[CREATE_NOTE] Error:', error);
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

        // ✅ PERMISSION: Use application service with permission validation
        const applicationService = NotesCompositionRoot.getInstance().getNotesApplicationService();
        
        const command: UpdateNoteCommand = {
          id: noteUpdate.id,
          title: noteUpdate.title,
          content: noteUpdate.content,
          position: noteUpdate.position,
          colorClass: noteUpdate.color_class,
          userId: user.id,
          organizationId
        };

        const noteDto = await applicationService.updateNote(command);

        return { success: true, note: noteDto as Note };

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

        // ✅ PERMISSION: Use application service with permission validation
        const applicationService = NotesCompositionRoot.getInstance().getNotesApplicationService();
        
        await applicationService.deleteNote(noteId, user.id, organizationId);

        return { success: true };

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

        // ✅ PERMISSION: Use application service with permission validation
        const applicationService = NotesCompositionRoot.getInstance().getNotesApplicationService();
        
        const command: ReorderNotesCommand = {
          orderedNoteIds,
          userId: user.id,
          organizationId
        };

        await applicationService.reorderNotes(command);

        // Fetch updated notes
        const updatedNotes = await applicationService.getNotes(user.id, organizationId);

        return { success: true, notes: updatedNotes as Note[] };

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