/**
 * Domain Types for DAM Filter System
 * Following DDD principles - domain types separated from implementation
 */

/**
 * Valid sort field values for asset sorting
 */
export type SortByValue = 'name' | 'updated_at' | 'size' | 'mime_type';

/**
 * Valid sort order directions  
 */
export type SortOrderValue = 'asc' | 'desc';

/**
 * Complete filter state interface for DAM filters
 * Represents all possible filter parameters that can be applied to assets
 */
export interface DamFilterState {
  /** Asset type filter (e.g., 'image', 'video', 'document') */
  filterType: string | undefined;
  /** Creation date filter option (e.g., 'today', 'week', 'month', 'custom') */
  filterCreationDateOption: string | undefined;
  /** Start date for custom date range filtering */
  filterDateStart: string | undefined;
  /** End date for custom date range filtering */
  filterDateEnd: string | undefined;
  /** Filter by asset owner's user ID */
  filterOwnerId: string | undefined;
  /** Size filter option (e.g., 'small', 'medium', 'large', 'custom') */
  filterSizeOption: string | undefined;
  /** Minimum size for custom size filtering (in bytes) */
  filterSizeMin: string | undefined;
  /** Maximum size for custom size filtering (in bytes) */
  filterSizeMax: string | undefined;
  /** Field to sort assets by */
  sortBy: SortByValue | undefined;
  /** Sort order direction */
  sortOrder: SortOrderValue | undefined;
  /** Comma-separated tag IDs for filtering */
  currentTagIds: string | undefined;
}

/**
 * Filter update parameters interface
 * Used for batch updates to filter state
 */
export interface FilterUpdateParams extends Partial<Omit<DamFilterState, 'folderId'>> {
  folderId?: string | null;
}

/**
 * Date filter configuration
 */
export interface DateFilterConfig {
  option: string | undefined;
  startDate?: string;
  endDate?: string;
}

/**
 * Size filter configuration
 */
export interface SizeFilterConfig {
  option: string | undefined;
  minSize?: number;
  maxSize?: number;
} 
