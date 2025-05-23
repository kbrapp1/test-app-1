/**
 * Data Transfer Objects for DAM search operations
 */

export interface DamFilterParameters {
  type?: string | null;
  creationDateOption?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  ownerId?: string | null;
  sizeOption?: string | null;
  sizeMin?: string | null;
  sizeMax?: string | null;
}

export interface DamSortParameters {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

export interface LimitOptions {
  quickSearch: boolean;
  parsedLimit?: number;
}

export interface AssetSearchCriteria {
  organizationId: string;
  searchTerm?: string;
  folderId?: string | null;
  tagIds?: string[];
  filters?: DamFilterParameters;
  sortParams?: DamSortParameters;
  limitOptions?: LimitOptions;
}

export interface FolderSearchCriteria {
  organizationId: string;
  searchTerm?: string;
  parentFolderId?: string | null;
  filters?: DamFilterParameters;
  sortParams?: DamSortParameters;
  limitOptions?: LimitOptions;
} 