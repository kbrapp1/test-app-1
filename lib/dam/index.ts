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

// Export use cases (application layer)
export { CreateFolderUseCase } from './application/use-cases/CreateFolderUseCase';
export { UpdateFolderUseCase } from './application/use-cases/UpdateFolderUseCase';
export { DeleteFolderUseCase } from './application/use-cases/DeleteFolderUseCase';
export { ListFoldersUseCase } from './application/use-cases/ListFoldersUseCase';
export { SearchDamItemsUseCase } from './application/use-cases/SearchDamItemsUseCase';

// Export repository interfaces (types only)
export type { IAssetRepository } from './domain/repositories/IAssetRepository';
export type { IFolderRepository } from './domain/repositories/IFolderRepository';
export type { ITagRepository } from './domain/repositories/ITagRepository';

// Export infrastructure implementations (classes)
export { SupabaseAssetRepository } from './infrastructure/persistence/supabase/SupabaseAssetRepository';
export { SupabaseFolderRepository } from './infrastructure/persistence/supabase/SupabaseFolderRepository';
export { SupabaseTagRepository } from './infrastructure/persistence/supabase/SupabaseTagRepository'; 