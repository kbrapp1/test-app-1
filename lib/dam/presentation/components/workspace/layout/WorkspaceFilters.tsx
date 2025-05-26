import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  TypeFilter, 
  CreationDateFilter, 
  OwnerFilter, 
  SizeFilter, 
  SortControl 
} from '../../filters';
import { MultiSelectToggle } from '../../selection/MultiSelectToggle';
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
  
  // Multi-select states (optional) - selectedCount for display only
  selectedCount?: number;
  
  // Filter handlers
  setFilterType: (type: string | undefined) => void;
  setFilterCreationDateOption: (option: string | undefined, startDate?: string, endDate?: string) => void;
  setFilterOwnerId: (ownerId: string | undefined) => void;
  setFilterSizeOption: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  handleSortChange: (newSortBy: SortByValue | undefined, newSortOrder: SortOrderValue | undefined) => void;
  clearAllFilters: () => void;
  
  // Multi-select handlers (optional)
  onToggleMultiSelect?: () => void;
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
  selectedCount = 0,
  setFilterType,
  setFilterCreationDateOption,
  setFilterOwnerId,
  setFilterSizeOption,
  handleSortChange,
  clearAllFilters,
  onToggleMultiSelect,
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
      
      {/* Selection count display - only show when items are selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <span className="font-medium">{selectedCount} selected</span>
        </div>
      )}
      
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
