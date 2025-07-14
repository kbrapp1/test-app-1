import { CurrentSearchCriteria } from '../../../hooks/search/useSavedSearches';
// import { DamFilterParameters, DamSortParameters } from '../../../../application/dto/SearchCriteriaDTO';

/**
 * SavedSearchHandler Service
 * Follows Single Responsibility Principle - handles saved search execution and URL parameter building
 */
export class SavedSearchHandler {
  /**
   * Build URL parameters from search criteria
   */
  static buildSearchParams(searchCriteria: CurrentSearchCriteria): URLSearchParams {
    const params = new URLSearchParams();
    
    if (searchCriteria.searchTerm) {
      params.set('search', searchCriteria.searchTerm);
    }
    
    if (searchCriteria.folderId) {
      params.set('folderId', searchCriteria.folderId);
    }
    
    if (searchCriteria.tagIds && searchCriteria.tagIds.length > 0) {
      params.set('tagIds', searchCriteria.tagIds.join(','));
    }
    
    // Add filter parameters
    if (searchCriteria.filters) {
      Object.entries(searchCriteria.filters).forEach(([key, value]) => {
        if (value && value !== 'any') {
          params.set(key, String(value));
        }
      });
    }
    
    // Add sort parameters
    if (searchCriteria.sortParams) {
      if (searchCriteria.sortParams.sortBy) {
        params.set('sortBy', searchCriteria.sortParams.sortBy);
      }
      if (searchCriteria.sortParams.sortOrder) {
        params.set('sortOrder', searchCriteria.sortParams.sortOrder);
      }
    }
    
    return params;
  }

  /**
   * Build current search criteria object
   */
  static buildCurrentSearchCriteria(
    gallerySearchTerm: string,
    currentFolderId: string | null,
    currentTagIds?: string[],
    currentFilters?: Record<string, unknown>,
    currentSortParams?: Record<string, unknown>
  ): CurrentSearchCriteria {
    return {
      searchTerm: gallerySearchTerm,
      folderId: currentFolderId,
      tagIds: currentTagIds,
      filters: currentFilters,
      sortParams: currentSortParams,
    };
  }
} 
