// Barrel file for lib/dam module
export {};

// DAM Bounded Context Public API

// Export all types (includes re-exports from domain entities and DTOs)
export * from './types';

// Export domain entities (types and classes)
export type { Asset } from './domain/entities/Asset';
export type { Folder } from './domain/entities/Folder';
export type { Tag } from './domain/entities/Tag';

// Export DTOs
export type { UploadAssetDTO } from './application/dto/UploadAssetDTO';
export type {
  DamFilterParameters,
  DamSortParameters,
  LimitOptions,
  AssetSearchCriteria,
  FolderSearchCriteria
} from './application/dto/SearchCriteriaDTO';
export type { 
  DamApiRequestDto, 
  DamApiResponseDto, 
  CombinedDamItem
} from './application/dto/DamApiRequestDto';
export type {
  PlainTag,
  TransformedAsset,
  TransformedFolder,
  DamGalleryApiResponse,
  UploadApiResponse,
  FolderApiResponse,
  AssetApiResponse
} from './application/dto/ApiResponseDto';

// Export use cases (application layer) - organized by domain
export * from './application/use-cases';

// Export server actions (application layer)
export { 
  getAssetDownloadUrl,
  listTextAssets,
  getAssetContent,
  updateAssetText,
  saveAsNewTextAsset,
  saveDamSearch,
  listSavedSearches,
  executeSavedSearch,
  renameFolderAction,
  deleteFolderAction,
  createFolderAction,
  renameFolderClientAction,
  deleteFolderClientAction,
  updateFolderAction,
  createFolderActionForm,
  deleteFolderActionForm,
  getRootFolders,
  getFolderNavigation
} from './application/actions';

// Export repository interfaces (types only)
export type { IAssetRepository } from './domain/repositories/IAssetRepository';
export type { IFolderRepository } from './domain/repositories/IFolderRepository';
export type { ITagRepository } from './domain/repositories/ITagRepository';
export type { IStorageService } from './domain/repositories/IStorageService';

// Export infrastructure implementations (classes)
export { SupabaseAssetRepository } from './infrastructure/persistence/supabase/SupabaseAssetRepository';
export { SupabaseFolderRepository } from './infrastructure/persistence/supabase/SupabaseFolderRepository';
export { SupabaseTagRepository } from './infrastructure/persistence/supabase/SupabaseTagRepository';
export { SupabaseStorageService } from './infrastructure/storage/SupabaseStorageService'; 
