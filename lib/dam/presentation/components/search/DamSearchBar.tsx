import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, UploadCloud, XIcon } from 'lucide-react';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import type { CombinedItem } from '../../../types/component';
import { useDamSearchInput } from '../../hooks/useDamSearchInput';
import { useDamSearchDropdown } from '../../hooks/useDamSearchDropdown';
import { DamTagFilter } from '../filters/DamTagFilter';
import { useDamUrlManager } from '../../hooks/useDamUrlManager';
import { useDamTagFilterHandler } from '../../hooks/useDamTagFilterHandler';
import { DamUploadButton } from '../upload/DamUploadButton';
import { SavedSearchButton } from './SavedSearchButton';
import { CurrentSearchCriteria } from '../../hooks/useSavedSearches';

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

export function DamSearchBar({ 
  currentFolderId, 
  gallerySearchTerm,
  currentFilters,
  currentSortParams,
  currentTagIds 
}: DamSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlManager = useDamUrlManager();

  const {
    searchInputTerm,
    setSearchInputTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
  } = useDamSearchInput({ initialValue: gallerySearchTerm });

  const mainSearchedTermRef = useRef<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [dropdownDisabled, setDropdownDisabled] = useState(false);

  // Use the new hook for tag filtering
  const {
    activeOrgId,
    selectedTagIdsFromUrl,
    handleTagFilterChange,
  } = useDamTagFilterHandler({ gallerySearchTerm, currentFolderId });

  const {
    isDropdownOpen,
    dropdownResults,
    isDropdownLoading,
    setIsDropdownOpen,
  } = useDamSearchDropdown({
    debouncedSearchTerm,
    currentFolderId,
    mainSearchedTerm: mainSearchedTermRef.current,
    gallerySearchTerm,
    inputFocused,
    searchContainerRef,
  });
  
  const actualDropdownOpen = dropdownDisabled ? false : isDropdownOpen;

  // Build current search criteria for saved searches
  const currentSearchCriteria: CurrentSearchCriteria = {
    searchTerm: gallerySearchTerm,
    folderId: currentFolderId,
    tagIds: currentTagIds,
    filters: currentFilters,
    sortParams: currentSortParams,
  };

  const handleMainSearch = useCallback(
    (searchTermToUse?: string) => {
      const term = typeof searchTermToUse === 'string' ? searchTermToUse : searchInputTerm;
      const trimmedTerm = term.trim();

      mainSearchedTermRef.current = trimmedTerm;
      setSearchInputTerm(trimmedTerm);
      setDebouncedSearchTerm(trimmedTerm);
      setIsDropdownOpen(false);
      setInputFocused(false);
      setDropdownDisabled(true);

      const inputElement = searchContainerRef.current?.querySelector('input[type="search"]');
      if (inputElement) {
        (inputElement as HTMLInputElement).blur();
      }
      
      urlManager.setSearchAndFolder(trimmedTerm, currentFolderId);
    },
    [
      searchInputTerm, currentFolderId, urlManager,
      setIsDropdownOpen, setSearchInputTerm, setInputFocused, setDebouncedSearchTerm, setDropdownDisabled
    ]
  );

  const handleExecuteSavedSearch = useCallback((searchCriteria: CurrentSearchCriteria) => {
    // Apply the saved search criteria to the current view
    const params = new URLSearchParams();
    
    if (searchCriteria.searchTerm) {
      params.set('search', searchCriteria.searchTerm);
      setSearchInputTerm(searchCriteria.searchTerm);
      setDebouncedSearchTerm(searchCriteria.searchTerm);
      // Update the main search reference to ensure it's recognized as executed
      mainSearchedTermRef.current = searchCriteria.searchTerm;
    }
    
    if (searchCriteria.folderId) {
      params.set('folderId', searchCriteria.folderId);
    }
    
    if (searchCriteria.tagIds && searchCriteria.tagIds.length > 0) {
      params.set('tagIds', searchCriteria.tagIds.join(','));
    }
    
    // Add filter parameters
    if (searchCriteria.filters) {
      Object.entries(searchCriteria.filters).forEach(([key, value]) => {
        if (value && value !== 'any') {
          params.set(key, value);
        }
      });
    }
    
    // Add sort parameters
    if (searchCriteria.sortParams) {
      if (searchCriteria.sortParams.sortBy) {
        params.set('sortBy', searchCriteria.sortParams.sortBy);
      }
      if (searchCriteria.sortParams.sortOrder) {
        params.set('sortOrder', searchCriteria.sortParams.sortOrder);
      }
    }
    
    // Close any open dropdowns and blur input
    setIsDropdownOpen(false);
    setInputFocused(false);
    setDropdownDisabled(true);
    
    const inputElement = searchContainerRef.current?.querySelector('input[type="search"]');
    if (inputElement) {
      (inputElement as HTMLInputElement).blur();
    }
    
    // Navigate with the new parameters
    router.push(`?${params.toString()}`);
  }, [router, setSearchInputTerm, setDebouncedSearchTerm, setIsDropdownOpen, setInputFocused, setDropdownDisabled]);

  useEffect(() => {
    setDropdownDisabled(false);
  }, [gallerySearchTerm, currentFolderId]); // Also depends on currentFolderId

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleMainSearch();
  };

  const handleClearSearch = () => {
    mainSearchedTermRef.current = null;
    setSearchInputTerm('');
    setDebouncedSearchTerm('');
    setIsDropdownOpen(false);
    
    urlManager.clearSearchPreserveContext(currentFolderId);
  };

  const handleDropdownItemSelect = (item: CombinedItem) => {
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
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    if (searchInputTerm.trim() !== '' && (dropdownResults.length > 0 || isDropdownLoading)) {
        setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  return (
    <>
      <div ref={searchContainerRef} className="relative flex items-center gap-2 grow max-w-2xl">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 grow">
          <div className="relative grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search all assets & folders..."
              className="pl-10 py-2 h-10 text-base w-full"
              value={searchInputTerm}
              onChange={(e) => { 
                const val = e.target.value; 
                setSearchInputTerm(val); 
                mainSearchedTermRef.current = null;
                if (val === '') {
                  handleClearSearch(); 
                }
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {actualDropdownOpen && (
              <SearchDropdownMenu
                items={dropdownResults}
                onSelect={handleDropdownItemSelect}
                isLoading={isDropdownLoading}
                searchTermForDisplay={debouncedSearchTerm}
                onViewAllResults={() => handleMainSearch(debouncedSearchTerm)}
                closeDropdown={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
          {searchInputTerm && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={handleClearSearch} className="h-9 w-9 p-0">
                    <XIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear search</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </form>
        
        <SavedSearchButton 
          currentSearchCriteria={currentSearchCriteria}
          onExecuteSearch={handleExecuteSavedSearch}
        />
        
        <DamTagFilter
            organizationId={activeOrgId}
            selectedTagIds={selectedTagIdsFromUrl}
            onTagFilterChange={handleTagFilterChange}
        />

        <DamUploadButton currentFolderId={currentFolderId} />
      </div>
    </>
  );
}