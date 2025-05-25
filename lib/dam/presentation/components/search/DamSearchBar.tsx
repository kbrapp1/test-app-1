import React from 'react';
import { useSearchBarState } from './hooks/useSearchBarState';
import { SearchForm } from './components/SearchForm';
import { SearchActions } from './components/SearchActions';

interface DamSearchBarProps {
  currentFolderId: string | null;
  gallerySearchTerm: string;
  // Add current search state for saved searches
  currentFilters?: {
    type?: string;
    creationDateOption?: string;
    dateStart?: string;
    dateEnd?: string;
    ownerId?: string;
    sizeOption?: string;
    sizeMin?: string;
    sizeMax?: string;
  };
  currentSortParams?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  currentTagIds?: string[];
}

/**
 * Domain Search Bar Component
 * 
 * Comprehensive search interface for DAM with:
 * - Search input with autocomplete dropdown
 * - Saved search functionality
 * - Tag filtering
 * - Upload button integration
 * 
 * Follows Single Responsibility Principle - coordinates search bar display and interactions
 */
export function DamSearchBar({ 
  currentFolderId, 
  gallerySearchTerm,
  currentFilters,
  currentSortParams,
  currentTagIds 
}: DamSearchBarProps) {
  // Use custom hook for all search bar state and logic
  const {
    searchInputTerm,
    setSearchInputTerm,
    debouncedSearchTerm,
    actualDropdownOpen,
    dropdownResults,
    isDropdownLoading,
    activeOrgId,
    selectedTagIdsFromUrl,
    handleTagFilterChange,
    currentSearchCriteria,
    mainSearchedTermRef,
    searchContainerRef,
    handleMainSearch,
    handleExecuteSavedSearch,
    handleFormSubmit,
    handleClearSearch,
    handleDropdownItemSelect,
    handleInputFocus,
    handleInputBlur,
  } = useSearchBarState({
    currentFolderId,
    gallerySearchTerm,
    currentFilters,
    currentSortParams,
    currentTagIds,
  });

  const handleMainSearchedTermClear = () => {
    mainSearchedTermRef.current = null;
  };

  const handleViewAllResults = () => {
    handleMainSearch(debouncedSearchTerm);
  };

  return (
    <>
      <div ref={searchContainerRef} className="relative flex items-center gap-2 grow max-w-2xl">
        <SearchForm
          searchInputTerm={searchInputTerm}
          onSearchInputChange={setSearchInputTerm}
          onFormSubmit={handleFormSubmit}
          onClearSearch={handleClearSearch}
          onInputFocus={handleInputFocus}
          onInputBlur={handleInputBlur}
          onMainSearchedTermClear={handleMainSearchedTermClear}
          actualDropdownOpen={actualDropdownOpen}
          dropdownResults={dropdownResults}
          isDropdownLoading={isDropdownLoading}
          debouncedSearchTerm={debouncedSearchTerm}
          onDropdownItemSelect={handleDropdownItemSelect}
          onViewAllResults={handleViewAllResults}
          onCloseDropdown={() => {}} // Will be handled by the hook
        />
        
        <SearchActions
          currentSearchCriteria={currentSearchCriteria}
          onExecuteSearch={handleExecuteSavedSearch}
          activeOrgId={activeOrgId}
          selectedTagIds={selectedTagIdsFromUrl}
          onTagFilterChange={handleTagFilterChange}
          currentFolderId={currentFolderId}
        />
      </div>
    </>
  );
}
