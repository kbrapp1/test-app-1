/**
 * Authorization Compatibility Adapter
 * 
 * AI INSTRUCTIONS:
 * - Provides backward compatibility for existing authorization.ts usage
 * - Wraps new domain services with old function signatures
 * - Maintains existing error handling patterns
 * - Should be used temporarily while migrating to new patterns
 */

import { User } from '@supabase/supabase-js';
import { InsufficientPermissionsError } from '../../domain/errors/AuthDomainError';
import { UserRole, getUserRole } from '../../domain/value-objects/UserRole';
import { Permission, ROLE_PERMISSIONS } from '../../domain/value-objects/Permission';
import { PermissionService } from '../../domain/services/PermissionService';

/**
 * Type guard to check if a user has a specific role
 * @deprecated Use PermissionService.hasRole instead
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  const userRole = getUserRole(user.app_metadata?.role);
  return userRole === role;
}

/**
 * Type guard to check if a user has any of the specified roles
 * @deprecated Use PermissionService.hasAnyRole instead
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  const userRole = getUserRole(user.app_metadata?.role);
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Check if a user has a specific permission based on their role
 * @deprecated Use PermissionService.hasPermission instead
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return false;
  
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Async version that checks super admin status from database
 * Use this for server-side permission checks that need super admin bypass
 */
export async function hasPermissionWithSuperAdminCheck(user: User | null, permission: Permission): Promise<boolean> {
  if (!user) return false;
  
  // Super admin bypass - check if user is super admin from database
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();
    
    if (profile?.is_super_admin === true) {
      return true;
    }
  } catch (error) {
    // If we can't check super admin status, continue with normal permission check
    console.error('Error checking super admin status:', error);
  }
  
  // Fall back to normal permission check
  return hasPermission(user, permission);
}

/**
 * Check if a user has all of the specified permissions
 * @deprecated Use PermissionService.hasAllPermissions instead
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole];
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has any of the specified permissions
 * @deprecated Use PermissionService.hasAnyPermission instead
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Assert that a user has a specific role, throwing an error if not
 * @deprecated Use domain services with proper error handling instead
 */
export function assertRole(
  user: User | null, 
  role: UserRole,
  message = `Required role: ${role}`
): void {
  if (!hasRole(user, role)) {
    throw new InsufficientPermissionsError(message);
  }
}

/**
 * Assert that a user has a specific permission, throwing an error if not
 * @deprecated Use domain services with proper error handling instead
 */
export function assertPermission(
  user: User | null, 
  permission: Permission,
  message = `Required permission: ${permission}`
): void {
  if (!hasPermission(user, permission)) {
    throw new InsufficientPermissionsError(message);
  }
}

/**
 * Assert that a user has all of the specified permissions
 * @deprecated Use domain services with proper error handling instead
 */
export function assertAllPermissions(
  user: User | null,
  permissions: Permission[],
  message = `Required all permissions: ${permissions.join(', ')}`
): void {
  if (!hasAllPermissions(user, permissions)) {
    throw new InsufficientPermissionsError(message);
  }
}

/**
 * Get all permissions for a user based on their role
 * @deprecated Use PermissionService.getUserPermissions instead
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return [];
  
  return ROLE_PERMISSIONS[userRole];
} 