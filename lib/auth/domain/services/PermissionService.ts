/**
 * Permission Service - Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Use existing Permission enum from roles.ts
 * - Keep business logic simple and focused
 * - Support current app's permission checking needs
 * - No over-engineering - match current usage patterns
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';
import { OrganizationId } from '../value-objects/OrganizationId';
import { UserId } from '../value-objects/UserId';
import { UserAggregate } from '../aggregates/UserAggregate';

// Import permissions from new domain value objects
import { Permission, ROLE_PERMISSIONS } from '../value-objects/Permission';
import { UserRole } from '../value-objects/UserRole';

export interface PermissionCheck {
  userId: UserId;
  userRole: UserRole;
  organizationId: OrganizationId;
  requiredPermissions: Permission[];
  user?: UserAggregate; // Optional: for super admin bypass
}

export interface PermissionResult {
  granted: boolean;
  missingPermissions: Permission[];
  reason: string;
}

/**
 * Domain service for permission validation and role management
 * 
 * Handles business logic for:
 * - Permission checking based on user roles
 * - Role hierarchy validation
 * - Permission inheritance
 */
export class PermissionService {
  /**
   * Checks if user has required permissions based on their role
   * Super admins bypass all permission checks
   */
  static checkPermissions(check: PermissionCheck): PermissionResult {
    if (!check.userId || !check.organizationId) {
      throw new BusinessRuleViolationError(
        'User ID and Organization ID are required for permission check',
        { hasUserId: !!check.userId, hasOrganizationId: !!check.organizationId }
      );
    }

    if (!check.requiredPermissions || check.requiredPermissions.length === 0) {
      return {
        granted: true,
        missingPermissions: [],
        reason: 'No permissions required'
      };
    }

    // Super admin bypass - grant all permissions
    if (check.user?.hasSuperAdminRole()) {
      return {
        granted: true,
        missingPermissions: [],
        reason: 'Super admin access - all permissions granted'
      };
    }

    // Get permissions for user's role
    const userPermissions = ROLE_PERMISSIONS[check.userRole] || [];
    
    // Check if user has all required permissions
    const missingPermissions = check.requiredPermissions.filter(
      permission => !userPermissions.includes(permission)
    );

    const granted = missingPermissions.length === 0;

    return {
      granted,
      missingPermissions,
      reason: granted 
        ? 'All required permissions granted'
        : `Missing permissions: ${missingPermissions.join(', ')}`
    };
  }

  /**
   * Validates if one role can assign another role
   * Super admins can assign any role
   */
  static validateRoleAssignment(
    assignerRole: UserRole,
    targetRole: UserRole,
    organizationId: OrganizationId,
    assignerUser?: UserAggregate
  ): boolean {
    if (!assignerRole || !targetRole) {
      throw new BusinessRuleViolationError(
        'Assigner role and target role are required',
        { assignerRole, targetRole }
      );
    }

    // Super admin bypass - can assign any role
    if (assignerUser?.hasSuperAdminRole()) {
      return true;
    }

    // Use existing role hierarchy from roles.ts
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 5,
      [UserRole.EDITOR]: 4,
      [UserRole.MEMBER]: 3,
      [UserRole.VIEWER]: 2,
      [UserRole.VISITOR]: 1,
    };

    const assignerLevel = roleHierarchy[assignerRole];
    const targetLevel = roleHierarchy[targetRole];

    // Users can only assign roles with lower or equal level than their own
    return assignerLevel >= targetLevel;
  }

  /**
   * Gets all permissions for a role using existing role permissions
   */
  static getAllPermissionsForRole(role: UserRole): Permission[] {
    const permissions = ROLE_PERMISSIONS[role];
    
    if (!permissions) {
      throw new BusinessRuleViolationError(
        'Unknown role',
        { role, validRoles: Object.keys(UserRole) }
      );
    }

    return permissions;
  }

  /**
   * Checks if one role can manage another role
   * Super admins can manage any role
   */
  static canManageRole(managerRole: UserRole, targetRole: UserRole, managerUser?: UserAggregate): boolean {
    if (!managerRole || !targetRole) {
      return false;
    }

    // Super admin bypass - can manage any role
    if (managerUser?.hasSuperAdminRole()) {
      return true;
    }

    // Use same hierarchy as role assignment
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 5,
      [UserRole.EDITOR]: 4,
      [UserRole.MEMBER]: 3,
      [UserRole.VIEWER]: 2,
      [UserRole.VISITOR]: 1,
    };

    const managerLevel = roleHierarchy[managerRole];
    const targetLevel = roleHierarchy[targetRole];

    // Can manage roles with lower level
    return managerLevel > targetLevel;
  }

  /**
   * Checks if user has specific permission
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Checks if user has all specified permissions
   * Super admins have all permissions
   */
  static hasAllPermissions(userRole: UserRole, permissions: Permission[], user?: UserAggregate): boolean {
    // Super admin bypass - has all permissions
    if (user?.hasSuperAdminRole()) {
      return true;
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Checks if user has super admin privileges
   */
  static isSuperAdmin(user: UserAggregate): boolean {
    return user.hasSuperAdminRole();
  }

  /**
   * Enhanced permission check with super admin bypass
   */
  static checkPermissionsWithSuperAdmin(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId,
    requiredPermissions: Permission[]
  ): PermissionResult {
    return this.checkPermissions({
      userId: user.getId(),
      userRole,
      organizationId,
      requiredPermissions,
      user // Include user for super admin bypass
    });
  }

  /**
   * Authorization utilities integrated from authorization.ts
   * These provide backward compatibility with existing authorization patterns
   */

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(userRole: UserRole, permissions: Permission[], user?: UserAggregate): boolean {
    // Super admin bypass - has all permissions
    if (user?.hasSuperAdminRole()) {
      return true;
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Get all permissions for a user based on their role
   */
  static getUserPermissions(userRole: UserRole, user?: UserAggregate): Permission[] {
    // Super admin bypass - has all permissions
    if (user?.hasSuperAdminRole()) {
      return Object.values(Permission);
    }

    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Check if user role matches specific role
   */
  static hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return userRole === requiredRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(userRole: UserRole, roles: UserRole[]): boolean {
    return roles.includes(userRole);
  }
} 