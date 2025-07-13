/**
 * Notes Query Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - SIMPLIFIED: Removed mutations (moved to useNotesMutations.ts)
 * - REMOVED: Unused useNotesQuery function (dead code)
 * - Focus on core query functionality only
 * - Follow @golden-rule patterns exactly
 */

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getNotesData } from '../actions/notesUnifiedActions';
import { 
  useCreateNoteMutation, 
  useUpdateNoteMutation, 
  useDeleteNoteMutation, 
  useUpdateNoteOrderMutation 
} from './useNotesMutations';

/**
 * Combined hook for context + data in single API call
 * Eliminates redundant server actions by getting everything at once
 */
export function useNotesComplete(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notes-complete'],
    queryFn: async () => {
      const result = await getNotesData();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notes');
      }
      return result;
    },
    enabled,
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes cache retention
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    retry: (failureCount, error) => {
      if (error?.message?.includes('permission') || 
          error?.message?.includes('access') ||
          error?.message?.includes('authentication')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

 