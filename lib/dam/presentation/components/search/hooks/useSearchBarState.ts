'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { useDamSearchInput } from '../../../hooks/search/useDamSearchInput';
import { useDamSearchDropdown } from '../../../hooks/search/useDamSearchDropdown';
import { useDamUrlManager } from '../../../hooks/navigation/useDamUrlManager';
import { useDamTagFilterHandler } from '../../../hooks/search/useDamTagFilterHandler';
import { SearchInputHandler } from '../services/SearchInputHandler';
import { SavedSearchHandler } from '../services/SavedSearchHandler';
import { CurrentSearchCriteria } from '../../../hooks/search/useSavedSearches';
import { DamFilterParameters, DamSortParameters } from '../../../../application/dto/SearchCriteriaDTO';

interface UseSearchBarStateProps {
  currentFolderId: string | null;
  gallerySearchTerm: string;
  currentFilters?: Record<string, unknown>;
  currentSortParams?: Record<string, unknown>;
  currentTagIds?: string[];
}

interface UseSearchBarStateReturn {
  // Search input state
  searchInputTerm: string;
  setSearchInputTerm: (term: string) => void;
  debouncedSearchTerm: string;
  setDebouncedSearchTerm: (term: string) => void;
  
  // UI state
  inputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
  dropdownDisabled: boolean;
  setDropdownDisabled: (disabled: boolean) => void;
  
  // Dropdown state
  isDropdownOpen: boolean;
  dropdownResults: GalleryItemDto[];
  isDropdownLoading: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  actualDropdownOpen: boolean;
  
  // Tag filtering
  activeOrgId: string | null;
  selectedTagIdsFromUrl: string[];
  handleTagFilterChange: (tagIds: string[]) => void;
  
  // Search criteria
  currentSearchCriteria: CurrentSearchCriteria;
  
  // Refs
  mainSearchedTermRef: React.MutableRefObject<string | null>;
  searchContainerRef: React.RefObject<HTMLElement | null>;
  
  // Handlers
  handleMainSearch: (searchTermToUse?: string) => void;
  handleExecuteSavedSearch: (searchCriteria: CurrentSearchCriteria) => void;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleClearSearch: () => void;
  handleDropdownItemSelect: (item: GalleryItemDto) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
}

/**
 * useSearchBarState Hook
 * Follows Single Responsibility Principle - manages search bar state and business logic
 */
