'use client';
import React from 'react';
import { Loader2, Folder as FolderIconLucide, FileText as FileIconLucide } from 'lucide-react';
import type { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

interface SearchDropdownMenuProps {
  items: GalleryItemDto[];
  onSelect: (item: GalleryItemDto) => void;
  isLoading: boolean;
  searchTermForDisplay: string;
  onViewAllResults: () => void;
  closeDropdown: () => void;
}

export function SearchDropdownMenu({
  items,
  onSelect,
  isLoading,
  searchTermForDisplay,
  onViewAllResults,
  closeDropdown,
}: SearchDropdownMenuProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg rounded-md z-50 p-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin inline-block" />
        <p className="text-sm text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (searchTermForDisplay && items.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg rounded-md z-50 p-4">
        <p className="text-sm text-center text-muted-foreground">
                          No results found for &ldquo;<span className='font-semibold'>{searchTermForDisplay}</span>&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg rounded-md z-50 max-h-96 overflow-y-auto">
      {items.length > 0 && (
        <ul className="py-1">
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted truncate flex items-center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  closeDropdown();
                  onSelect(item);
                }}
              >
                {item.type === 'folder' ? (
                  <FolderIconLucide className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                ) : (
                  <FileIconLucide className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                )}
                <span className="truncate">
                  {item.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchTermForDisplay && (
        <div className={`px-3 py-2 ${items.length > 0 ? 'border-t border-border' : ''}`}> 
          <button
            type="button"
            className="w-full text-left text-sm text-primary hover:underline"
            onMouseDown={(e) => {
              e.preventDefault();
              closeDropdown();
              onViewAllResults();
            }}
          >
            Search for &ldquo;<span className="font-semibold">{searchTermForDisplay}</span>&rdquo;
          </button>
        </div>
      )}
    </div>
  );
} 
