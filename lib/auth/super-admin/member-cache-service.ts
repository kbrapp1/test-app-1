/**
 * Domain Service: Member Cache Management
 * 
 * Single Responsibility: Handle cache invalidation for member operations
 * Coordinates member-specific cache patterns
 */

import { CacheInfrastructure } from './cache-infrastructure';
import { SuperAdminPermissionService } from './permissions';
import type { Profile } from './types';

/**
 * Member cache invalidation strategies
 * Handles member-specific cache patterns with super admin support
 */
export class MemberCacheService {
  /**
   * Invalidate cache after member operations
   */
  static invalidateMemberCache(
    organizationIds: string | string[],
    userIds: string[] = [],
    profile: Profile | null
  ): void {
    const orgIdArray = Array.isArray(organizationIds) ? organizationIds : [organizationIds];

    // Invalidate user-specific cache
    if (userIds.length > 0) {
      CacheInfrastructure.invalidateEntityCache('user', userIds);
    }

    // Invalidate organization-specific cache
    this.invalidateOrganizationMemberCache(orgIdArray, profile);

    // Invalidate general member cache
    this.invalidateGeneralMemberCache();
  }

  /**
   * Invalidate cache after member transfer between organizations (super admin only)
   */
  static invalidateMemberTransferCache(
    userIds: string[],
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
    this.invalidateMemberCache(allOrgIds, userIds, profile);

    // Invalidate global super admin cache
    this.invalidateSuperAdminMemberCache();
  }

  /**
   * Invalidate cache for member role changes
   */
  static invalidateMemberRoleCache(
    organizationIds: string[],
    userIds: string[],
    profile: Profile | null
  ): void {
    // Role changes require broader cache invalidation
    this.invalidateMemberCache(organizationIds, userIds, profile);
    
    // Invalidate permission-related cache
    CacheInfrastructure.invalidateTags(['user-permissions', 'org-roles']);
  }

  /**
   * Invalidate cache for member invitation
   */
  static invalidateMemberInvitationCache(
    organizationIds: string[],
    profile: Profile | null
  ): void {
    // Invitation affects member lists
    this.invalidateOrganizationMemberCache(organizationIds, profile);
    
    // Invalidate invitation-specific cache
    CacheInfrastructure.invalidateTags(['pending-invitations']);
  }

  /**
   * Invalidate cache for member removal
   */
  static invalidateMemberRemovalCache(
    organizationIds: string[],
    userIds: string[],
    profile: Profile | null
  ): void {
    // Member removal requires comprehensive cache invalidation
    this.invalidateMemberCache(organizationIds, userIds, profile);
    
    // Invalidate access-related cache
    CacheInfrastructure.invalidateTags(['member-access', 'org-membership']);
  }

  /**
   * Private: Invalidate organization-specific member cache
   */
  private static invalidateOrganizationMemberCache(
    organizationIds: string[],
    profile: Profile | null
  ): void {
    // If super admin and includes 'ALL', invalidate global cache
    if (SuperAdminPermissionService.isSuperAdmin(profile) && organizationIds.includes('ALL')) {
      this.invalidateSuperAdminMemberCache();
      return;
    }

    // Invalidate specific organization caches
    organizationIds.forEach(orgId => {
      CacheInfrastructure.invalidateOrganizationCache(orgId, ['members']);
    });
  }

  /**
   * Private: Invalidate general member cache
   */
  private static invalidateGeneralMemberCache(): void {
    const tags = ['org-members', 'team-members'];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateTeamPaths();
  }

  /**
   * Private: Invalidate super admin member cache
   */
  private static invalidateSuperAdminMemberCache(): void {
    const tags = [
      'org-members',
      'team-members',
      'super-admin-all-orgs',
      'super-admin-data'
    ];
    CacheInfrastructure.invalidateTags(tags);
    CacheInfrastructure.invalidateTeamPaths();
  }
} 