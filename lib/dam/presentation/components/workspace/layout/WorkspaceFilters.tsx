import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  TypeFilter, 
  CreationDateFilter, 
  OwnerFilter, 
  SizeFilter, 
  SortControl 
} from '../../filters';
import type { SortByValue, SortOrderValue } from '../../../hooks/search/useDamFilters';

export interface WorkspaceFiltersProps {
  // Filter states
  filterType: string | undefined;
  filterCreationDateOption: string | undefined;
  filterDateStart: string | undefined;
  filterDateEnd: string | undefined;
  filterOwnerId: string | undefined;
  filterSizeOption: string | undefined;
  filterSizeMin: string | undefined;
  filterSizeMax: string | undefined;
  sortBy: SortByValue | undefined;
  sortOrder: SortOrderValue | undefined;
  isAnyFilterActive: boolean;
  
  // Organization data
  organizationMembers: Array<{id: string, name: string}>;
  
  // Filter handlers
  setFilterType: (type: string | undefined) => void;
  setFilterCreationDateOption: (option: string | undefined, startDate?: string, endDate?: string) => void;
  setFilterOwnerId: (ownerId: string | undefined) => void;
  setFilterSizeOption: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  handleSortChange: (newSortBy: SortByValue | undefined, newSortOrder: SortOrderValue | undefined) => void;
  clearAllFilters: () => void;
}

/**
 * WorkspaceFilters - Domain-Focused Workspace Filters Component
 * 
 * Orchestrates all filtering capabilities for the DAM workspace:
 * - Asset type filtering (images, videos, documents, etc.)
 * - Temporal filtering (creation date ranges)
 * - Ownership filtering (organization members)
 * - Size-based filtering (file size ranges)
 * - Sorting controls (name, date, size, type)
 * - Filter state management and clearing
 * 
 * Domain responsibility: workspace content filtering and organization
 */
export const WorkspaceFilters: React.FC<WorkspaceFiltersProps> = ({
  filterType,
  filterCreationDateOption,
  filterDateStart,
  filterDateEnd,
  filterOwnerId,
  filterSizeOption,
  filterSizeMin,
  filterSizeMax,
  sortBy,
  sortOrder,
  isAnyFilterActive,
  organizationMembers,
  setFilterType,
  setFilterCreationDateOption,
  setFilterOwnerId,
  setFilterSizeOption,
  handleSortChange,
  clearAllFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <TypeFilter 
        selectedType={filterType} 
        onTypeChange={setFilterType} 
      />
      
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
        <Button 
          variant="ghost" 
          onClick={clearAllFilters} 
          className="text-sm text-muted-foreground"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}; 
