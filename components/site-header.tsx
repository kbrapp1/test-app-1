'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { SearchIcon, List, LayoutGrid, History } from "lucide-react"
import { usePalette } from "@/context/palette-context"
import { DamSearchBar } from "@/lib/dam/presentation/components/search/DamSearchBar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewMode } from "@/lib/dam/presentation/types/interfaces"

export function SiteHeader() {
  const { setOpen: setPaletteOpen } = usePalette();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Props for DamSearchBar, derived from URL or defaults
  const currentFolderIdForDamSearch = pathname.startsWith('/dam') ? searchParams.get('folderId') : null;
  const gallerySearchTermForDamSearch = pathname.startsWith('/dam') ? searchParams.get('search') || searchParams.get('q') || '' : '';

  // Extract current filters and sort params from URL for saved search functionality
  const currentFilters = pathname.startsWith('/dam') ? {
    type: searchParams.get('type') || undefined,
    creationDateOption: searchParams.get('creationDateOption') || undefined,
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    ownerId: searchParams.get('ownerId') || undefined,
    sizeOption: searchParams.get('sizeOption') || undefined,
    sizeMin: searchParams.get('sizeMin') || undefined,
    sizeMax: searchParams.get('sizeMax') || undefined,
  } : undefined;

  const currentSortParams = pathname.startsWith('/dam') ? {
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  } : undefined;

  const currentTagIds = pathname.startsWith('/dam') ? 
    searchParams.get('tagIds')?.split(',').filter(id => id.trim()) || [] : 
    undefined;

  // ViewMode state and effects - only active for DAM pages
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const isDamPage = pathname.startsWith('/dam');
  const isImageGeneratorPage = pathname === '/ai-playground/image-generator';

  useEffect(() => {
    if (isDamPage) {
      const storedViewMode = localStorage.getItem('damViewMode') as ViewMode | null;
      if (storedViewMode && (storedViewMode === 'grid' || storedViewMode === 'list')) {
        setViewMode(storedViewMode);
      }
    }
  }, [isDamPage]);

  useEffect(() => {
    if (isDamPage) {
      localStorage.setItem('damViewMode', viewMode);
      window.dispatchEvent(new CustomEvent('damViewModeChange', { detail: { newViewMode: viewMode } }));
    }
  }, [viewMode, isDamPage]);

  // Image Generator History Handler
  const handleToggleImageHistory = () => {
    window.dispatchEvent(new CustomEvent('toggleImageGeneratorHistory'));
  };

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear pt-4">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        
        {isImageGeneratorPage && (
          <>
            <h1 className="text-lg font-semibold text-gray-900">AI Image Generation</h1>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          </>
        )}

        {isDamPage && (
          <div className="max-w-2xl flex-grow">
            <DamSearchBar 
              currentFolderId={currentFolderIdForDamSearch}
              gallerySearchTerm={gallerySearchTermForDamSearch}
              currentFilters={currentFilters}
              currentSortParams={currentSortParams}
              currentTagIds={currentTagIds}
            />
          </div>
        )}

        <div className={`ml-auto flex items-center gap-2 ${!isDamPage && !isImageGeneratorPage ? 'flex-grow justify-end' : ''}`}>
          {isDamPage && (
            <>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => {
                  if (value) {
                    const newMode = value as ViewMode;
                    setViewMode(newMode);
                  }
                }} 
                aria-label="View mode"
                className="mr-2"
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-5 w-5" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            </>
          )}
          {isImageGeneratorPage && (
            <>
              {/* Model selector placeholder - will be populated by ImageGeneratorMain */}
              <div id="image-generator-model-selector" className="flex items-center"></div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleToggleImageHistory}
                aria-label="Toggle image history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
