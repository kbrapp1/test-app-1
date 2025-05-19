import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, ReadonlyURLSearchParams, usePathname } from 'next/navigation';

export type SortByValue = 'name' | 'updated_at' | 'size' | 'mime_type';
export type SortOrderValue = 'asc' | 'desc';

export interface DamFilterState {
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
  currentTagIds: string | undefined;
}

export interface UseDamFiltersReturn extends DamFilterState {
  setFilterType: (value: string | undefined) => void;
  setFilterCreationDateOption: (option: string | undefined, startDate?: string, endDate?: string) => void;
  setFilterOwnerId: (value: string | undefined) => void;
  setFilterSizeOption: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  setSortBy: (value: SortByValue | undefined) => void;
  setSortOrder: (value: SortOrderValue | undefined) => void;
  setCurrentTagIds: (value: string | undefined) => void;
  isAnyFilterActive: boolean;
  clearAllFilters: () => void;
}

// Helper function to get typed search params
const getTypedParam = <T extends string>(params: ReadonlyURLSearchParams, key: string): T | undefined => {
  return (params.get(key) as T) || undefined;
};

export function useDamFilters(currentFolderIdFromView: string | null): UseDamFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Directly derive filter values from URL search params
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

  const updateUrlParams = useCallback((paramsToUpdate: Partial<Omit<DamFilterState, 'folderId'> & { folderId?: string | null }>) => {
    const newParams = new URLSearchParams(searchParams.toString()); 

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) newParams.set(key, String(value));
      else newParams.delete(key);
    });

    const finalCreationDateOption = newParams.get('filterCreationDateOption');
    if (finalCreationDateOption !== 'custom') {
      if (!paramsToUpdate.hasOwnProperty('filterDateStart') || paramsToUpdate.filterDateStart === undefined) {
        newParams.delete('filterDateStart');
      }
      if (!paramsToUpdate.hasOwnProperty('filterDateEnd') || paramsToUpdate.filterDateEnd === undefined) {
        newParams.delete('filterDateEnd');
      }
    }
    if (paramsToUpdate.hasOwnProperty('filterCreationDateOption') && paramsToUpdate.filterCreationDateOption === undefined) {
      newParams.delete('filterDateStart');
      newParams.delete('filterDateEnd');
    }

    const finalSizeOption = newParams.get('filterSizeOption');
    if (finalSizeOption !== 'custom') {
      if (!paramsToUpdate.hasOwnProperty('filterSizeMin') || paramsToUpdate.filterSizeMin === undefined) {
        newParams.delete('filterSizeMin');
      }
      if (!paramsToUpdate.hasOwnProperty('filterSizeMax') || paramsToUpdate.filterSizeMax === undefined) {
        newParams.delete('filterSizeMax');
      }
    }
    if (paramsToUpdate.hasOwnProperty('filterSizeOption') && paramsToUpdate.filterSizeOption === undefined) {
      newParams.delete('filterSizeMin');
      newParams.delete('filterSizeMax');
    }
    
    const sortByIsBeingExplicitlySet = paramsToUpdate.hasOwnProperty('sortBy');
    const currentSortByInNewParams = newParams.get('sortBy');
    if (sortByIsBeingExplicitlySet && paramsToUpdate.sortBy === undefined) {
      newParams.delete('sortOrder');
    } 
    else if (!currentSortByInNewParams) { 
        newParams.delete('sortOrder');
    }

    if (currentFolderIdFromView) {
      newParams.set('folderId', currentFolderIdFromView);
    } else {
      newParams.delete('folderId');
    }
    
    const queryString = newParams.toString();
    router.push(queryString ? `/dam?${queryString}` : '/dam', { scroll: false });
  }, [searchParams, router, currentFolderIdFromView]);

  // isAnyFilterActive still uses currentParams for simplicity, but its source string is the same.
  const isAnyFilterActive = useMemo(() => {
    return !!(
      searchParams.get('filterType') ||
      searchParams.get('filterCreationDateOption') ||
      searchParams.get('filterOwnerId') ||
      searchParams.get('filterSizeOption')
    );
  }, [searchParams]);

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

  // Reading for setSortBy and setSortOrder uses the typed getter from searchParams
  const setSortBy = useCallback((value: SortByValue | undefined) => {
    const currentSortOrderValue = getTypedParam<SortOrderValue>(searchParams, 'sortOrder');
    const newSortOrder = value ? (currentSortOrderValue || 'asc') : undefined;
    updateUrlParams({ sortBy: value, sortOrder: newSortOrder });
  }, [updateUrlParams, searchParams]);
  
  const setSortOrder = useCallback((value: SortOrderValue | undefined) => {
    const currentSortByValue = getTypedParam<SortByValue>(searchParams, 'sortBy');
    if (currentSortByValue) {
        updateUrlParams({ sortOrder: value });
    }
  }, [updateUrlParams, searchParams]);

  const setCurrentTagIds = useCallback((value: string | undefined) => {
    updateUrlParams({ currentTagIds: value });
  }, [updateUrlParams]);

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
    setFilterType,
    setFilterCreationDateOption,
    setFilterOwnerId,
    setFilterSizeOption,
    setSortBy,
    setSortOrder,
    setCurrentTagIds,
    isAnyFilterActive,
    clearAllFilters,
  };
}
