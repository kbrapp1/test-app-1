import { SearchFilters, SearchSortParams, LimitOptions } from './SearchCriteriaDTO';

// Re-export API response types for compatibility
export type { TransformedAsset, TransformedFolder, PlainTag, CombinedDamItem } from './ApiResponseDto';

export interface DamApiRequestDto {
  // Core parameters
  folderId: string | null;
  searchTerm: string;
  quickSearch: boolean;
  limit?: number;
  tagIds?: string[];
  
  // Filter parameters
  filters: SearchFilters;
  
  // Sort parameters  
  sortParams: SearchSortParams;
  
  // Computed options
  limitOptions: LimitOptions;
  
  // Context
  organizationId: string;
  userId: string;
}

export interface DamApiResponseDto {
  data: import('./ApiResponseDto').CombinedDamItem[];
  totalItems: number;
  metadata?: {
    searchTerm?: string;
    currentFolder?: string;
    appliedFilters?: Record<string, unknown>;
  };
} 
