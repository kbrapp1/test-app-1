/**
 * Legacy API Types - Deprecated
 * 
 * This file contains legacy types that are being phased out.
 * New code should use types from:
 * - @/lib/dam/application/dto/ApiResponseDto (for API responses)
 * - @/lib/dam/application/dto/SearchCriteriaDTO (for search parameters)
 * - @/lib/dam/domain/entities/* (for domain types)
 * 
 * @deprecated Use proper DDD DTOs instead
 */

import type { Tag } from '@/lib/dam/domain/entities/Tag';

// Re-export modern types for backward compatibility
export type { 
  DamFilterParameters, 
  DamSortParameters, 
  LimitOptions 
} from '@/lib/dam/application/dto/SearchCriteriaDTO';

export type { 
  PlainTag,
  TransformedAsset,
  TransformedFolder,
  CombinedDamItem
} from '@/lib/dam/application/dto/ApiResponseDto';

// Legacy raw data types (consider moving to infrastructure layer)
export interface RawAssetFromApi {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  asset_tags: Array<{ tags: Tag | null }> | null;
  organization_id: string;
}

export interface RawFolderFromApi {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  parent_folder_id: string | null;
  organization_id: string;
  has_children_count?: Array<{ count: number }>;
}

// @deprecated - Use proper error handling patterns instead
export interface DataFetchingResult {
  foldersData: RawFolderFromApi[] | null;
  assetsData: RawAssetFromApi[] | null;
  foldersError: Error | null;
  assetsError: Error | null;
}

// @deprecated - Use ApiResponseDto types instead
export interface TransformedDataReturn {
  foldersWithDetails: import('@/lib/dam/application/dto/ApiResponseDto').TransformedFolder[];
  assetsWithDetails: import('@/lib/dam/application/dto/ApiResponseDto').TransformedAsset[];
} 