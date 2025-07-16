import React from 'react';
import { useApiQuery } from './useQuery';

/**
 * Infrastructure Layer - Search Hook
 * Single Responsibility: Debounced search queries
 */

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for debounced search queries
export function useSearchQuery<T = unknown>(
  searchTerm: string,
  url: string,
  debounceMs: number = 300,
  enabled: boolean = true
) {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  return useApiQuery<T>(
    ['search', url, debouncedSearchTerm],
    `${url}?search=${encodeURIComponent(debouncedSearchTerm)}`,
    {},
    {
      enabled: enabled && debouncedSearchTerm.length > 0,
      staleTime: 30 * 1000, // 30 seconds for search results
    }
  );
} 