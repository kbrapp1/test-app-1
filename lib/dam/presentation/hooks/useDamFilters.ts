import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, ReadonlyURLSearchParams, usePathname } from 'next/navigation';

/**
 * Valid sort field values for asset sorting
 */
export type SortByValue = 'name' | 'updated_at' | 'size' | 'mime_type';

/**
 * Valid sort order directions  
 */
export type SortOrderValue = 'asc' | 'desc';

/**
 * Complete filter state interface for DAM filters
 * Represents all possible filter parameters that can be applied to assets
 */
export interface DamFilterState {
  /** Asset type filter (e.g., 'image', 'video', 'document') */
  filterType: string | undefined;
  /** Creation date filter option (e.g., 'today', 'week', 'month', 'custom') */
  filterCreationDateOption: string | undefined;
  /** Start date for custom date range filtering */
  filterDateStart: string | undefined;
  /** End date for custom date range filtering */
  filterDateEnd: string | undefined;
  /** Filter by asset owner's user ID */
  filterOwnerId: string | undefined;
  /** Size filter option (e.g., 'small', 'medium', 'large', 'custom') */
  filterSizeOption: string | undefined;
  /** Minimum size for custom size filtering (in bytes) */
  filterSizeMin: string | undefined;
  /** Maximum size for custom size filtering (in bytes) */
  filterSizeMax: string | undefined;
  /** Field to sort assets by */
  sortBy: SortByValue | undefined;
  /** Sort order direction */
  sortOrder: SortOrderValue | undefined;
  /** Comma-separated tag IDs for filtering */
  currentTagIds: string | undefined;
}

/**
 * Complete return interface for the DAM filters hook
 * Provides both state values and action methods for filter management
 */
export interface UseDamFiltersReturn extends DamFilterState {
  /** Set the asset type filter */
  setFilterType: (value: string | undefined) => void;
  /** Set creation date filter with optional custom date range */
  setFilterCreationDateOption: (option: string | undefined, startDate?: string, endDate?: string) => void;
  /** Set the owner filter */
  setFilterOwnerId: (value: string | undefined) => void;
  /** Set size filter with optional custom size range */
  setFilterSizeOption: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  /** Set the sort field */
  setSortBy: (value: SortByValue | undefined) => void;
  /** Set the sort order */
  setSortOrder: (value: SortOrderValue | undefined) => void;
  /** Set tag filter */
  setCurrentTagIds: (value: string | undefined) => void;
  /** Whether any filter is currently active */
  isAnyFilterActive: boolean;
  /** Clear all active filters */
  clearAllFilters: () => void;
  /** Update multiple URL parameters at once */
  updateUrlParams: (paramsToUpdate: Partial<Omit<DamFilterState, 'folderId'> & { folderId?: string | null }>) => void;
}

/**
 * Helper function to safely extract typed URL search parameters
 * @param params - URL search parameters
 * @param key - Parameter key to extract
 * @returns Typed parameter value or undefined
 */
const getTypedParam = <T extends string>(params: ReadonlyURLSearchParams, key: string): T | undefined => {
  return (params.get(key) as T) || undefined;
};

