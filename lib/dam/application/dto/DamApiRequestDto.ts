import { DamFilterParameters, DamSortParameters, LimitOptions } from './SearchCriteriaDTO';

// Re-export existing API types for compatibility
export type { TransformedAsset, TransformedFolder, PlainTag } from '../../../../app/api/dam/dam-api.types';

export interface DamApiRequestDto {
  // Core parameters
  folderId: string | null;
  searchTerm: string;
  quickSearch: boolean;
  limit?: number;
  tagIds?: string[];
  
  // Filter parameters
  filters: DamFilterParameters;
  
  // Sort parameters  
  sortParams: DamSortParameters;
  
  // Computed options
  limitOptions: LimitOptions;
  
  // Context
  organizationId: string;
  userId: string;
}

export interface DamApiResponseDto {
  data: CombinedDamItem[];
  totalItems: number;
  metadata?: {
    searchTerm?: string;
    currentFolder?: string;
    appliedFilters?: Record<string, any>;
  };
}

// Import the existing types and create a union
import type { TransformedAsset, TransformedFolder } from '../../../../app/api/dam/dam-api.types';
export type CombinedDamItem = TransformedAsset | TransformedFolder; 