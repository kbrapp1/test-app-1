/**
 * Domain Service: Folder Cache Management
 * 
 * Single Responsibility: Handle cache invalidation for folder operations
 * Coordinates folder-specific cache patterns
 */

import { CacheInfrastructure } from './cache-infrastructure';
import { SuperAdminPermissionService } from './permissions';
import type { Profile } from './types';

/**
 * Folder cache invalidation strategies
 * Handles folder-specific cache patterns with super admin support
 */
export class FolderCacheService {
  /**
   * Invalidate cache after folder operations
   */
  static invalidateFolderCache(
    folderIds: string | string[],
    organizationIds: string | string[],
    parentFolderIds: (string | null)[] = [],
    profile: Profile | null
  ): void {
    const folderIdArray = Array.isArray(folderIds) ? folderIds : [folderIds];
    const orgIdArray = Array.isArray(organizationIds) ? organizationIds : [organizationIds];
    const validParentIds = parentFolderIds.filter((id): id is string => id !== null);

    // Invalidate folder-specific cache
    CacheInfrastructure.invalidateEntityCache('folder', folderIdArray);
    CacheInfrastructure.invalidateDamPaths(folderIdArray);

    // Invalidate parent folder cache
    if (validParentIds.length > 0) {
      CacheInfrastructure.invalidateEntityCache('folder', validParentIds);
      CacheInfrastructure.invalidateDamPaths(validParentIds);
    }

    // Invalidate organization-specific cache
    this.invalidateOrganizationFolderCache(orgIdArray, profile);

    // Invalidate general DAM cache
    this.invalidateGeneralFolderCache();
  }

  /**
   * Invalidate cache after folder transfer between organizations (super admin only)
   */
  static invalidateFolderTransferCache(
    folderIds: string[],
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
    this.invalidateFolderCache(folderIds, allOrgIds, [], profile);

    // Invalidate global super admin cache
    this.invalidateSuperAdminFolderCache();
  }

  /**
   * Invalidate cache for folder deletion
   */
  static invalidateFolderDeletionCache(
    folderIds: string[],
    organizationIds: string[],
    parentFolderIds: string[],
    profile: Profile | null
  ): void {
    // Folder deletion requires broader cache invalidation
    this.invalidateFolderCache(folderIds, organizationIds, parentFolderIds, profile);
    
    // Invalidate navigation cache for deletions
    CacheInfrastructure.invalidateTags(['dam-navigation-refresh']);
  }

  /**
   * Invalidate cache for folder structure changes
   */
  static invalidateFolderStructureCache(
    organizationIds: string[],
    profile: Profile | null
  ): void {
    // Invalidate entire folder structure
    this.invalidateOrganizationFolderCache(organizationIds, profile);
    
    // Invalidate navigation and tree caches
    CacheInfrastructure.invalidateTags(['dam-folder-tree', 'dam-navigation']);
  }

  /**
   * Private: Invalidate organization-specific folder cache
   */
  private static invalidateOrganizationFolderCache(
    organizationIds: string[],
    profile: Profile | null
  ): void {
    // If super admin and includes 'ALL', invalidate global cache
    if (SuperAdminPermissionService.isSuperAdmin(profile) && organizationIds.includes('ALL')) {
      this.invalidateSuperAdminFolderCache();
      return;
    }

    // Invalidate specific organization caches
    organizationIds.forEach(orgId => {
      CacheInfrastructure.invalidateOrganizationCache(orgId, ['folders']);
    });
  }

  /**
   * Private: Invalidate general folder cache
   */
  private static invalidateGeneralFolderCache(): void {
    const tags = ['dam-gallery', 'dam-folders'];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateDamPaths();
  }

  /**
   * Private: Invalidate super admin folder cache
   */
  private static invalidateSuperAdminFolderCache(): void {
    const tags = [
      'dam-folders',
      'dam-gallery',
      'dam-folder-tree',
      'super-admin-all-orgs',
      'super-admin-data'
    ];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateDamPaths();
  }
} 