export const useSearchBarState = ({
  currentFolderId,
  gallerySearchTerm,
  currentFilters,
  currentSortParams,
  currentTagIds,
}: UseSearchBarStateProps): UseSearchBarStateReturn => {
  const router = useRouter();
  const urlManager = useDamUrlManager();

  const {
    searchInputTerm,
    setSearchInputTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
  } = useDamSearchInput({ initialValue: gallerySearchTerm });

  const mainSearchedTermRef = useRef<string | null>(null);
  const searchContainerRef = useRef<HTMLElement | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [dropdownDisabled, setDropdownDisabled] = useState(false);

  // Use the tag filtering hook
  const {
    activeOrgId,
    selectedTagIdsFromUrl: selectedTagIdsSet,
    handleTagFilterChange: handleTagFilterChangeSet,
  } = useDamTagFilterHandler({ gallerySearchTerm, currentFolderId });

  // Convert Set to Array for component interface
  const selectedTagIdsFromUrl = Array.from(selectedTagIdsSet);
  const handleTagFilterChange = (tagIds: string[]) => {
    handleTagFilterChangeSet(new Set(tagIds));
  };

  const {
    isDropdownOpen,
    dropdownResults,
    isDropdownLoading,
    setIsDropdownOpen,
  } = useDamSearchDropdown({
    debouncedSearchTerm,
    currentFolderId: currentFolderId || undefined,
    mainSearchedTerm: mainSearchedTermRef.current || undefined,
    gallerySearchTerm,
    inputFocused,
    searchContainerRef,
  });
  
  const actualDropdownOpen = dropdownDisabled ? false : isDropdownOpen;

  // Build current search criteria for saved searches
  const currentSearchCriteria = SavedSearchHandler.buildCurrentSearchCriteria(
    gallerySearchTerm,
    currentFolderId,
    currentTagIds,
    currentFilters,
    currentSortParams
  );

  const handleMainSearch = useCallback(
    (searchTermToUse?: string) => {
      const term = typeof searchTermToUse === 'string' ? searchTermToUse : searchInputTerm;
      const trimmedTerm = SearchInputHandler.processSearchTerm(term);

      mainSearchedTermRef.current = trimmedTerm;
      setSearchInputTerm(trimmedTerm);
      setDebouncedSearchTerm(trimmedTerm);
      setIsDropdownOpen(false);
      setInputFocused(false);
      setDropdownDisabled(true);

      SearchInputHandler.clearInputFocus(searchContainerRef);
      urlManager.setSearchAndFolder(trimmedTerm, currentFolderId);
    },
    [
      searchInputTerm, currentFolderId, urlManager,
      setIsDropdownOpen, setSearchInputTerm, setInputFocused, setDebouncedSearchTerm, setDropdownDisabled
    ]
  );

  const handleExecuteSavedSearch = useCallback((searchCriteria: CurrentSearchCriteria) => {
    const params = SavedSearchHandler.buildSearchParams(searchCriteria);
    
    // Update local state
    if (searchCriteria.searchTerm) {
      setSearchInputTerm(searchCriteria.searchTerm);
      setDebouncedSearchTerm(searchCriteria.searchTerm);
      mainSearchedTermRef.current = searchCriteria.searchTerm;
    }
    
    // Close dropdowns and blur input
    setIsDropdownOpen(false);
    setInputFocused(false);
    setDropdownDisabled(true);
    SearchInputHandler.clearInputFocus(searchContainerRef);
    
    // Navigate with the new parameters
    router.push(`?${params.toString()}`);
  }, [router, setSearchInputTerm, setDebouncedSearchTerm, setIsDropdownOpen, setInputFocused, setDropdownDisabled]);

  useEffect(() => {
    setDropdownDisabled(false);
  }, [gallerySearchTerm, currentFolderId]);

  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleMainSearch();
  }, [handleMainSearch]);

  const handleClearSearch = useCallback(() => {
    mainSearchedTermRef.current = null;
    setSearchInputTerm('');
    setDebouncedSearchTerm('');
    setIsDropdownOpen(false);
    
    urlManager.clearSearchPreserveContext(currentFolderId);
  }, [setSearchInputTerm, setDebouncedSearchTerm, setIsDropdownOpen, urlManager, currentFolderId]);

  const handleDropdownItemSelect = useCallback((item: GalleryItemDto) => {
    setIsDropdownOpen(false);
    if (item.type === 'folder') {
      setSearchInputTerm(''); 
      setDebouncedSearchTerm('');
      urlManager.navigateToFolder(item.id, { preserveTagFilters: true, preserveSearchQuery: false });
    } else {
      handleMainSearch(item.name);
      setSearchInputTerm(''); 
      setDebouncedSearchTerm('');
    }
  }, [setIsDropdownOpen, setSearchInputTerm, setDebouncedSearchTerm, urlManager, handleMainSearch]);

  const handleInputFocus = useCallback(() => {
    setInputFocused(true);
    if (SearchInputHandler.shouldShowDropdown(searchInputTerm, dropdownResults.length > 0, isDropdownLoading, true)) {
      setIsDropdownOpen(true);
    }
  }, [searchInputTerm, dropdownResults.length, isDropdownLoading, setInputFocused, setIsDropdownOpen]);

  const handleInputBlur = useCallback(() => {
    setInputFocused(false);
  }, [setInputFocused]);

  return {
    // Search input state
    searchInputTerm,
    setSearchInputTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
    
    // UI state
    inputFocused,
    setInputFocused,
    dropdownDisabled,
    setDropdownDisabled,
    
    // Dropdown state
    isDropdownOpen,
    dropdownResults,
    isDropdownLoading,
    setIsDropdownOpen,
    actualDropdownOpen,
    
    // Tag filtering
    activeOrgId,
    selectedTagIdsFromUrl,
    handleTagFilterChange,
    
    // Search criteria
    currentSearchCriteria,
    
    // Refs
    mainSearchedTermRef,
    searchContainerRef,
    
    // Handlers
    handleMainSearch,
    handleExecuteSavedSearch,
    handleFormSubmit,
    handleClearSearch,
    handleDropdownItemSelect,
    handleInputFocus,
    handleInputBlur,
  };
}; 
