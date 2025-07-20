'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, XIcon } from 'lucide-react';
import { SearchDropdownMenu } from '../SearchDropdownMenu';
import type { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';

interface SearchFormProps {
  searchInputTerm: string;
  onSearchInputChange: (value: string) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClearSearch: () => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onMainSearchedTermClear: () => void;
  
  // Dropdown props
  actualDropdownOpen: boolean;
  dropdownResults: GalleryItemDto[];
  isDropdownLoading: boolean;
  debouncedSearchTerm: string;
  onDropdownItemSelect: (item: GalleryItemDto) => void;
  onViewAllResults: () => void;
  onCloseDropdown: () => void;
}

/**
 * SearchForm Component
 * Follows Single Responsibility Principle - handles search input form display and interactions
 */
export const SearchForm: React.FC<SearchFormProps> = ({
  searchInputTerm,
  onSearchInputChange,
  onFormSubmit,
  onClearSearch,
  onInputFocus,
  onInputBlur,
  onMainSearchedTermClear,
  actualDropdownOpen,
  dropdownResults,
  isDropdownLoading,
  debouncedSearchTerm,
  onDropdownItemSelect,
  onViewAllResults,
  onCloseDropdown,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchInputChange(val);
    onMainSearchedTermClear();
    if (val === '') {
      onClearSearch();
    }
  };

  return (
    <form onSubmit={onFormSubmit} className="flex items-center gap-2 grow">
      <div className="relative grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search all assets & folders..."
          className="pl-10 py-2 h-10 text-base w-full"
          value={searchInputTerm}
          onChange={handleInputChange}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
        {actualDropdownOpen && (
          <SearchDropdownMenu
            items={dropdownResults}
            onSelect={onDropdownItemSelect}
            isLoading={isDropdownLoading}
            searchTermForDisplay={debouncedSearchTerm}
            onViewAllResults={onViewAllResults}
            closeDropdown={onCloseDropdown}
          />
        )}
      </div>
      {searchInputTerm && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={onClearSearch} className="h-9 w-9 p-0">
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
  );
}; 
