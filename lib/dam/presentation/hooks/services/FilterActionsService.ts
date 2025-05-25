import { ReadonlyURLSearchParams } from 'next/navigation';
import { 
  DamFilterState, 
  DateFilterConfig, 
  SizeFilterConfig, 
  SortByValue, 
  SortOrderValue,
  FilterUpdateParams 
} from './FilterTypes';
import { UrlParameterService } from './UrlParameterService';

/**
 * Filter Actions Service
 * Handles filter update logic and business rules
 * Following DDD principles - single responsibility for filter operations
 */
export class FilterActionsService {
  /**
   * Create date filter update parameters
   */
  static createDateFilterUpdate(config: DateFilterConfig): Partial<DamFilterState> {
    const { option, startDate, endDate } = config;
    const updates: Partial<DamFilterState> = { filterCreationDateOption: option };
    
    if (option === 'custom') {
      updates.filterDateStart = startDate;
      updates.filterDateEnd = endDate;
    } else {
      updates.filterDateStart = undefined;
      updates.filterDateEnd = undefined;
    }
    
    return updates;
  }

  /**
   * Create size filter update parameters
   */
  static createSizeFilterUpdate(config: SizeFilterConfig): Partial<DamFilterState> {
    const { option, minSize, maxSize } = config;
    const updates: Partial<DamFilterState> = { filterSizeOption: option };
    
    if (option === 'custom') {
      updates.filterSizeMin = minSize !== undefined ? minSize.toString() : undefined;
      updates.filterSizeMax = maxSize !== undefined ? maxSize.toString() : undefined;
    } else {
      updates.filterSizeMin = undefined;
      updates.filterSizeMax = undefined;
    }
    
    return updates;
  }

  /**
   * Create sort by update parameters with interdependent logic
   */
  static createSortByUpdate(
    value: SortByValue | undefined,
    searchParams: ReadonlyURLSearchParams
  ): Partial<DamFilterState> {
    const currentSortOrder = UrlParameterService.getTypedParam<SortOrderValue>(searchParams, 'sortOrder');
    const newSortOrder = value ? (currentSortOrder || 'asc') : undefined;
    
    return { sortBy: value, sortOrder: newSortOrder };
  }

  /**
   * Create sort order update parameters with interdependent logic
   */
  static createSortOrderUpdate(
    value: SortOrderValue | undefined,
    searchParams: ReadonlyURLSearchParams
  ): Partial<DamFilterState> {
    const currentSortBy = UrlParameterService.getTypedParam<SortByValue>(searchParams, 'sortBy');
    const newSortBy = value ? (currentSortBy || 'name') : undefined;
    
    return { sortBy: newSortBy, sortOrder: value };
  }

  /**
   * Create clear all filters update parameters
   */
  static createClearAllFiltersUpdate(): Partial<DamFilterState> {
    return {
      filterType: undefined,
      filterCreationDateOption: undefined,
      filterDateStart: undefined,
      filterDateEnd: undefined,
      filterOwnerId: undefined,
      filterSizeOption: undefined,
      filterSizeMin: undefined,
      filterSizeMax: undefined,
    };
  }

  /**
   * Create simple filter update parameters
   */
  static createSimpleFilterUpdate<K extends keyof DamFilterState>(
    key: K,
    value: DamFilterState[K]
  ): Partial<DamFilterState> {
    return { [key]: value } as Partial<DamFilterState>;
  }
} 
