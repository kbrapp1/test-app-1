import { SearchCriteria } from '../value-objects/SearchCriteria';

/**
 * Factory for creating SearchCriteria instances from different data sources
 * Follows DDD Factory pattern - encapsulates complex object creation
 */
export class SearchCriteriaFactory {
  /**
   * Create search criteria from URL parameters
   */
  static fromUrlParams(searchParams: URLSearchParams): SearchCriteria {
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
   * Create search criteria for autocomplete/quick search
   */
  static forAutocomplete(
    searchTerm: string,
    folderId: string | null,
    limit: number = 5
  ): SearchCriteria {
    return new SearchCriteria({
      searchTerm: searchTerm.trim(),
      folderId,
      limit,
      quickSearch: true,
    });
  }

  /**
   * Create empty search criteria (for clearing search)
   */
  static empty(folderId: string | null = null): SearchCriteria {
    return new SearchCriteria({
      folderId,
      quickSearch: false,
    });
  }
} 
