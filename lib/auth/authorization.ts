/**
 * Authorization utilities for type-safe permission checks
 * 
 * This module provides functions to check if a user has specific roles
 * or permissions, with strong type safety and consistent error handling.
 */

import { User } from '@supabase/supabase-js';
import { AuthorizationError } from '@/lib/errors/base';
import { UserRole, Permission, ROLE_PERMISSIONS, getUserRole } from './roles';

/**
 * Type guard to check if a user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  const userRole = getUserRole(user.app_metadata?.role);
  return userRole === role;
}

/**
 * Type guard to check if a user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  const userRole = getUserRole(user.app_metadata?.role);
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Check if a user has a specific permission based on their role
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return false;
  
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Check if a user has all of the specified permissions
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
 */
export function assertRole(
  user: User | null, 
  role: UserRole,
  message = `Required role: ${role}`
): void {
  if (!hasRole(user, role)) {
    throw new AuthorizationError(message);
  }
}

/**
 * Assert that a user has a specific permission, throwing an error if not
 */
export function assertPermission(
  user: User | null, 
  permission: Permission,
  message = `Required permission: ${permission}`
): void {
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(message);
  }
}

/**
 * Assert that a user has all of the specified permissions
 */
export function assertAllPermissions(
  user: User | null,
  permissions: Permission[],
  message = `Required all permissions: ${permissions.join(', ')}`
): void {
  if (!hasAllPermissions(user, permissions)) {
    throw new AuthorizationError(message);
  }
}

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  
  const userRole = getUserRole(user.app_metadata?.role);
  if (!userRole) return [];
  
  return ROLE_PERMISSIONS[userRole];
} 