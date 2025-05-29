/**
 * Application Service: Cache Orchestrator
 * 
 * Single Responsibility: Coordinate cache invalidation across domain services
 * Provides unified interface for cache management with super admin support
 */

import { AssetCacheService } from './asset-cache-service';
import { FolderCacheService } from './folder-cache-service';
import { MemberCacheService } from './member-cache-service';
import { CacheInfrastructure } from './cache-infrastructure';
import { SuperAdminPermissionService } from './permissions';
import type { Profile } from './types';

/**
 * Orchestrates cache invalidation across different domain services
 * Single point of coordination for complex cache invalidation scenarios
 */
export class SuperAdminCacheOrchestrator {
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
    // Only super admin can transfer between organizations
    if (!SuperAdminPermissionService.isSuperAdmin(profile)) {
      return;
    }

    switch (entityType) {
      case 'asset':
        AssetCacheService.invalidateAssetTransferCache(
          entityIds,
          fromOrganizationId,
          toOrganizationId,
          profile
        );
        break;
      case 'folder':
        FolderCacheService.invalidateFolderTransferCache(
          entityIds,
          fromOrganizationId,
          toOrganizationId,
          profile
        );
        break;
      case 'member':
        MemberCacheService.invalidateMemberTransferCache(
          entityIds,
          fromOrganizationId,
          toOrganizationId,
          profile
        );
        break;
    }

    // Invalidate global cache for super admin transfers
    this.invalidateGlobalSuperAdminCache();
  }

  /**
   * Invalidate all organization cache for super admin
   */
  static invalidateAllOrganizationsCache(profile: Profile | null): void {
    if (!SuperAdminPermissionService.isSuperAdmin(profile)) {
      return;
    }

    this.invalidateGlobalSuperAdminCache();
  }

  /**
   * Invalidate cache for bulk operations affecting multiple entities
   */
  static invalidateBulkOperationCache(
    operations: Array<{
      type: 'asset' | 'folder' | 'member';
      operation: 'create' | 'update' | 'delete' | 'transfer';
      entityIds: string[];
      organizationIds: string[];
      additionalData?: any;
    }>,
    profile: Profile | null
  ): void {
    // Process each operation type
    operations.forEach(op => {
      switch (op.type) {
        case 'asset':
          if (op.operation === 'delete') {
            AssetCacheService.invalidateAssetDeletionCache(
              op.entityIds,
              op.organizationIds,
              op.additionalData?.folderIds || [],
              profile
            );
          } else {
            AssetCacheService.invalidateAssetCache(
              op.entityIds,
              op.organizationIds,
              op.additionalData?.folderIds || [],
              profile
            );
          }
          break;
        case 'folder':
          if (op.operation === 'delete') {
            FolderCacheService.invalidateFolderDeletionCache(
              op.entityIds,
              op.organizationIds,
              op.additionalData?.parentFolderIds || [],
              profile
            );
          } else {
            FolderCacheService.invalidateFolderCache(
              op.entityIds,
              op.organizationIds,
              op.additionalData?.parentFolderIds || [],
              profile
            );
          }
          break;
        case 'member':
          if (op.operation === 'delete') {
            MemberCacheService.invalidateMemberRemovalCache(
              op.organizationIds,
              op.entityIds,
              profile
            );
          } else {
            MemberCacheService.invalidateMemberCache(
              op.organizationIds,
              op.entityIds,
              profile
            );
          }
          break;
      }
    });

    // If super admin and multiple organizations affected, invalidate global
    const allOrgIds = new Set(operations.flatMap(op => op.organizationIds));
    if (SuperAdminPermissionService.isSuperAdmin(profile) && allOrgIds.size > 1) {
      this.invalidateGlobalSuperAdminCache();
    }
  }

  /**
   * Invalidate cache for organization-wide changes
   */
  static invalidateOrganizationCache(
    organizationIds: string | string[],
    profile: Profile | null,
    cacheType: 'assets' | 'folders' | 'members' | 'all' = 'all'
  ): void {
    const orgIds = Array.isArray(organizationIds) ? organizationIds : [organizationIds];
    
    // If super admin and requested all organizations, invalidate global cache
    if (SuperAdminPermissionService.isSuperAdmin(profile) && orgIds.includes('ALL')) {
      this.invalidateGlobalSuperAdminCache();
      return;
    }

    // Invalidate specific organization caches based on type
    orgIds.forEach(orgId => {
      if (cacheType === 'assets' || cacheType === 'all') {
        CacheInfrastructure.invalidateOrganizationCache(orgId, ['assets']);
      }
      if (cacheType === 'folders' || cacheType === 'all') {
        CacheInfrastructure.invalidateOrganizationCache(orgId, ['folders']);
      }
      if (cacheType === 'members' || cacheType === 'all') {
        CacheInfrastructure.invalidateOrganizationCache(orgId, ['members']);
      }
    });
  }

  /**
   * Private: Invalidate global cache patterns for super admin
   */
  private static invalidateGlobalSuperAdminCache(): void {
    const globalTags = [
      'dam-assets',
      'dam-folders',
      'dam-gallery',
      'org-members',
      'team-members',
      'super-admin-all-orgs',
      'super-admin-data'
    ];

    CacheInfrastructure.invalidateTags(globalTags);
    CacheInfrastructure.invalidateDamPaths();
    CacheInfrastructure.invalidateTeamPaths();
  }
} 