/**
 * Domain hook for managing DAM filter state and URL synchronization
 * 
 * Provides comprehensive filter management for the Digital Asset Management system,
 * including type filters, date ranges, owner filters, size filters, sorting, and tag filters.
 * All filter state is automatically synchronized with URL parameters for shareable URLs.
 * 
 * @param currentFolderIdFromView - Current folder context for filter scope
 * @returns Complete filter state and management functions
 * 
 * @example
 * ```tsx
 * function DamPageView({ folderId }: { folderId: string | null }) {
 *   const {
 *     filterType,
 *     setFilterType,
 *     sortBy,
 *     setSortBy,
 *     isAnyFilterActive,
 *     clearAllFilters
 *   } = useDamFilters(folderId);
 *   
 *   return (
 *     <div>
 *       <TypeFilter value={filterType} onChange={setFilterType} />
 *       <SortControl sortBy={sortBy} onSortChange={setSortBy} />
 *       {isAnyFilterActive && (
 *         <Button onClick={clearAllFilters}>Clear Filters</Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDamFilters(currentFolderIdFromView: string | null): UseDamFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract all filter values directly from URL search parameters
  const filterType = getTypedParam<string>(searchParams, 'filterType');
  const filterCreationDateOption = getTypedParam<string>(searchParams, 'filterCreationDateOption');
  const filterDateStart = getTypedParam<string>(searchParams, 'filterDateStart');
  const filterDateEnd = getTypedParam<string>(searchParams, 'filterDateEnd');
  const filterOwnerId = getTypedParam<string>(searchParams, 'filterOwnerId');
  const filterSizeOption = getTypedParam<string>(searchParams, 'filterSizeOption');
  const filterSizeMin = getTypedParam<string>(searchParams, 'filterSizeMin');
  const filterSizeMax = getTypedParam<string>(searchParams, 'filterSizeMax');
  const sortBy = getTypedParam<SortByValue>(searchParams, 'sortBy');
  const sortOrder = getTypedParam<SortOrderValue>(searchParams, 'sortOrder');
  const currentTagIds = getTypedParam<string>(searchParams, 'tagIds');

  /**
   * Updates URL parameters with new filter values
   * Handles conditional parameter cleanup for related fields
   */
  const updateUrlParams = useCallback((paramsToUpdate: Partial<Omit<DamFilterState, 'folderId'> & { folderId?: string | null }>) => {
    const newParams = new URLSearchParams(searchParams.toString()); 

    // Apply all parameter updates
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) newParams.set(key, String(value));
      else newParams.delete(key);
    });

    // Clean up date parameters when not using custom date option
    const finalCreationDateOption = newParams.get('filterCreationDateOption');
    if (finalCreationDateOption !== 'custom') {
      if (!paramsToUpdate.hasOwnProperty('filterDateStart') || paramsToUpdate.filterDateStart === undefined) {
        newParams.delete('filterDateStart');
      }
      if (!paramsToUpdate.hasOwnProperty('filterDateEnd') || paramsToUpdate.filterDateEnd === undefined) {
        newParams.delete('filterDateEnd');
      }
    }

    // Clean up size parameters when not using custom size option
    const finalSizeOption = newParams.get('filterSizeOption');
    if (finalSizeOption !== 'custom') {
      if (!paramsToUpdate.hasOwnProperty('filterSizeMin') || paramsToUpdate.filterSizeMin === undefined) {
        newParams.delete('filterSizeMin');
      }
      if (!paramsToUpdate.hasOwnProperty('filterSizeMax') || paramsToUpdate.filterSizeMax === undefined) {
        newParams.delete('filterSizeMax');
      }
    }

    const queryString = newParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [searchParams, router, pathname]);

  /**
   * Determines if any filter is currently active
   * Used to show/hide "Clear all filters" functionality
   */
  const isAnyFilterActive = useMemo(() => {
    return !!(
      searchParams.get('filterType') ||
      searchParams.get('filterCreationDateOption') ||
      searchParams.get('filterOwnerId') ||
      searchParams.get('filterSizeOption')
    );
  }, [searchParams]);

  // Filter setters - each updates specific filter parameters
  const setFilterType = useCallback((value: string | undefined) => {
    updateUrlParams({ filterType: value });
  }, [updateUrlParams]);
  
  const setFilterCreationDateOption = useCallback((option: string | undefined, startDate?: string, endDate?: string) => {
    const newValues: Partial<DamFilterState> = { filterCreationDateOption: option };
    if (option === 'custom') {
      newValues.filterDateStart = startDate;
      newValues.filterDateEnd = endDate;
    } else {
      newValues.filterDateStart = undefined; 
      newValues.filterDateEnd = undefined;
    }
    updateUrlParams(newValues);
  }, [updateUrlParams]);

  const setFilterOwnerId = useCallback((value: string | undefined) => {
    updateUrlParams({ filterOwnerId: value });
  }, [updateUrlParams]);

  const setFilterSizeOption = useCallback((option: string | undefined, minSize?: number, maxSize?: number) => {
    const newValues: Partial<DamFilterState> = { filterSizeOption: option };
    if (option === 'custom') {
      newValues.filterSizeMin = minSize !== undefined ? minSize.toString() : undefined;
      newValues.filterSizeMax = maxSize !== undefined ? maxSize.toString() : undefined;
    } else {
      newValues.filterSizeMin = undefined;
      newValues.filterSizeMax = undefined;
    }
    updateUrlParams(newValues);
  }, [updateUrlParams]);

  // Sort setters - handle interdependent sort parameters
  const setSortBy = useCallback((value: SortByValue | undefined) => {
    const currentSortOrderValue = getTypedParam<SortOrderValue>(searchParams, 'sortOrder');
    const newSortOrder = value ? (currentSortOrderValue || 'asc') : undefined;
    updateUrlParams({ sortBy: value, sortOrder: newSortOrder });
  }, [updateUrlParams, searchParams]);
  
  const setSortOrder = useCallback((value: SortOrderValue | undefined) => {
    const currentSortByValue = getTypedParam<SortByValue>(searchParams, 'sortBy');
    const newSortBy = value ? (currentSortByValue || 'name') : undefined;
    updateUrlParams({ sortBy: newSortBy, sortOrder: value });
  }, [updateUrlParams, searchParams]);

  const setCurrentTagIds = useCallback((value: string | undefined) => {
    updateUrlParams({ currentTagIds: value });
  }, [updateUrlParams]);

  /**
   * Clears all active filters but preserves search and folder parameters
   */
  const clearAllFilters = useCallback(() => {
    const clearedFilters: Partial<DamFilterState> = {
      filterType: undefined,
      filterCreationDateOption: undefined,
      filterDateStart: undefined,
      filterDateEnd: undefined,
      filterOwnerId: undefined,
      filterSizeOption: undefined,
      filterSizeMin: undefined,
      filterSizeMax: undefined,
    };
    updateUrlParams(clearedFilters);
  }, [updateUrlParams]);

  return {
    // Filter state values
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
    currentTagIds,
    // Filter management actions
    setFilterType,
    setFilterCreationDateOption,
    setFilterOwnerId,
    setFilterSizeOption,
    setSortBy,
    setSortOrder,
    setCurrentTagIds,
    isAnyFilterActive,
    clearAllFilters,
    updateUrlParams,
  };
} 