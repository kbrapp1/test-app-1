import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, UploadCloud } from 'lucide-react';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import type { CombinedItem } from '@/types/dam';

interface DamSearchBarProps {
  currentFolderId: string | null;
  gallerySearchTerm: string;
}

export function DamSearchBar({ currentFolderId, gallerySearchTerm }: DamSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInputTerm, setSearchInputTerm] = useState(gallerySearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(gallerySearchTerm);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [dropdownSearchResults, setDropdownSearchResults] = useState<CombinedItem[]>([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInputTerm(gallerySearchTerm);
    setDebouncedSearchTerm(gallerySearchTerm);
    if (!gallerySearchTerm) {
      setIsSearchDropdownOpen(false);
      setDropdownSearchResults([]);
    }
  }, [gallerySearchTerm]);

  useEffect(() => {
    if (
      searchInputTerm.trim() === gallerySearchTerm.trim() &&
      searchInputTerm.trim() !== '' &&
      !isSearchDropdownOpen
    ) {
      return;
    }
    const handler = setTimeout(() => setDebouncedSearchTerm(searchInputTerm), 300);
    return () => clearTimeout(handler);
  }, [searchInputTerm, gallerySearchTerm, isSearchDropdownOpen]);

  useEffect(() => {
    if (debouncedSearchTerm.trim() === '') {
      setIsSearchDropdownOpen(false);
      setDropdownSearchResults([]);
      return;
    }
    if (debouncedSearchTerm === gallerySearchTerm && gallerySearchTerm !== '' && !isSearchDropdownOpen) {
      return;
    }
    const fetchDropdownResults = async () => {
      setIsDropdownLoading(true);
      const apiUrl = `/api/dam?folderId=${currentFolderId ?? ''}&q=${encodeURIComponent(debouncedSearchTerm)}&limit=5&quicksearch=true&_=${Date.now()}`;
      try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        const data: CombinedItem[] = await res.json();
        setDropdownSearchResults(data);
        if (debouncedSearchTerm.trim() !== '') setIsSearchDropdownOpen(true);
      } catch (error) {
        console.error('Error fetching dropdown search results:', error);
        setDropdownSearchResults([]);
        if (debouncedSearchTerm.trim() !== '') setIsSearchDropdownOpen(true);
      }
      setIsDropdownLoading(false);
    };
    fetchDropdownResults();
  }, [debouncedSearchTerm, currentFolderId, gallerySearchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMainSearch = useCallback(
    (searchTermToUse?: string) => {
      setIsSearchDropdownOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      const term = typeof searchTermToUse === 'string' ? searchTermToUse : searchInputTerm;
      if (term.trim()) params.set('q', term.trim()); else params.delete('q');
      if (currentFolderId) params.set('folderId', currentFolderId); else params.delete('folderId');
      const qs = params.toString();
      router.push(qs ? `/dam?${qs}` : '/dam');
    },
    [searchInputTerm, currentFolderId, router, searchParams]
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleMainSearch();
  };

  const handleClearSearch = () => {
    setSearchInputTerm('');
    setDebouncedSearchTerm('');
    setIsSearchDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    if (currentFolderId) params.set('folderId', currentFolderId); else params.delete('folderId');
    const qs = params.toString();
    router.push(qs ? `/dam?${qs}` : '/dam');
  };

  const handleDropdownItemSelect = (item: CombinedItem) => {
    setIsSearchDropdownOpen(false);
    if (item.type === 'folder') {
      setSearchInputTerm('');
      setDebouncedSearchTerm('');
      router.push(`/dam?folderId=${item.id}`);
    } else {
      handleMainSearch(item.name);
      setSearchInputTerm('');
      setDebouncedSearchTerm('');
    }
  };

  const handleInputFocus = () => {
    if (searchInputTerm.trim() !== '' && (dropdownSearchResults.length > 0 || isDropdownLoading)) {
      setIsSearchDropdownOpen(true);
    }
  };

  return (
    <>
      <div ref={searchContainerRef} className="relative flex items-center gap-2 grow max-w-2xl">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 grow">
          {currentFolderId && !gallerySearchTerm && <input type="hidden" name="folderId" value={currentFolderId} />}
          <div className="relative grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search all assets & folders..."
              className="pl-10 py-2 h-10 text-base w-full"
              value={searchInputTerm}
              onChange={(e) => { const val = e.target.value; setSearchInputTerm(val); if (val === '') handleClearSearch(); }}
              onFocus={handleInputFocus}
            />
            {isSearchDropdownOpen && (
              <SearchDropdownMenu
                items={dropdownSearchResults}
                onSelect={handleDropdownItemSelect}
                isLoading={isDropdownLoading}
                searchTermForDisplay={debouncedSearchTerm}
                onViewAllResults={() => handleMainSearch(debouncedSearchTerm)}
              />
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" variant="default" size="icon" aria-label="Search" className="shrink-0">
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Perform search</p></TooltipContent>
          </Tooltip>
        </form>
      </div>
      <div className="shrink-0">
        {!gallerySearchTerm ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon">
                <a href={currentFolderId ? `/dam/upload?folderId=${currentFolderId}` : '/dam/upload'} aria-label="Upload Asset">
                  <UploadCloud className="h-5 w-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Upload Asset</p></TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon">
                <a href="/dam/upload" aria-label="Upload Asset">
                  <UploadCloud className="h-5 w-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Upload Asset</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
} 