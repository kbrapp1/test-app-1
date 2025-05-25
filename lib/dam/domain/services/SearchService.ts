import { SearchCriteria } from '../value-objects/SearchCriteria';
import { GalleryItemDto } from '../../application/use-cases/folders/ListFolderContentsUseCase';
import { GetDamDataUseCase, GetDamDataResult } from '../../application/use-cases/search/GetDamDataUseCase';
import { DamApiRequestDto } from '../../application/dto/DamApiRequestDto';
import { SearchMapper } from './SearchMapper';
import { SearchValidation } from './SearchValidation';
import { SearchCriteriaFactory } from './SearchCriteriaFactory';
import { SearchUtilities } from './SearchUtilities';

/**
 * Domain Service for Search Operations
 * 
 * Encapsulates search business logic and provides a clean interface
 * for search-related operations throughout the DAM system
 */

export interface SearchResult {
  items: GalleryItemDto[];
  totalItems: number;
  hasMore: boolean;
  searchExecuted: boolean;
}

export interface AutocompleteResult {
  suggestions: GalleryItemDto[];
  hasMore: boolean;
  isLoading: boolean;
}

export class SearchService {
  constructor(
    private getDamDataUseCase: GetDamDataUseCase
  ) {}

  /**
   * Execute a search based on the provided criteria
   */
  async executeSearch(criteria: SearchCriteria, organizationId: string): Promise<SearchResult> {
    try {
      const request: DamApiRequestDto = {
        searchTerm: criteria.searchTerm || '',
        folderId: criteria.folderId,
        quickSearch: criteria.quickSearch,
        tagIds: criteria.tagIds.length > 0 ? criteria.tagIds : undefined,
        filters: {
          type: criteria.filters.type,
          creationDateOption: criteria.filters.creationDateOption,
          dateStart: criteria.filters.dateStart,
          dateEnd: criteria.filters.dateEnd,
          ownerId: criteria.filters.ownerId,
          sizeOption: criteria.filters.sizeOption,
          sizeMin: criteria.filters.sizeMin,
          sizeMax: criteria.filters.sizeMax,
        },
        sortParams: {
          sortBy: criteria.sortParams.sortBy,
          sortOrder: criteria.sortParams.sortOrder,
        },
        limitOptions: {
          quickSearch: criteria.quickSearch,
          parsedLimit: criteria.limit,
        },
        organizationId,
        userId: '', // TODO: Get from context
      };

      const result: GetDamDataResult = await this.getDamDataUseCase.execute(request);

      // Convert domain entities to GalleryItemDto format using mapper
      const items = SearchMapper.mapDomainResultToGalleryItems(result);

      return {
        items,
        totalItems: items.length,
        hasMore: false, // GetDamDataUseCase doesn't implement pagination yet
        searchExecuted: SearchUtilities.hasActiveSearch(criteria),
      };
    } catch (error) {
      console.error('Search execution failed:', error);
      throw new Error('Failed to execute search operation');
    }
  }

  /**
   * Get autocomplete suggestions for quick search
   */
  async getAutocompleteSuggestions(
    searchTerm: string,
    folderId: string | null,
    organizationId: string,
    limit: number = 5
  ): Promise<AutocompleteResult> {
    if (!searchTerm.trim()) {
      return {
        suggestions: [],
        hasMore: false,
        isLoading: false,
      };
    }

    try {
      const criteria = SearchCriteriaFactory.forAutocomplete(searchTerm, folderId, limit);
      const result = await this.executeSearch(criteria, organizationId);

      return {
        suggestions: result.items,
        hasMore: result.hasMore,
        isLoading: false,
      };
    } catch (error) {
      console.error('Autocomplete suggestions failed:', error);
      return {
        suggestions: [],
        hasMore: false,
        isLoading: false,
      };
    }
  }

  /**
   * Validate if a search term is acceptable
   */
  validateSearchTerm(searchTerm: string): { valid: boolean; error?: string } {
    return SearchValidation.validateSearchTerm(searchTerm);
  }

  /**
   * Create search criteria from URL parameters
   */
  createSearchCriteriaFromParams(searchParams: URLSearchParams): SearchCriteria {
    return SearchCriteriaFactory.fromUrlParams(searchParams);
  }

  /**
   * Debounce search input to avoid excessive API calls
   */
  createDebouncedSearch(
    callback: (criteria: SearchCriteria) => void,
    delay: number = 300
  ): (criteria: SearchCriteria) => void {
    return SearchUtilities.createDebouncedSearch(callback, delay);
  }

  /**
   * Check if two search criteria are functionally equivalent
   */
  areSearchCriteriaEquivalent(
    criteria1: SearchCriteria,
    criteria2: SearchCriteria
  ): boolean {
    return SearchUtilities.areSearchCriteriaEquivalent(criteria1, criteria2);
  }

  /**
   * Generate a user-friendly description of current search state
   */
  generateSearchDescription(criteria: SearchCriteria): string {
    return SearchUtilities.generateSearchDescription(criteria);
  }
} 
