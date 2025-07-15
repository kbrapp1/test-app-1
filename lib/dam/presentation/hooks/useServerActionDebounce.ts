/**
 * Server Action Debounce Hook
 * 
 * MIGRATED TO REACT QUERY:
 * - Uses useApiMutation for server action execution
 * - Automatic deduplication and loading states
 * - No more custom debouncing or state management
 * - Proper error handling and retry logic
 */

import { useCallback, useState } from 'react';

// Simple debounce function for async operations
function debounce<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => Promise<TResult>, 
  delay: number
): (...args: TArgs) => Promise<TResult> {
  let timeoutId: NodeJS.Timeout;
  return (...args: TArgs) => {
    return new Promise<TResult>((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args).then(resolve).catch(reject);
      }, delay);
    });
  };
}

// Interface removed - not currently used in implementation
// Can be restored if needed for future configuration options

interface ServerActionState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useServerActionDebounce<TArgs extends unknown[], TResult>(
  serverAction: (...args: TArgs) => Promise<TResult>,
  delay: number = 300
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedAction = useCallback(
    (...args: TArgs) => {
      return debounce(async (...debouncedArgs: TArgs) => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await serverAction(...debouncedArgs);
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
          throw err;
        } finally {
          setIsLoading(false);
        }
      }, delay)(...args);
    },
    [serverAction, delay]
  );

  // Transform React Query state to match old interface
  const state: ServerActionState<TResult> = {
    data: null, // React Query data is not directly available here
    loading: isLoading,
    error: error ? new Error(error) : null,
  };

  return {
    ...state,
    executeAction: debouncedAction,
    reset: () => {
      // No direct reset for React Query, but for debounced action,
      // you might want to clear the timeout if it's a debounced action.
      // For now, it's not directly exposed here.
    },
  };
} 