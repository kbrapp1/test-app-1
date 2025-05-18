import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, UploadCloud, XIcon } from 'lucide-react';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import type { CombinedItem } from '@/types/dam';
import { useDamSearchInput } from './hooks/useDamSearchInput';
import { useDamSearchDropdown } from './hooks/useDamSearchDropdown';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { DamTagFilter } from './DamTagFilter';
import { useDamUrlManager } from '@/lib/hooks/useDamUrlManager';

interface DamSearchBarProps {
  currentFolderId: string | null;
  gallerySearchTerm: string;
}

export function DamSearchBar({ currentFolderId, gallerySearchTerm }: DamSearchBarProps) {
  const router = useRouter();
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

  // State for Tag Filtering
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  // This state now represents the source of truth for selected tags from the URL
  const [selectedTagIdsFromUrl, setSelectedTagIdsFromUrl] = useState<Set<string>>(new Set());

  // Get active organization ID on client side
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const orgId = await getActiveOrganizationId();
        setActiveOrgId(orgId);
      } catch (error) {
        console.error("Failed to get active organization ID for tag filter", error);
      }
    };
    fetchOrgId();
  }, []);

  // Initialize selectedTagIdsFromUrl from URL search params
  const searchParams = useSearchParams();
  useEffect(() => {
    const currentTagIdsParam = searchParams.get('tagIds');
    if (currentTagIdsParam) {
      setSelectedTagIdsFromUrl(new Set(currentTagIdsParam.split(',').map(id => id.trim()).filter(id => id)));
    } else {
      setSelectedTagIdsFromUrl(new Set());
    }
  }, [searchParams]);

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

  const handleTagFilterChange = useCallback((newTagIds: Set<string>) => {
    urlManager.setTagsPreserveContext(newTagIds, gallerySearchTerm, currentFolderId);
  }, [gallerySearchTerm, currentFolderId, urlManager]);

  // Function to handle navigation to upload page
  const navigateToUpload = () => {
    const uploadPath = currentFolderId ? `/dam/upload?folderId=${currentFolderId}` : '/dam/upload';
    router.push(uploadPath);
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
        
        <DamTagFilter
            activeOrgId={activeOrgId}
            initialSelectedTagIdsFromUrl={selectedTagIdsFromUrl}
            onFilterChange={handleTagFilterChange}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={navigateToUpload}>
                <UploadCloud className="h-5 w-5" />
                Upload
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload assets</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="outline" size="icon" className="sm:hidden" onClick={navigateToUpload}>
          <UploadCloud className="h-5 w-5" />
          <span className="sr-only">Upload</span>
        </Button>
      </div>
    </>
  );
} 