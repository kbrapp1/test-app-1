import { SearchCriteria } from '../value-objects/SearchCriteria';
import { GalleryItemDto } from '../../application/use-cases/ListFolderContentsUseCase';
import { GetDamDataUseCase, GetDamDataResult } from '../../application/use-cases/GetDamDataUseCase';
import { DamApiRequestDto } from '../../application/dto/DamApiRequestDto';

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

      // Convert domain entities to GalleryItemDto format
      const items: GalleryItemDto[] = [
        ...result.folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          mimeType: null,
          fileSize: null,
          userId: folder.userId,
          folderId: folder.parentFolderId,
        })),
        ...result.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: 'asset' as const,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
          mimeType: asset.mimeType,
          fileSize: asset.size,
          userId: asset.userId,
          folderId: asset.folderId,
        })),
      ];

      const totalItems = items.length;

      return {
        items,
        totalItems,
        hasMore: false, // GetDamDataUseCase doesn't implement pagination yet
        searchExecuted: criteria.hasSearchTerm() || criteria.hasFilters(),
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
      const criteria = new SearchCriteria({
        searchTerm: searchTerm.trim(),
        folderId,
        limit,
        quickSearch: true,
      });

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
    const trimmed = searchTerm.trim();

    if (trimmed.length === 0) {
      return { valid: true }; // Empty search is valid (clears search)
    }

    if (trimmed.length > 255) {
      return { 
        valid: false, 
        error: 'Search term cannot exceed 255 characters' 
      };
    }

    // Add any other business rules for search terms
    const invalidChars = /[<>]/;
    if (invalidChars.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Search term contains invalid characters' 
      };
    }

    return { valid: true };
  }

  /**
   * Create search criteria from URL parameters
   */
  createSearchCriteriaFromParams(searchParams: URLSearchParams): SearchCriteria {
    const tagIds = searchParams.get('tagIds');
    
    return new SearchCriteria({
      searchTerm: searchParams.get('search') || undefined,
      folderId: searchParams.get('folderId') || null,
      tagIds: tagIds ? tagIds.split(',').filter(id => id.trim()) : [],
      filters: {
        type: searchParams.get('type') || undefined,
        creationDateOption: searchParams.get('creationDateOption') || undefined,
        dateStart: searchParams.get('dateStart') || undefined,
        dateEnd: searchParams.get('dateEnd') || undefined,
        ownerId: searchParams.get('ownerId') || undefined,
        sizeOption: searchParams.get('sizeOption') || undefined,
        sizeMin: searchParams.get('sizeMin') || undefined,
        sizeMax: searchParams.get('sizeMax') || undefined,
      },
      sortParams: {
        sortBy: searchParams.get('sortBy') || undefined,
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      },
      limit: parseInt(searchParams.get('limit') || '20'),
      quickSearch: searchParams.get('quickSearch') === 'true',
    });
  }

  /**
   * Debounce search input to avoid excessive API calls
   */
  createDebouncedSearch(
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
  areSearchCriteriaEquivalent(
    criteria1: SearchCriteria,
    criteria2: SearchCriteria
  ): boolean {
    return criteria1.equals(criteria2);
  }

  /**
   * Generate a user-friendly description of current search state
   */
  generateSearchDescription(criteria: SearchCriteria): string {
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
} 