import { useQueryClient } from '@tanstack/react-query';

/**
 * Infrastructure Layer - Cache Invalidation Hook
 * Single Responsibility: Query cache management
 */

// Hook for cache invalidation
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateByKey: (queryKey: string[]) => queryClient.invalidateQueries({ queryKey }),
    invalidateByPattern: (pattern: string) => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        ),
      });
    },
    removeQueries: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
    clearAll: () => queryClient.clear(),
  };
} 