/**
 * Domain Service: Super Admin Permissions
 * 
 * Single Responsibility: Handles super admin permission logic
 * Encapsulates authorization decisions for super admin features
 */

import type { Profile, SuperAdminContext } from './types';

/**
 * Super Admin Permission Service
 * Provides core permission checking logic for super admin functionality
 */
export class SuperAdminPermissionService {
  /**
   * Checks if user has super admin privileges
   * @param profile User profile with super admin flag
   * @returns boolean indicating super admin status
   */
  static isSuperAdmin(profile: Profile | null): boolean {
    return profile?.is_super_admin === true;
  }

  /**
   * Checks if user can access all organizations
   * @param profile User profile
   * @returns boolean indicating cross-organization access
   */
  static canAccessAllOrganizations(profile: Profile | null): boolean {
    return this.isSuperAdmin(profile);
  }

  /**
   * Checks if user can manage any organization
   * @param profile User profile
   * @param organizationId Optional organization ID (super admin bypasses)
   * @returns boolean indicating management permissions
   */
  static canManageOrganization(profile: Profile | null, organizationId?: string): boolean {
    return this.isSuperAdmin(profile);
  }

  /**
   * Creates super admin context object
   * @param profile User profile
   * @returns SuperAdminContext with permission flags
   */
  static createContext(profile: Profile | null): SuperAdminContext {
    const isSuperAdmin = this.isSuperAdmin(profile);
    
    return {
      isSuperAdmin,
      canAccessAllOrganizations: isSuperAdmin,
    };
  }

  /**
   * Gets accessible organizations for user
   * @param profile User profile
   * @param userOrganizations User's direct organization memberships
   * @returns Array of organization IDs user can access
   */
  static getAccessibleOrganizations(
    profile: Profile | null, 
    userOrganizations: string[]
  ): string[] | 'ALL' {
    if (this.isSuperAdmin(profile)) {
      return 'ALL'; // Super admin can access all organizations
    }
    
    return userOrganizations;
  }
}

/**
 * Utility Functions for Components
 * Simple functions for use in React components and hooks
 */

/**
 * Check if profile has super admin access
 */
export function isSuperAdmin(profile: Profile | null): boolean {
  return SuperAdminPermissionService.isSuperAdmin(profile);
}

/**
 * Check if profile can access all organizations
 */
export function canAccessAllOrganizations(profile: Profile | null): boolean {
  return SuperAdminPermissionService.canAccessAllOrganizations(profile);
}

/**
 * Check if profile can manage organization
 */
export function canManageOrganization(profile: Profile | null, organizationId?: string): boolean {
  return SuperAdminPermissionService.canManageOrganization(profile, organizationId);
}

/**
 * Get accessible organizations for profile
 */
export function getAccessibleOrganizations(
  profile: Profile | null, 
  userOrganizations: string[]
): string[] | 'ALL' {
  return SuperAdminPermissionService.getAccessibleOrganizations(profile, userOrganizations);
} 