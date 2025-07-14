import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  DamFilterState,
  SortByValue,
  SortOrderValue,
  DateFilterConfig,
  SizeFilterConfig,
  UrlParameterService,
  FilterActionsService
} from '../services';

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
  updateUrlParams: (paramsToUpdate: Partial<DamFilterState & { folderId?: string | null }>) => void;
}

/**
 * Domain hook for managing DAM filter state and URL synchronization
 * 
 * Provides comprehensive filter management for the Digital Asset Management system,
 * including type filters, date ranges, owner filters, size filters, sorting, and tag filters.
 * All filter state is automatically synchronized with URL parameters for shareable URLs.
 * 
 * Refactored following DDD principles with separated concerns:
 * - URL parameter management delegated to UrlParameterService
 * - Filter update logic delegated to FilterActionsService
 * - Hook focuses only on state coordination
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
export function useDamFilters(_currentFolderIdFromView: string | null): UseDamFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract filter state using service
  const filterState = useMemo(() => 
    UrlParameterService.extractFilterState(searchParams), 
    [searchParams]
  );

  /**
   * Core URL update function - handles all parameter updates
   */
  const updateUrlParams = useCallback((paramsToUpdate: Partial<DamFilterState & { folderId?: string | null }>) => {
    const newParams = UrlParameterService.buildUpdatedParams(searchParams, paramsToUpdate);
    const newUrl = UrlParameterService.buildUrlString(pathname, newParams);
    router.replace(newUrl);
  }, [searchParams, router, pathname]);

  /**
   * Check if any filter is currently active
   */
  const isAnyFilterActive = useMemo(() => 
    UrlParameterService.isAnyFilterActive(searchParams), 
    [searchParams]
  );

  // Filter setter functions - each delegates to FilterActionsService
  const setFilterType = useCallback((value: string | undefined) => {
    const updates = FilterActionsService.createSimpleFilterUpdate('filterType', value);
    updateUrlParams(updates);
  }, [updateUrlParams]);

  const setFilterCreationDateOption = useCallback((
    option: string | undefined, 
    startDate?: string, 
    endDate?: string
  ) => {
    const config: DateFilterConfig = { option, startDate, endDate };
    const updates = FilterActionsService.createDateFilterUpdate(config);
    updateUrlParams(updates);
  }, [updateUrlParams]);

  const setFilterOwnerId = useCallback((value: string | undefined) => {
    const updates = FilterActionsService.createSimpleFilterUpdate('filterOwnerId', value);
    updateUrlParams(updates);
  }, [updateUrlParams]);

  const setFilterSizeOption = useCallback((
    option: string | undefined, 
    minSize?: number, 
    maxSize?: number
  ) => {
    const config: SizeFilterConfig = { option, minSize, maxSize };
    const updates = FilterActionsService.createSizeFilterUpdate(config);
    updateUrlParams(updates);
  }, [updateUrlParams]);

  const setSortBy = useCallback((value: SortByValue | undefined) => {
    const updates = FilterActionsService.createSortByUpdate(value, searchParams);
    updateUrlParams(updates);
  }, [updateUrlParams, searchParams]);

  const setSortOrder = useCallback((value: SortOrderValue | undefined) => {
    const updates = FilterActionsService.createSortOrderUpdate(value, searchParams);
    updateUrlParams(updates);
  }, [updateUrlParams, searchParams]);

  const setCurrentTagIds = useCallback((value: string | undefined) => {
    const updates = FilterActionsService.createSimpleFilterUpdate('currentTagIds', value);
    updateUrlParams(updates);
  }, [updateUrlParams]);

  const clearAllFilters = useCallback(() => {
    const updates = FilterActionsService.createClearAllFiltersUpdate();
    updateUrlParams(updates);
  }, [updateUrlParams]);

  return {
    // Filter state values (extracted via service)
    ...filterState,
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

// Re-export types for convenience
export type { SortByValue, SortOrderValue, DamFilterState } from '../services'; 
