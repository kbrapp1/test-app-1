import { useCacheInvalidation } from '@/lib/infrastructure/query';

/**
 * Cache Management Hooks
 * 
 * Domain: DAM Cache Management
 * Responsibility: Cache coordination and cleanup operations
 * 
 * Following DDD principles:
 * - Single responsibility: Cache lifecycle management only
 * - Infrastructure focused: Cache invalidation coordination
 * - Performance optimization: Targeted cache operations
 */

/**
 * Hook for asset cache management
 * Replaces your service stats and cleanup functionality
 */
export function useAssetCacheManagement() {
  const { invalidateByPattern, clearAll, removeQueries } = useCacheInvalidation();

  return {
    /**
     * Clear all asset-related cache
     */
    clearAssetCache: () => invalidateByPattern('assets'),
    
    /**
     * Clear search results cache
     */
    clearSearchCache: () => invalidateByPattern('search'),
    
    /**
     * Clear all DAM-related cache
     */
    clearAllCache: clearAll,
    
    /**
     * Refresh all asset queries
     */
    refreshAssets: () => invalidateByPattern('assets'),
    
    /**
     * Remove specific asset from cache
     */
    removeAsset: (assetId: string) => removeQueries(['asset', assetId]),
    
    /**
     * Clear gallery cache
     */
    clearGalleryCache: () => invalidateByPattern('dam-gallery'),
    
    /**
     * Clear folder cache
     */
    clearFolderCache: () => invalidateByPattern('folders'),
    
    /**
     * Refresh all DAM queries
     */
    refreshAllDAM: () => {
      invalidateByPattern('assets');
      invalidateByPattern('dam-gallery');
      invalidateByPattern('dam-search');
      invalidateByPattern('folders');
    },
    
    /**
     * Remove asset details from cache
     */
    removeAssetDetails: (assetId: string) => removeQueries(['asset-details', assetId]),
  };
} 