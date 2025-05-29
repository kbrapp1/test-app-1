/**
 * Domain Service: Asset Cache Management
 * 
 * Single Responsibility: Handle cache invalidation for asset operations
 * Coordinates asset-specific cache patterns
 */

import { CacheInfrastructure } from './cache-infrastructure';
import { SuperAdminPermissionService } from './permissions';
import type { Profile } from './types';

/**
 * Asset cache invalidation strategies
 * Handles asset-specific cache patterns with super admin support
 */
export class AssetCacheService {
  /**
   * Invalidate cache after asset operations
   */
  static invalidateAssetCache(
    assetIds: string | string[],
    organizationIds: string | string[],
    folderIds: (string | null)[] = [],
    profile: Profile | null
  ): void {
    const assetIdArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const orgIdArray = Array.isArray(organizationIds) ? organizationIds : [organizationIds];
    const validFolderIds = folderIds.filter((id): id is string => id !== null);

    // Invalidate asset-specific cache
    CacheInfrastructure.invalidateEntityCache('asset', assetIdArray);

    // Invalidate folder cache if assets were in folders
    if (validFolderIds.length > 0) {
      CacheInfrastructure.invalidateEntityCache('folder', validFolderIds);
      CacheInfrastructure.invalidateDamPaths(validFolderIds);
    }

    // Invalidate organization-specific cache
    this.invalidateOrganizationAssetCache(orgIdArray, profile);

    // Invalidate general DAM cache
    this.invalidateGeneralAssetCache();
  }

  /**
   * Invalidate cache after asset transfer between organizations (super admin only)
   */
  static invalidateAssetTransferCache(
    assetIds: string[],
    fromOrganizationId: string,
    toOrganizationId: string,
    profile: Profile | null
  ): void {
    // Only super admin can transfer between organizations
    if (!SuperAdminPermissionService.isSuperAdmin(profile)) {
      return;
    }

    // Invalidate both source and destination organization caches
    const allOrgIds = [fromOrganizationId, toOrganizationId];
    this.invalidateAssetCache(assetIds, allOrgIds, [], profile);

    // Invalidate global super admin cache
    this.invalidateSuperAdminAssetCache();
  }

  /**
   * Invalidate cache for asset deletion
   */
  static invalidateAssetDeletionCache(
    assetIds: string[],
    organizationIds: string[],
    folderIds: string[],
    profile: Profile | null
  ): void {
    // Asset deletion requires broader cache invalidation
    this.invalidateAssetCache(assetIds, organizationIds, folderIds, profile);
    
    // Invalidate gallery cache more broadly for deletions
    CacheInfrastructure.invalidateTags(['dam-gallery-refresh']);
  }

  /**
   * Private: Invalidate organization-specific asset cache
   */
  private static invalidateOrganizationAssetCache(
    organizationIds: string[],
    profile: Profile | null
  ): void {
    // If super admin and includes 'ALL', invalidate global cache
    if (SuperAdminPermissionService.isSuperAdmin(profile) && organizationIds.includes('ALL')) {
      this.invalidateSuperAdminAssetCache();
      return;
    }

    // Invalidate specific organization caches
    organizationIds.forEach(orgId => {
      CacheInfrastructure.invalidateOrganizationCache(orgId, ['assets']);
    });
  }

  /**
   * Private: Invalidate general asset cache
   */
  private static invalidateGeneralAssetCache(): void {
    const tags = ['dam-gallery', 'dam-assets'];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateDamPaths();
  }

  /**
   * Private: Invalidate super admin asset cache
   */
  private static invalidateSuperAdminAssetCache(): void {
    const tags = [
      'dam-assets',
      'dam-gallery',
      'super-admin-all-orgs',
      'super-admin-data'
    ];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateDamPaths();
  }
} 