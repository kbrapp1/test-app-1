/**
 * Super Admin Domain Service - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Domain service for super admin business logic
 * - Integrates with main auth domain services
 * - Pure business logic, no external dependencies
 * - Single responsibility: Super admin domain operations
 */


import { UserAggregate } from '../aggregates/UserAggregate';
import { OrganizationAggregate } from '../aggregates/OrganizationAggregate';
import { BusinessRuleViolationError, InsufficientPermissionsError } from '../errors/AuthDomainError';

export class SuperAdminDomainService {
  /**
   * Grant super admin access to a user
   */
  public grantSuperAdminAccess(
    targetUser: UserAggregate,
    grantedBy: UserAggregate
  ): void {
    // Only existing super admins can grant access
    if (!grantedBy.hasSuperAdminRole()) {
      throw new InsufficientPermissionsError(
        'Only super administrators can grant super admin access',
        { 
          targetUserId: targetUser.getId().value,
          grantedByUserId: grantedBy.getId().value,
          grantedByIsSuperAdmin: grantedBy.hasSuperAdminRole()
        }
      );
    }

    // Cannot grant to self
    if (targetUser.getId().equals(grantedBy.getId())) {
      throw new BusinessRuleViolationError(
        'Cannot grant super admin access to self',
        { 
          targetUserId: targetUser.getId().value,
          grantedByUserId: grantedBy.getId().value
        }
      );
    }

    // Grant the access
    targetUser.grantSuperAdminAccess();

    // Domain event is published within the aggregate method
  }

  /**
   * Revoke super admin access from a user
   */
  public revokeSuperAdminAccess(
    targetUser: UserAggregate,
    revokedBy: UserAggregate
  ): void {
    // Only existing super admins can revoke access
    if (!revokedBy.hasSuperAdminRole()) {
      throw new InsufficientPermissionsError(
        'Only super administrators can revoke super admin access',
        { 
          targetUserId: targetUser.getId().value,
          revokedByUserId: revokedBy.getId().value,
          revokedByIsSuperAdmin: revokedBy.hasSuperAdminRole()
        }
      );
    }

    // Cannot revoke from self (prevent lockout)
    if (targetUser.getId().equals(revokedBy.getId())) {
      throw new BusinessRuleViolationError(
        'Cannot revoke super admin access from self',
        { 
          targetUserId: targetUser.getId().value,
          revokedByUserId: revokedBy.getId().value
        }
      );
    }

    // Revoke the access
    targetUser.revokeSuperAdminAccess();

    // Domain event is published within the aggregate method
  }

  /**
   * Check if user can access organization (with super admin bypass)
   */
  public canAccessOrganization(
    user: UserAggregate,
    organization: OrganizationAggregate
  ): boolean {
    // Super admin can access any organization
    if (user.hasSuperAdminRole()) {
      return true;
    }

    // Regular users must be members
    return organization.isMember(user.getId());
  }

  /**
   * Check if user can manage organization (with super admin bypass)
   */
  public canManageOrganization(
    user: UserAggregate,
    organization: OrganizationAggregate
  ): boolean {
    // Super admin can manage any organization
    if (user.hasSuperAdminRole()) {
      return true;
    }

    // Regular users must have admin role in organization
    return organization.isAdmin(user.getId()) || organization.isOwner(user.getId());
  }

  /**
   * Get accessible organizations for user
   */
  public getAccessibleOrganizations(
    user: UserAggregate,
    allOrganizations: OrganizationAggregate[]
  ): OrganizationAggregate[] {
    // Super admin can access all organizations
    if (user.hasSuperAdminRole()) {
      return allOrganizations;
    }

    // Regular users can only access organizations they belong to
    return allOrganizations.filter(org => org.isMember(user.getId()));
  }

  /**
   * Validate super admin operation
   */
  public validateSuperAdminOperation(
    user: UserAggregate,
    operationName: string
  ): void {
    if (!user.hasSuperAdminRole()) {
      throw new InsufficientPermissionsError(
        `Operation '${operationName}' requires super admin privileges`,
        { 
          userId: user.getId().value,
          operation: operationName,
          isSuperAdmin: user.hasSuperAdminRole()
        }
      );
    }
  }

  /**
   * Check if user can transfer entities between organizations
   */
  public canTransferBetweenOrganizations(user: UserAggregate): boolean {
    return user.hasSuperAdminRole();
  }

  /**
   * Check if user can bypass organization RLS policies
   */
  public canBypassOrganizationRLS(user: UserAggregate): boolean {
    return user.hasSuperAdminRole();
  }

  /**
   * Check if user can invalidate global cache
   */
  public canInvalidateGlobalCache(user: UserAggregate): boolean {
    return user.hasSuperAdminRole();
  }

  /**
   * Create super admin context for user
   */
  public createSuperAdminContext(user: UserAggregate): {
    isSuperAdmin: boolean;
    canAccessAllOrganizations: boolean;
    canBypassOrganizationRLS: boolean;
    canTransferBetweenOrganizations: boolean;
    canInvalidateGlobalCache: boolean;
  } {
    const isSuperAdmin = user.hasSuperAdminRole();
    
    return {
      isSuperAdmin,
      canAccessAllOrganizations: isSuperAdmin,
      canBypassOrganizationRLS: isSuperAdmin,
      canTransferBetweenOrganizations: isSuperAdmin,
      canInvalidateGlobalCache: isSuperAdmin,
    };
  }
} 