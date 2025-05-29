/**
 * Application Service: Super Admin Caching - Public API
 * 
 * Single Responsibility: Provide public interface for cache invalidation
 * Delegates to specialized domain services while maintaining backward compatibility
 * 
 * NOTE: This file contains server-only functions (revalidatePath, revalidateTag)
 * and should only be imported in server components or server actions.
 */

import { AssetCacheService } from './asset-cache-service';
import { FolderCacheService } from './folder-cache-service';
import { MemberCacheService } from './member-cache-service';
import { SuperAdminCacheOrchestrator } from './cache-orchestrator';
import type { Profile } from './types';

/**
 * Main cache service - delegates to specialized services
 * Maintains backward compatibility while providing improved architecture
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
    SuperAdminCacheOrchestrator.invalidateOrganizationCache(
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
    AssetCacheService.invalidateAssetCache(
      assetIds,
      organizationIds,
      folderIds,
      profile
    );
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
    FolderCacheService.invalidateFolderCache(
      folderIds,
      organizationIds,
      parentFolderIds,
      profile
    );
  }

  /**
   * Invalidate cache after member operations
   */
  static invalidateMemberCache(
    organizationIds: string | string[],
    userIds: string[] = [],
    profile: Profile | null
  ): void {
    MemberCacheService.invalidateMemberCache(
      organizationIds,
      userIds,
      profile
    );
  }

  /**
   * Invalidate cache after cross-organization transfer (super admin only)
   */
  static invalidateTransferCache(
    entityType: 'asset' | 'folder' | 'member',
    entityIds: string[],
    fromOrganizationId: string,
    toOrganizationId: string,
    profile: Profile | null
  ): void {
    SuperAdminCacheOrchestrator.invalidateTransferCache(
      entityType,
      entityIds,
      fromOrganizationId,
      toOrganizationId,
      profile
    );
  }

  /**
   * Invalidate all organization cache for super admin
   */
  static invalidateAllOrganizationsCache(profile: Profile | null): void {
    SuperAdminCacheOrchestrator.invalidateAllOrganizationsCache(profile);
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
  if (operationType === 'asset') {
    SuperAdminCacheService.invalidateAssetCache(
      entityIds,
      organizationIds,
      additionalContext?.folderIds,
      profile
    );
  } else {
    SuperAdminCacheService.invalidateFolderCache(
      entityIds,
      organizationIds,
      additionalContext?.parentFolderIds,
      profile
    );
  }
}

/**
 * Invalidate cache after team operations with super admin support
 */
export function invalidateTeamCache(
  organizationIds: string[],
  userIds: string[],
  profile: Profile | null
): void {
  SuperAdminCacheService.invalidateMemberCache(organizationIds, userIds, profile);
}

/**
 * Invalidate cache after bulk operations
 */
export function invalidateBulkOperationCache(
  operations: Array<{
    type: 'asset' | 'folder' | 'member';
    operation: 'create' | 'update' | 'delete' | 'transfer';
    entityIds: string[];
    organizationIds: string[];
    additionalData?: any;
  }>,
  profile: Profile | null
): void {
  SuperAdminCacheOrchestrator.invalidateBulkOperationCache(operations, profile);
} 