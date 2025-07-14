/**
 * Notes Unified Context Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Replaces useOrganizationContext() for Notes pages
 * - Reduces 3+ API calls to 1 API call on page load
 * - Maintains compatibility with existing Notes components
 * - Provides all context needed: user, organization, feature flags, notes data
 * - CRITICAL: Uses stable dependencies to prevent infinite re-render loops
 * - INCLUDES optimistic updates for instant UI feedback
 * - Follow @golden-rule unified context patterns exactly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { getNotesUnifiedContext } from '../actions/notesUnifiedActions';
import { Note } from '@/types/notes';

export interface NotesUnifiedContextData {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  isNotesEnabled: boolean;
  notes: Note[]; // ✅ CRITICAL: Include notes data
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  refreshContext: () => Promise<void>;
  // ✅ OPTIMIZATION: Optimistic update functions for instant UI feedback
  addNoteOptimistic: (note: Note) => void;
  updateNoteOptimistic: (noteId: string, updates: Partial<Note>) => void;
  deleteNoteOptimistic: (noteId: string) => void;
  reorderNotesOptimistic: (orderedNoteIds: string[]) => void;
}

/**
 * OPTIMIZATION: Unified context hook for Notes pages
 * Replaces multiple hooks with single optimized call + optimistic updates
 */
export function useNotesUnifiedContext(): NotesUnifiedContextData {
  const [state, setState] = useState<{
    user: User | null;
    organizationId: string | null;
    organizations: Array<{ organization_id: string; organization_name: string; role: string }>;
    featureFlags: Record<string, boolean>;
    isNotesEnabled: boolean;
    notes: Note[]; // ✅ CRITICAL: Include notes data
    isLoading: boolean;
    error: string | null;
    fromCache: boolean;
  }>({
    user: null,
    organizationId: null,
    organizations: [],
    featureFlags: {},
    isNotesEnabled: true,
    notes: [], // ✅ CRITICAL: Initialize notes array
    isLoading: true,
    error: null,
    fromCache: false
  });

  // CRITICAL: Use refs to break dependency chains and prevent infinite loops
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadContextFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Create the load function and store it in ref to break dependency chains
  loadContextFunctionRef.current = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // OPTIMIZATION: Single server action call gets everything (context + notes data)
      // Server action handles all authentication validation + deduplication
      const result = await getNotesUnifiedContext();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!.user,
          organizationId: result.data!.organizationId,
          organizations: result.data!.organizations,
          featureFlags: result.data!.featureFlags,
          isNotesEnabled: result.data!.isNotesEnabled,
          notes: Array.isArray(result.data!.notes) ? result.data!.notes : [], // ✅ CRITICAL: Ensure notes is always an array
          isLoading: false,
          error: null,
          fromCache: result.data!.fromCache
        }));
        hasLoadedRef.current = true;
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          organizationId: null,
          organizations: [],
          featureFlags: {},
          isNotesEnabled: false,
          notes: [], // ✅ CRITICAL: Always ensure notes is an empty array on error
          isLoading: false,
          error: result.error || 'Failed to load Notes context',
          fromCache: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        organizationId: null,
        organizations: [],
        featureFlags: {},
        isNotesEnabled: false,
        notes: [], // ✅ CRITICAL: Always ensure notes is an empty array on error
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load Notes context',
        fromCache: false
      }));
    } finally {
      isLoadingRef.current = false;
    }
  };

  // CRITICAL: Create stable refresh function with NO dependencies to break infinite loop
  const refreshContext = useCallback(async () => {
    hasLoadedRef.current = false; // Allow refresh to reload
    if (loadContextFunctionRef.current) {
      await loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - breaks the infinite loop

  // ✅ OPTIMIZATION: Optimistic update functions for instant UI feedback
  const addNoteOptimistic = useCallback((note: Note) => {
    setState(prev => ({
      ...prev,
      notes: [...prev.notes, note] // Add note instantly to UI
    }));
  }, []);

  const updateNoteOptimistic = useCallback((noteId: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updated_at: new Date().toISOString() }
          : note
      )
    }));
  }, []);

  const deleteNoteOptimistic = useCallback((noteId: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId) // Remove note instantly from UI
    }));
  }, []);

  const reorderNotesOptimistic = useCallback((orderedNoteIds: string[]) => {
    setState(prev => {
      // Create a map for quick lookup
      const noteMap = new Map(prev.notes.map(note => [note.id, note]));
      
      // Reorder notes based on the provided order
      const reorderedNotes = orderedNoteIds
        .map(id => noteMap.get(id))
        .filter((note): note is Note => note !== undefined)
        .map((note, index) => ({ ...note, position: index }));
      
      return {
        ...prev,
        notes: reorderedNotes
      };
    });
  }, []);

  // Load context immediately - server action handles auth validation
  useEffect(() => {
    // Only load if we haven't loaded yet (prevents React Strict Mode double-invocation)
    if (!hasLoadedRef.current && !isLoadingRef.current && loadContextFunctionRef.current) {
      loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - only run once on mount

  return {
    user: state.user,
    organizationId: state.organizationId,
    organizations: state.organizations,
    featureFlags: state.featureFlags,
    isNotesEnabled: state.isNotesEnabled,
    notes: state.notes, // ✅ CRITICAL: Return notes data
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    refreshContext,
    // ✅ OPTIMIZATION: Return optimistic update functions
    addNoteOptimistic,
    updateNoteOptimistic,
    deleteNoteOptimistic,
    reorderNotesOptimistic
  };
} 