import { useState, useEffect } from 'react';

interface UseDamSearchInputProps {
  initialValue: string;
  debounceMs?: number;
}

interface UseDamSearchInputReturn {
  searchInputTerm: string;
  setSearchInputTerm: React.Dispatch<React.SetStateAction<string>>;
  debouncedSearchTerm: string;
  setDebouncedSearchTerm: React.Dispatch<React.SetStateAction<string>>; // Allow direct setting for clearing
}

/**
 * Domain presentation hook for managing search input state and debouncing
 * 
 * Handles:
 * - Search input state management
 * - Debounced search term for API calls
 * - Synchronization with external value changes
 */
export function useDamSearchInput({
  initialValue,
  debounceMs = 300,
}: UseDamSearchInputProps): UseDamSearchInputReturn {
  const [searchInputTerm, setSearchInputTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  useEffect(() => {
    // Sync with external initialValue changes (e.g., gallerySearchTerm prop)
    setSearchInputTerm(initialValue);
    setDebouncedSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    // Debounce the search input term
    // This condition helps avoid resetting debounce if initialValue changes and searchInputTerm is already aligned
    if (searchInputTerm === debouncedSearchTerm && initialValue === searchInputTerm) {
        // If everything is already in sync (e.g. initial load or after a clear that matches initialValue),
        // and searchInputTerm is already debounced, no need to run timeout.
        // Or, if initialValue changed and searchInputTerm was updated by the above effect,
        // we might not need to re-debounce if it's already the intended debounced value.
        // Let's simplify: always debounce unless searchInputTerm is empty and already matches debouncedSearchTerm
        if (searchInputTerm === '' && debouncedSearchTerm === '') {
            return;
        }
    }

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchInputTerm);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
     
    // Note: debouncedSearchTerm and initialValue are intentionally omitted from deps to prevent infinite loops
    // The conditional logic inside the effect handles synchronization correctly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInputTerm, debounceMs]);

  return { searchInputTerm, setSearchInputTerm, debouncedSearchTerm, setDebouncedSearchTerm };
} 
