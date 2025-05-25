import { ReadonlyURLSearchParams } from 'next/navigation';
import { DamFilterState, FilterUpdateParams } from './FilterTypes';

/**
 * URL Parameter Service
 * Handles URL parameter extraction and manipulation for DAM filters
 * Following DDD principles - single responsibility for URL management
 */
export class UrlParameterService {
  /**
   * Safely extract typed URL search parameters
   */
  static getTypedParam<T extends string>(
    params: ReadonlyURLSearchParams, 
    key: string
  ): T | undefined {
    return (params.get(key) as T) || undefined;
  }

  /**
   * Extract all filter state from URL parameters
   */
  static extractFilterState(searchParams: ReadonlyURLSearchParams): DamFilterState {
    return {
      filterType: this.getTypedParam<string>(searchParams, 'filterType'),
      filterCreationDateOption: this.getTypedParam<string>(searchParams, 'filterCreationDateOption'),
      filterDateStart: this.getTypedParam<string>(searchParams, 'filterDateStart'),
      filterDateEnd: this.getTypedParam<string>(searchParams, 'filterDateEnd'),
      filterOwnerId: this.getTypedParam<string>(searchParams, 'filterOwnerId'),
      filterSizeOption: this.getTypedParam<string>(searchParams, 'filterSizeOption'),
      filterSizeMin: this.getTypedParam<string>(searchParams, 'filterSizeMin'),
      filterSizeMax: this.getTypedParam<string>(searchParams, 'filterSizeMax'),
      sortBy: this.getTypedParam<'name' | 'updated_at' | 'size' | 'mime_type'>(searchParams, 'sortBy'),
      sortOrder: this.getTypedParam<'asc' | 'desc'>(searchParams, 'sortOrder'),
      currentTagIds: this.getTypedParam<string>(searchParams, 'tagIds'),
    };
  }

  /**
   * Build new URL parameters with updates and cleanup logic
   */
  static buildUpdatedParams(
    currentParams: ReadonlyURLSearchParams,
    paramsToUpdate: FilterUpdateParams
  ): URLSearchParams {
    const newParams = new URLSearchParams(currentParams.toString());

    // Apply all parameter updates
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });

    // Apply cleanup logic for related parameters
    this.cleanupRelatedParams(newParams, paramsToUpdate);

    return newParams;
  }

  /**
   * Clean up related parameters based on filter options
   */
  private static cleanupRelatedParams(
    params: URLSearchParams,
    updates: FilterUpdateParams
  ): void {
    // Clean up date parameters when not using custom date option
    const finalCreationDateOption = params.get('filterCreationDateOption');
    if (finalCreationDateOption !== 'custom') {
      if (!updates.hasOwnProperty('filterDateStart') || updates.filterDateStart === undefined) {
        params.delete('filterDateStart');
      }
      if (!updates.hasOwnProperty('filterDateEnd') || updates.filterDateEnd === undefined) {
        params.delete('filterDateEnd');
      }
    }

    // Clean up size parameters when not using custom size option
    const finalSizeOption = params.get('filterSizeOption');
    if (finalSizeOption !== 'custom') {
      if (!updates.hasOwnProperty('filterSizeMin') || updates.filterSizeMin === undefined) {
        params.delete('filterSizeMin');
      }
      if (!updates.hasOwnProperty('filterSizeMax') || updates.filterSizeMax === undefined) {
        params.delete('filterSizeMax');
      }
    }
  }

  /**
   * Check if any filter is currently active
   */
  static isAnyFilterActive(searchParams: ReadonlyURLSearchParams): boolean {
    return !!(
      searchParams.get('filterType') ||
      searchParams.get('filterCreationDateOption') ||
      searchParams.get('filterOwnerId') ||
      searchParams.get('filterSizeOption')
    );
  }

  /**
   * Build URL string from parameters
   */
  static buildUrlString(pathname: string, params: URLSearchParams): string {
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }
} 
