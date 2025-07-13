/**
 * Application Service: Super Admin Caching - Public API
 * 
 * Single Responsibility: Provide public interface for cache invalidation
 * Simplified to use unified SimpleCacheService instead of specialized services
 * 
 * NOTE: This file contains server-only functions (revalidatePath, revalidateTag)
 * and should only be imported in server components or server actions.
 */

import { SimpleCacheService, invalidateDamCache as simpleDamCache, invalidateTeamCache as simpleTeamCache } from '../infrastructure/services/SimpleCacheService';
import type { Profile } from './types';

/**
 * Main cache service - simplified to use unified SimpleCacheService
 * Maintains backward compatibility while removing over-abstraction
 */
export class SuperAdminCacheService {
  /**
   * Invalidate organization-specific cache
   * For super admin, invalidates across multiple organizations
   */
  static invalidateOrganizationCache(
    organizationIds: string | string[],
    profile: Profile | null,
    cacheType: 'assets' | 'folders' | 'members' | 'all' = 'all'
  ): void {
    SimpleCacheService.invalidateOrganizationCache(
      organizationIds,
      profile,
      cacheType
    );
  }

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
    SimpleCacheService.invalidateDamCache('asset', assetIdArray, orgIdArray, profile);
  }

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
    SimpleCacheService.invalidateDamCache('folder', folderIdArray, orgIdArray, profile);
  }

  /**
   * Invalidate cache after member operations
   */
  static invalidateMemberCache(
    organizationIds: string | string[],
    userIds: string[] = [],
    profile: Profile | null
  ): void {
    const orgIdArray = Array.isArray(organizationIds) ? organizationIds : [organizationIds];
    SimpleCacheService.invalidateTeamCache(orgIdArray, userIds, profile);
  }

  /**
   * Invalidate all organization cache for super admin
   */
  static invalidateAllOrganizationsCache(profile: Profile | null): void {
    SimpleCacheService.invalidateAllOrganizationsCache(profile);
  }
}

/**
 * Utility functions for components and actions
 * Provides simplified interface for common cache invalidation patterns
 */

/**
 * Invalidate cache after DAM operations with super admin support
 */
export function invalidateDamCache(
  operationType: 'asset' | 'folder',
  entityIds: string[],
  organizationIds: string[],
  profile: Profile | null,
  additionalContext?: {
    folderIds?: (string | null)[];
    parentFolderIds?: (string | null)[];
  }
): void {
  SimpleCacheService.invalidateDamCache(operationType, entityIds, organizationIds, profile);
}

/**
 * Invalidate cache after team operations with super admin support
 */
export function invalidateTeamCache(
  organizationIds: string[],
  userIds: string[],
  profile: Profile | null
): void {
  SimpleCacheService.invalidateTeamCache(organizationIds, userIds, profile);
} 