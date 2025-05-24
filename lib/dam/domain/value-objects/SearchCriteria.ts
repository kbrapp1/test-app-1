/**
 * Domain Value Object for Search Criteria
 * 
 * Encapsulates all search parameters with proper validation
 * and business rules for DAM search functionality
 */

export interface SearchFilters {
  type?: string;
  creationDateOption?: string;
  dateStart?: string;
  dateEnd?: string;
  ownerId?: string;
  sizeOption?: string;
  sizeMin?: string;
  sizeMax?: string;
}

export interface SearchSortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchCriteriaParams {
  searchTerm?: string;
  folderId?: string | null;
  tagIds?: string[];
  filters?: SearchFilters;
  sortParams?: SearchSortParams;
  limit?: number;
  quickSearch?: boolean;
}

export class SearchCriteria {
  private readonly _searchTerm: string;
  private readonly _folderId: string | null;
  private readonly _tagIds: string[];
  private readonly _filters: SearchFilters;
  private readonly _sortParams: SearchSortParams;
  private readonly _limit: number;
  private readonly _quickSearch: boolean;

  constructor(params: SearchCriteriaParams = {}) {
    this._searchTerm = (params.searchTerm || '').trim();
    this._folderId = params.folderId || null;
    this._tagIds = params.tagIds || [];
    this._filters = params.filters || {};
    this._sortParams = params.sortParams || {};
    this._limit = Math.max(1, Math.min(params.limit || 20, 100)); // Validate limit between 1-100
    this._quickSearch = params.quickSearch || false;

    this.validate();
  }

  private validate(): void {
    // Validate search term length
    if (this._searchTerm.length > 255) {
      throw new Error('Search term cannot exceed 255 characters');
    }

    // Validate tag IDs format
    for (const tagId of this._tagIds) {
      if (!tagId || typeof tagId !== 'string' || tagId.trim() === '') {
        throw new Error('Invalid tag ID format');
      }
    }

    // Validate sort order
    if (this._sortParams.sortOrder && !['asc', 'desc'].includes(this._sortParams.sortOrder)) {
      throw new Error('Sort order must be "asc" or "desc"');
    }
  }

  // Getters
  get searchTerm(): string {
    return this._searchTerm;
  }

  get folderId(): string | null {
    return this._folderId;
  }

  get tagIds(): string[] {
    return [...this._tagIds]; // Return copy to maintain immutability
  }

  get filters(): SearchFilters {
    return { ...this._filters }; // Return copy to maintain immutability
  }

  get sortParams(): SearchSortParams {
    return { ...this._sortParams }; // Return copy to maintain immutability
  }

  get limit(): number {
    return this._limit;
  }

  get quickSearch(): boolean {
    return this._quickSearch;
  }

  // Domain business methods
  public isEmpty(): boolean {
    return (
      this._searchTerm === '' &&
      this._tagIds.length === 0 &&
      Object.keys(this._filters).length === 0 &&
      Object.keys(this._sortParams).length === 0
    );
  }

  public hasSearchTerm(): boolean {
    return this._searchTerm.length > 0;
  }

  public hasFilters(): boolean {
    return Object.keys(this._filters).length > 0 || this._tagIds.length > 0;
  }

  public isQuickSearch(): boolean {
    return this._quickSearch;
  }

  public withSearchTerm(searchTerm: string): SearchCriteria {
    return new SearchCriteria({
      searchTerm,
      folderId: this._folderId,
      tagIds: this._tagIds,
      filters: this._filters,
      sortParams: this._sortParams,
      limit: this._limit,
      quickSearch: this._quickSearch,
    });
  }

  public withFolderId(folderId: string | null): SearchCriteria {
    return new SearchCriteria({
      searchTerm: this._searchTerm,
      folderId,
      tagIds: this._tagIds,
      filters: this._filters,
      sortParams: this._sortParams,
      limit: this._limit,
      quickSearch: this._quickSearch,
    });
  }

  public withTagIds(tagIds: string[]): SearchCriteria {
    return new SearchCriteria({
      searchTerm: this._searchTerm,
      folderId: this._folderId,
      tagIds,
      filters: this._filters,
      sortParams: this._sortParams,
      limit: this._limit,
      quickSearch: this._quickSearch,
    });
  }

  public withFilters(filters: SearchFilters): SearchCriteria {
    return new SearchCriteria({
      searchTerm: this._searchTerm,
      folderId: this._folderId,
      tagIds: this._tagIds,
      filters,
      sortParams: this._sortParams,
      limit: this._limit,
      quickSearch: this._quickSearch,
    });
  }

  public withQuickSearch(quickSearch: boolean): SearchCriteria {
    return new SearchCriteria({
      searchTerm: this._searchTerm,
      folderId: this._folderId,
      tagIds: this._tagIds,
      filters: this._filters,
      sortParams: this._sortParams,
      limit: this._limit,
      quickSearch,
    });
  }

  public toQueryParams(): URLSearchParams {
    const params = new URLSearchParams();

    if (this._searchTerm) {
      params.set('search', this._searchTerm);
    }

    if (this._folderId) {
      params.set('folderId', this._folderId);
    }

    if (this._tagIds.length > 0) {
      params.set('tagIds', this._tagIds.join(','));
    }

    // Add filter parameters
    Object.entries(this._filters).forEach(([key, value]) => {
      if (value && value !== 'any') {
        params.set(key, value);
      }
    });

    // Add sort parameters
    if (this._sortParams.sortBy) {
      params.set('sortBy', this._sortParams.sortBy);
    }
    if (this._sortParams.sortOrder) {
      params.set('sortOrder', this._sortParams.sortOrder);
    }

    if (this._quickSearch) {
      params.set('quickSearch', 'true');
    }

    if (this._limit !== 20) {
      params.set('limit', this._limit.toString());
    }

    return params;
  }

  public equals(other: SearchCriteria): boolean {
    return (
      this._searchTerm === other._searchTerm &&
      this._folderId === other._folderId &&
      JSON.stringify(this._tagIds.sort()) === JSON.stringify(other._tagIds.sort()) &&
      JSON.stringify(this._filters) === JSON.stringify(other._filters) &&
      JSON.stringify(this._sortParams) === JSON.stringify(other._sortParams) &&
      this._limit === other._limit &&
      this._quickSearch === other._quickSearch
    );
  }
} 