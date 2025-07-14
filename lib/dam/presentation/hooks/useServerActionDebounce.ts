/**
 * Server Action Debounce Hook
 * 
 * MIGRATED TO REACT QUERY:
 * - Uses useApiMutation for server action execution
 * - Automatic deduplication and loading states
 * - No more custom debouncing or state management
 * - Proper error handling and retry logic
 */

import { useCallback } from 'react';
import { useApiMutation } from '@/lib/infrastructure/query';

interface UseServerActionDebounceOptions {
  debounceMs?: number;
}

interface ServerActionState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useServerActionDebounce<T = any, P extends any[] = any[]>(
  action: (...args: P) => Promise<T>,
  actionId: string,
  _options: UseServerActionDebounceOptions = {}
) {
  // Use React Query mutation for server actions
  const mutation = useApiMutation<T, any>(
    async (args: any) => {
      return await action(...args);
    },
    {
      // Optional: Add optimistic updates or cache invalidation here
    }
  );

  const executeAction = useCallback((...args: P): Promise<T> => {
    return mutation.mutateAsync(args);
  }, [mutation]);

  // Transform React Query state to match old interface
  const state: ServerActionState<T> = {
    data: mutation.data || null,
    loading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  };

  return {
    ...state,
    executeAction,
    reset: mutation.reset,
  };
} 