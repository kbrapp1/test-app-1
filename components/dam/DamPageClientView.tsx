'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, LayoutGrid } from 'lucide-react';
import { AssetGalleryClient, type ViewMode } from './AssetGalleryClient';
import { DamBreadcrumbs, type BreadcrumbItemData } from './dam-breadcrumbs';
import { TypeFilter } from './filters/TypeFilter';
import { CreationDateFilter } from './filters/CreationDateFilter';
import { OwnerFilter } from './filters/OwnerFilter';
import { SizeFilter } from './filters/SizeFilter';
import { Button } from '@/components/ui/button';
import { SortControl } from './filters/SortControl';
import { useDamFilters, type SortByValue, type SortOrderValue } from './hooks/useDamFilters';

interface DamPageClientViewProps {
  initialCurrentFolderId: string | null;
  initialCurrentSearchTerm: string;
  breadcrumbPath: BreadcrumbItemData[];
}

export function DamPageClientView({ 
  initialCurrentFolderId, 
  initialCurrentSearchTerm,
  breadcrumbPath,
}: DamPageClientViewProps) {
  const [currentFolderId, setCurrentFolderId] = useState(initialCurrentFolderId);
  const [gallerySearchTerm, setGallerySearchTerm] = useState(initialCurrentSearchTerm);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const {
    filterType,
    setFilterType,
    filterCreationDateOption,
    setFilterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    setFilterOwnerId,
    filterSizeOption,
    setFilterSizeOption,
    filterSizeMin,
    filterSizeMax,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentTagIds,
    isAnyFilterActive,
    clearAllFilters,
    updateUrlParams,
  } = useDamFilters(currentFolderId);

  const [organizationMembers, setOrganizationMembers] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    setCurrentFolderId(initialCurrentFolderId);
  }, [initialCurrentFolderId]);

  useEffect(() => {
    setGallerySearchTerm(initialCurrentSearchTerm);
  }, [initialCurrentSearchTerm]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/team/members');
        if (!response.ok) {
          console.error('Failed to fetch organization members', response.statusText);
          setOrganizationMembers([]);
          return;
        }
        const data = await response.json();
        setOrganizationMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching organization members:', error);
        setOrganizationMembers([]);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const storedViewMode = localStorage.getItem('damViewMode') as ViewMode | null;
    if (storedViewMode && (storedViewMode === 'grid' || storedViewMode === 'list')) {
      setViewMode(storedViewMode);
    }
  }, []);

  useEffect(() => {
    const handleViewModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ newViewMode: ViewMode }>;
      if (customEvent.detail?.newViewMode) {
        setViewMode(customEvent.detail.newViewMode);
      }
    };
    window.addEventListener('damViewModeChange', handleViewModeChange);
    return () => {
      window.removeEventListener('damViewModeChange', handleViewModeChange);
    };
  }, []);

  const handleSortChange = (newSortBy: SortByValue | undefined, newSortOrder: SortOrderValue | undefined) => {
    // Update both parameters together using updateUrlParams directly to avoid race conditions
    if (newSortBy && newSortOrder) {
      // Both are provided, set them together
      updateUrlParams({ sortBy: newSortBy, sortOrder: newSortOrder });
    } else if (newSortBy) {
      // Only sortBy provided, use default order
      updateUrlParams({ sortBy: newSortBy, sortOrder: 'asc' });
    } else {
      // Clear sorting
      updateUrlParams({ sortBy: undefined, sortOrder: undefined });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pl-1 pr-4 pt-2 pb-4 md:pl-1 md:pr-6 md:pt-2 md:pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-grow min-w-0">
            {gallerySearchTerm && gallerySearchTerm.trim() !== '' ? (
                <div className="text-sm text-muted-foreground">
                Showing search results for "<strong>{gallerySearchTerm}</strong>". 
                <Link href={`/dam${currentFolderId ? '?folderId='+currentFolderId : ''}`} className="text-primary hover:underline ml-1">
                    Clear search
                </Link>
                </div>
            ) : (
                <DamBreadcrumbs path={breadcrumbPath} />
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <TypeFilter selectedType={filterType} onTypeChange={setFilterType} />
          <CreationDateFilter 
            selectedOption={filterCreationDateOption} 
            selectedStartDate={filterDateStart} 
            selectedEndDate={filterDateEnd} 
            onOptionChange={setFilterCreationDateOption} 
          />
          <OwnerFilter 
            selectedOwnerId={filterOwnerId} 
            onOwnerChange={setFilterOwnerId} 
            members={organizationMembers} 
          />
          <SizeFilter 
            selectedOption={filterSizeOption} 
            selectedMinSize={filterSizeMin}
            selectedMaxSize={filterSizeMax}
            onOptionChange={setFilterSizeOption}
          />
          <SortControl 
            currentSortBy={sortBy || null}
            currentSortOrder={sortOrder || null}
            onSortChange={handleSortChange} 
          />
          {isAnyFilterActive && (
            <Button variant="ghost" onClick={clearAllFilters} className="text-sm text-muted-foreground">
              Clear all filters
            </Button>
          )}
        </div>
      </div>

      <AssetGalleryClient 
        key={currentFolderId || 'root'}
        viewMode={viewMode} 
        currentFolderId={currentFolderId}
        searchTerm={gallerySearchTerm}
        tagIds={currentTagIds}
        filterType={filterType}
        filterCreationDateOption={filterCreationDateOption}
        filterDateStart={filterDateStart}
        filterDateEnd={filterDateEnd}
        filterOwnerId={filterOwnerId}
        filterSizeOption={filterSizeOption}
        filterSizeMin={filterSizeMin}
        filterSizeMax={filterSizeMax}
        sortBy={sortBy ? String(sortBy) : undefined}
        sortOrder={sortOrder ? String(sortOrder) : undefined}
      />
    </div>
  );
} 