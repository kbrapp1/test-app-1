import React, { useState, useEffect, useRef } from 'react';
import type { GalleryItemDto } from '../../application/use-cases/folders/ListFolderContentsUseCase';

interface UseDamSearchDropdownProps {
  debouncedSearchTerm: string;
  currentFolderId: string | null;
  mainSearchedTerm: string | null; // To prevent dropdown for just-submitted main search
  gallerySearchTerm: string; // To avoid re-fetching if term matches current gallery search
  inputFocused: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement | null>; // Allow null from parent
}

interface UseDamSearchDropdownReturn {
  isDropdownOpen: boolean;
  dropdownResults: GalleryItemDto[];
  isDropdownLoading: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // Allow parent to close
}

/**
 * Domain presentation hook for managing search dropdown autocomplete functionality
 * 
 * Handles:
 * - Autocomplete search results fetching
 * - Dropdown open/close state management
 * - Loading states for search requests
 * - Click-outside to close behavior
 * - Request cancellation for stale requests
 */
export function useDamSearchDropdown({
  debouncedSearchTerm,
  currentFolderId,
  mainSearchedTerm,
  gallerySearchTerm,
  inputFocused,
  searchContainerRef, // Use this for click-outside
}: UseDamSearchDropdownProps): UseDamSearchDropdownReturn {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownResults, setDropdownResults] = useState<GalleryItemDto[]>([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);

  const fetchControllerRef = useRef(0);

  useEffect(() => {
    if (debouncedSearchTerm.trim() !== '' && debouncedSearchTerm.trim() === mainSearchedTerm) {
      setIsDropdownOpen(false);
      setDropdownResults([]);
      return;
    }

    if (debouncedSearchTerm.trim() === '') {
      fetchControllerRef.current++;
      setIsDropdownOpen(false);
      setDropdownResults([]);
      setIsDropdownLoading(false);
      return;
    }

    // Avoid re-fetching if the debounced term is already the main gallery search term
    // and the dropdown is not currently open (e.g., user clicked away and then refocused)
    // unless the input is focused and we might want to show previous results.
    if (debouncedSearchTerm === gallerySearchTerm && gallerySearchTerm !== '' && !isDropdownOpen && !inputFocused) {
      return;
    }
    if (debouncedSearchTerm === gallerySearchTerm && gallerySearchTerm !== '' && isDropdownOpen && dropdownResults.length > 0) {
        // If already open with this term, no need to re-fetch
        return;
    }

    const currentFetchId = ++fetchControllerRef.current;
    const fetchResults = async () => {
      if (debouncedSearchTerm.trim() === '') {
        if (fetchControllerRef.current === currentFetchId) {
          setIsDropdownOpen(false);
          setDropdownResults([]);
          setIsDropdownLoading(false);
        }
        return;
      }

      setIsDropdownLoading(true);
      const apiUrl = `/api/dam?folderId=${currentFolderId ?? ''}&q=${encodeURIComponent(debouncedSearchTerm)}&limit=5&quickSearch=true&_=${Date.now()}`;
      try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (fetchControllerRef.current !== currentFetchId) return; // Stale request

        if (!res.ok) throw new Error('Failed to fetch suggestions');
        // The API returns an object with a `data` array and `totalItems`
        const jsonResponse = await res.json() as { data?: GalleryItemDto[]; totalItems?: number };
        const items: GalleryItemDto[] = Array.isArray(jsonResponse.data) ? jsonResponse.data : [];

        if (fetchControllerRef.current === currentFetchId) {
          setDropdownResults(items);
          if (debouncedSearchTerm.trim() !== '' && items.length > 0 && inputFocused) {
            setIsDropdownOpen(true);
          } else if (debouncedSearchTerm.trim() !== '' && items.length === 0 && inputFocused) {
            // Show dropdown even with no results to display "no results" message
            setIsDropdownOpen(true);
          } else if (!inputFocused && items.length === 0) {
            setIsDropdownOpen(false); // If not focused and no results, hide
          }
          // If input is not focused but we got results, keep it closed until focus
        }
      } catch (error) {
        if (fetchControllerRef.current === currentFetchId) {
          console.error('Error fetching dropdown search results:', error);
          setDropdownResults([]);
          // Show dropdown with error/no results message if focused
          if (debouncedSearchTerm.trim() !== '' && inputFocused) setIsDropdownOpen(true);
          else setIsDropdownOpen(false);
        }
      }
      if (fetchControllerRef.current === currentFetchId) {
        setIsDropdownLoading(false);
      }
    };

    // Just call fetchResults directly if other conditions pass
    fetchResults();
  }, [debouncedSearchTerm, currentFolderId, mainSearchedTerm, gallerySearchTerm, inputFocused]);

  useEffect(() => {
    // Effect for click-outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchContainerRef]); // Depend on the passed ref

  return { isDropdownOpen, dropdownResults, isDropdownLoading, setIsDropdownOpen };
} 
