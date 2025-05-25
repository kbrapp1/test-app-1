import { SearchCriteria } from '../value-objects/SearchCriteria';

/**
 * Domain service for search utility operations
 * Follows Single Responsibility Principle - only handles search utilities
 */
export class SearchUtilities {
  /**
   * Debounce search input to avoid excessive API calls
   */
  static createDebouncedSearch(
    callback: (criteria: SearchCriteria) => void,
    delay: number = 300
  ): (criteria: SearchCriteria) => void {
    let timeoutId: NodeJS.Timeout;

    return (criteria: SearchCriteria) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(criteria);
      }, delay);
    };
  }

  /**
   * Check if two search criteria are functionally equivalent
   */
  static areSearchCriteriaEquivalent(
    criteria1: SearchCriteria,
    criteria2: SearchCriteria
  ): boolean {
    return criteria1.equals(criteria2);
  }

  /**
   * Generate a user-friendly description of current search state
   */
  static generateSearchDescription(criteria: SearchCriteria): string {
    const parts: string[] = [];

    if (criteria.hasSearchTerm()) {
      parts.push(`"${criteria.searchTerm}"`);
    }

    if (criteria.tagIds.length > 0) {
      parts.push(`${criteria.tagIds.length} tag${criteria.tagIds.length > 1 ? 's' : ''}`);
    }

    const filterCount = Object.keys(criteria.filters).length;
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return 'All assets';
    }

    return `Search: ${parts.join(' + ')}`;
  }

  /**
   * Extract search term from criteria safely
   */
  static getSearchTermSafe(criteria: SearchCriteria): string {
    return criteria.searchTerm?.trim() || '';
  }

  /**
   * Check if search has any active filters or terms
   */
  static hasActiveSearch(criteria: SearchCriteria): boolean {
    return criteria.hasSearchTerm() || criteria.hasFilters();
  }
} 
