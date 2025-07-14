/**
 * useNotesUnifiedContext Hook Tests - Presentation Layer
 * 
 * Tests for the unified context hook including:
 * - Initial state and loading behavior
 * - Successful context loading and caching
 * - Error handling scenarios
 * - Optimistic update functions
 * - State consistency and dependency management
 * - Refresh functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotesUnifiedContext } from '../useNotesUnifiedContext';
import { getNotesUnifiedContext, type NotesUnifiedContextResult } from '../../actions/notesUnifiedActions';
import { Note } from '@/types/notes';
import { Note as ServiceNote } from '../../../application/services/NotesUnifiedContextService';
import { User } from '@supabase/supabase-js';

// Mock the unified actions
vi.mock('../../actions/notesUnifiedActions', () => ({
  getNotesUnifiedContext: vi.fn()
}));

const mockGetNotesUnifiedContext = vi.mocked(getNotesUnifiedContext);

describe('useNotesUnifiedContext', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    confirmation_sent_at: undefined,
    confirmed_at: '2023-01-01T00:00:00Z',
    email_confirmed_at: '2023-01-01T00:00:00Z',
    last_sign_in_at: '2023-01-01T00:00:00Z',
    phone: undefined,
    phone_confirmed_at: undefined,
    recovery_sent_at: undefined,
    role: 'authenticated'
  };

  const mockOrganizations = [
    {
      organization_id: 'org-123',
      organization_name: 'Test Org',
      role: 'admin'
    }
  ];

  const mockFeatureFlags = {
    notes: true,
    dam: false
  };

  const mockNotes: ServiceNote[] = [
    {
      id: 'note-1',
      title: 'Test Note 1',
      content: 'Content 1',
      color_class: 'bg-yellow-200',
      position: 0,
      user_id: 'user-123',
      organization_id: 'org-123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: null
    },
    {
      id: 'note-2',
      title: 'Test Note 2',
      content: 'Content 2',
      color_class: 'bg-blue-200',
      position: 1,
      user_id: 'user-123',
      organization_id: 'org-123',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T12:00:00Z'
    }
  ];

  const mockSuccessResponse: NotesUnifiedContextResult = {
    success: true,
    data: {
      user: mockUser,
      organizationId: 'org-123',
      organizations: mockOrganizations,
      featureFlags: mockFeatureFlags,
      isNotesEnabled: true,
      notes: mockNotes,
      fromCache: false
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotesUnifiedContext.mockResolvedValue(mockSuccessResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('starts with loading state and default values', () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.organizationId).toBeNull();
      expect(result.current.organizations).toEqual([]);
      expect(result.current.featureFlags).toEqual({});
      expect(result.current.isNotesEnabled).toBe(true); // Default is true
      expect(result.current.notes).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.fromCache).toBe(false);
    });

    it('provides optimistic update functions', () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      expect(typeof result.current.addNoteOptimistic).toBe('function');
      expect(typeof result.current.updateNoteOptimistic).toBe('function');
      expect(typeof result.current.deleteNoteOptimistic).toBe('function');
      expect(typeof result.current.reorderNotesOptimistic).toBe('function');
      expect(typeof result.current.refreshContext).toBe('function');
    });
  });

  describe('Successful Context Loading', () => {
    it('loads context successfully and updates state', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      // Wait for the context to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.organizationId).toBe('org-123');
      expect(result.current.organizations).toEqual(mockOrganizations);
      expect(result.current.featureFlags).toEqual(mockFeatureFlags);
      expect(result.current.isNotesEnabled).toBe(true);
      expect(result.current.notes).toEqual(mockNotes);
      expect(result.current.error).toBeNull();
      expect(result.current.fromCache).toBe(false);

      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();
    });

    it('handles cached response correctly', async () => {
      const cachedResponse: NotesUnifiedContextResult = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data!,
          fromCache: true
        }
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(cachedResponse);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fromCache).toBe(true);
    });

    it('only calls getNotesUnifiedContext once on mount', async () => {
      const { rerender } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();
      });

      // Rerender should not trigger another call
      rerender();
      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();
    });
  });

  describe('Error Handling', () => {
    it('handles API error response', async () => {
      const errorResponse: NotesUnifiedContextResult = {
        success: false,
        error: 'Failed to load context'
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(errorResponse);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load context');
      expect(result.current.user).toBeNull();
      expect(result.current.organizationId).toBeNull();
      expect(result.current.notes).toEqual([]);
    });

    it('handles thrown exceptions', async () => {
      const thrownError = new Error('Network error');
      mockGetNotesUnifiedContext.mockRejectedValueOnce(thrownError);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.user).toBeNull();
      expect(result.current.organizationId).toBeNull();
      expect(result.current.notes).toEqual([]);
    });

    it('handles unknown error types', async () => {
      mockGetNotesUnifiedContext.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load Notes context');
    });
  });

  describe('Optimistic Updates', () => {
    it('adds note optimistically', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newNote: Note = {
        id: 'note-3',
        title: 'New Note',
        content: 'New Content',
        color_class: 'bg-green-200',
        position: 2,
        user_id: 'user-123',
        organization_id: 'org-123',
        created_at: '2023-01-03T00:00:00Z',
        updated_at: null
      };

      act(() => {
        result.current.addNoteOptimistic(newNote);
      });

      expect(result.current.notes).toHaveLength(3);
      expect(result.current.notes[2]).toEqual(newNote);
    });

    it('updates note optimistically', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updates = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      act(() => {
        result.current.updateNoteOptimistic('note-1', updates);
      });

      const updatedNote = result.current.notes.find(note => note.id === 'note-1');
      expect(updatedNote?.title).toBe('Updated Title');
      expect(updatedNote?.content).toBe('Updated Content');
      expect(updatedNote?.updated_at).toBeTruthy(); // Should set new timestamp
    });

    it('deletes note optimistically', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteNoteOptimistic('note-1');
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes.find(note => note.id === 'note-1')).toBeUndefined();
    });

    it('reorders notes optimistically', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reorderedIds = ['note-2', 'note-1'];

      act(() => {
        result.current.reorderNotesOptimistic(reorderedIds);
      });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].id).toBe('note-2');
      expect(result.current.notes[0].position).toBe(0);
      expect(result.current.notes[1].id).toBe('note-1');
      expect(result.current.notes[1].position).toBe(1);
    });

    it('handles reorder with missing notes gracefully', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reorderedIds = ['note-2', 'nonexistent-note', 'note-1'];

      act(() => {
        result.current.reorderNotesOptimistic(reorderedIds);
      });

      // Should only include existing notes
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].id).toBe('note-2');
      expect(result.current.notes[1].id).toBe('note-1');
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes context and reloads data', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock to count refresh calls
      mockGetNotesUnifiedContext.mockClear();

      const updatedResponse: NotesUnifiedContextResult = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data!,
          notes: [
            ...mockNotes,
            {
              id: 'note-3',
              title: 'Refreshed Note',
              content: 'Refreshed Content',
              color_class: 'bg-red-200',
              position: 2,
              user_id: 'user-123',
              organization_id: 'org-123',
              created_at: '2023-01-03T00:00:00Z',
              updated_at: null
            }
          ]
        }
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(updatedResponse);

      await act(async () => {
        await result.current.refreshContext();
      });

      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();
      expect(result.current.notes).toHaveLength(3);
      expect(result.current.notes[2].title).toBe('Refreshed Note');
    });

    it('handles refresh errors gracefully', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockGetNotesUnifiedContext.mockClear();
      mockGetNotesUnifiedContext.mockRejectedValueOnce(new Error('Refresh failed'));

      await act(async () => {
        await result.current.refreshContext();
      });

      expect(result.current.error).toBe('Refresh failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during refresh', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockGetNotesUnifiedContext.mockClear();
      
      // Create a promise that we can control
      let resolveRefresh: (value: NotesUnifiedContextResult) => void;
      const refreshPromise = new Promise<NotesUnifiedContextResult>(resolve => {
        resolveRefresh = resolve;
      });
      mockGetNotesUnifiedContext.mockReturnValueOnce(refreshPromise);

      // Start refresh
      act(() => {
        result.current.refreshContext();
      });

      // Should be loading during refresh
      expect(result.current.isLoading).toBe(true);

      // Resolve the refresh
      act(() => {
        resolveRefresh(mockSuccessResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('State Consistency', () => {
    it('maintains state after multiple optimistic updates', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        // Add a note
        result.current.addNoteOptimistic({
          id: 'note-3',
          title: 'Added Note',
          content: 'Added Content',
          color_class: 'bg-green-200',
          position: 2,
          user_id: 'user-123',
          organization_id: 'org-123',
          created_at: '2023-01-03T00:00:00Z',
          updated_at: null
        });

        // Update an existing note
        result.current.updateNoteOptimistic('note-1', { title: 'Updated Note 1' });

        // Delete a note
        result.current.deleteNoteOptimistic('note-2');
      });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes.find(n => n.id === 'note-1')?.title).toBe('Updated Note 1');
      expect(result.current.notes.find(n => n.id === 'note-2')).toBeUndefined();
      expect(result.current.notes.find(n => n.id === 'note-3')).toBeDefined();
    });

    it('does not trigger infinite loops with stable functions', async () => {
      const { result, rerender } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialRefreshFn = result.current.refreshContext;
      const initialAddFn = result.current.addNoteOptimistic;

      // Functions should be stable across rerenders
      rerender();

      expect(result.current.refreshContext).toBe(initialRefreshFn);
      expect(result.current.addNoteOptimistic).toBe(initialAddFn);
    });

    it('handles concurrent state updates correctly', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate concurrent updates
      act(() => {
        result.current.updateNoteOptimistic('note-1', { title: 'Update 1' });
        result.current.updateNoteOptimistic('note-1', { content: 'Update 2' });
      });

      const updatedNote = result.current.notes.find(n => n.id === 'note-1');
      expect(updatedNote?.title).toBe('Update 1');
      expect(updatedNote?.content).toBe('Update 2');
    });
  });

  describe('Performance Considerations', () => {
    it('prevents multiple simultaneous loads', async () => {
      const { result } = renderHook(() => useNotesUnifiedContext());

      // The hook should only call the action once, even if mounted multiple times rapidly
      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();
    });

    it('handles React strict mode double mounting', async () => {
      // In strict mode, useEffect runs twice
      const { result, unmount } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Even with strict mode, should only call once due to hasLoadedRef guard
      expect(mockGetNotesUnifiedContext).toHaveBeenCalledOnce();

      unmount();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty notes array', async () => {
      const emptyResponse: NotesUnifiedContextResult = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data!,
          notes: []
        }
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(emptyResponse);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toEqual([]);
      expect(result.current.isNotesEnabled).toBe(true);
    });

    it('handles disabled notes feature', async () => {
      const disabledResponse: NotesUnifiedContextResult = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data!,
          isNotesEnabled: false
        }
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(disabledResponse);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isNotesEnabled).toBe(false);
      expect(result.current.notes).toEqual(mockNotes); // Notes data still present
    });

    it('handles null/undefined data gracefully', async () => {
      const nullResponse: NotesUnifiedContextResult = {
        success: true,
        data: undefined
      };
      mockGetNotesUnifiedContext.mockResolvedValueOnce(nullResponse);

      const { result } = renderHook(() => useNotesUnifiedContext());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load Notes context');
    });
  });
});