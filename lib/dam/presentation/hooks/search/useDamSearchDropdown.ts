import { useState, useEffect, useMemo } from 'react';
import { useApiQuery } from '@/lib/infrastructure/query';
import { GalleryItemDto } from '../../../domain/value-objects/GalleryItem';

interface UseDamSearchDropdownProps {
  debouncedSearchTerm: string;
  currentFolderId?: string;
  mainSearchedTerm?: string;
  gallerySearchTerm?: string;
  inputFocused: boolean;
  searchContainerRef?: React.RefObject<HTMLElement | null>;
}

interface UseDamSearchDropdownReturn {
  isDropdownOpen: boolean;
  dropdownResults: GalleryItemDto[];
  isDropdownLoading: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Domain presentation hook for managing search dropdown autocomplete functionality
 * 
 * MIGRATED TO REACT QUERY:
 * - Uses useSearchQuery for debounced search results
 * - Automatic request cancellation and deduplication
 * - No more manual fetch controllers or state management
 * - Click-outside behavior preserved
 */
export function useDamSearchDropdown({
  debouncedSearchTerm,
  currentFolderId,
  mainSearchedTerm,
  gallerySearchTerm,
  inputFocused,
  searchContainerRef,
}: UseDamSearchDropdownProps): UseDamSearchDropdownReturn {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Build search URL with query parameters
  const searchUrl = `/api/dam`;
  
  // Build full URL with search term manually since useSearchQuery expects base URL
  const fullSearchUrl = useMemo(() => {
    if (!debouncedSearchTerm?.trim()) return searchUrl;
    
    const params = new URLSearchParams();
    params.set('folderId', currentFolderId ?? '');
    params.set('limit', '5');
    params.set('quickSearch', 'true');
    params.set('q', debouncedSearchTerm);
    
    return `${searchUrl}?${params.toString()}`;
  }, [debouncedSearchTerm, currentFolderId, searchUrl]);
  
  // Use React Query for search with debouncing - use useApiQuery directly instead of useSearchQuery
  const {
    data: searchResponse,
    isLoading,
    error
  } = useApiQuery<{ data?: GalleryItemDto[]; totalItems?: number }>(
    ['dam-dropdown-search', debouncedSearchTerm, currentFolderId || ''],
    fullSearchUrl || searchUrl, // Provide fallback to ensure we have a valid URL
    {},
    {
      enabled: Boolean(debouncedSearchTerm?.trim()),
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  const dropdownResults = searchResponse?.data || [];

  // Handle dropdown open/close logic
  useEffect(() => {
    const shouldShowDropdown = Boolean(
      debouncedSearchTerm?.trim() && 
      inputFocused && 
      !isLoading &&
      !error
    );

    if (shouldShowDropdown) {
      setIsDropdownOpen(true);
    } else if (!inputFocused || !debouncedSearchTerm?.trim()) {
      setIsDropdownOpen(false);
    }
  }, [debouncedSearchTerm, inputFocused, isLoading, error]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef?.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isDropdownOpen, searchContainerRef]);

  // Close dropdown when main search term changes (user navigated to search results)
  useEffect(() => {
    if (mainSearchedTerm !== gallerySearchTerm) {
      setIsDropdownOpen(false);
    }
  }, [mainSearchedTerm, gallerySearchTerm]);

  return {
    isDropdownOpen,
    dropdownResults,
    isDropdownLoading: isLoading,
    setIsDropdownOpen,
  };
} 
