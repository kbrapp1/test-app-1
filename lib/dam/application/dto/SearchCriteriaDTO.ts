/**
 * Data Transfer Objects for DAM search operations
 * Re-exports domain types for application layer use
 */

export type {
  SearchFilters,
  SearchSortParams,
  LimitOptions,
  AssetSearchCriteria,
  FolderSearchCriteria
} from '../../domain/value-objects/SearchCriteria';

export type {
  GalleryItemDto
} from '../../domain/value-objects/GalleryItem';

export type {
  GetDamDataResult
} from '../../domain/value-objects/DamDataResult'; 
