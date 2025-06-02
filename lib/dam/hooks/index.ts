/**
 * DAM Hooks Barrel Export
 * 
 * Domain: DAM Asset Management
 * Responsibility: Centralized hook exports
 * 
 * Following DDD principles:
 * - Clean architecture: Organized by domain responsibility
 * - Single source of truth: All DAM hooks exported from one place
 * - Maintainability: Easy to find and import hooks
 */

// Asset Query Operations
export {
  useAssets,
  useAssetSearch, // @deprecated - not currently used, main search is in useDamGalleryData
  useAsset,
  useAssetDetails,
  useFolders,
} from './useAssetQueries';

// Asset Mutation Operations
export {
  useAssetUpload,
  useAssetMove,
  useAssetDelete,
  useAssetUpdate,
} from './useAssetMutations';

// Bulk Operations
export {
  useBulkMove,
  useBulkAssetOperations,
} from './useBulkOperations';

// Folder Operations
export {
  useFolderCreate,
  useFolderDelete,
  useFolderRename,
} from './useFolderOperations';

// Cache Management
export {
  useAssetCacheManagement,
} from './useCacheManagement'; 