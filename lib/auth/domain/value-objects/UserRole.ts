/**
 * UserRole Value Object
 * 
 * AI INSTRUCTIONS:
 * - Define all user roles as immutable enum
 * - Provide role hierarchy and comparison utilities
 * - Ensure type safety for role operations
 * - Keep in sync with database roles table
 */

/**
 * Available user roles in the system
 * Must match the 'name' field in the database 'roles' table
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  MEMBER = 'member',
  VIEWER = 'viewer',
  VISITOR = 'visitor',
}

/**
 * Role hierarchy order (higher index = higher privilege)
 */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VISITOR,
  UserRole.VIEWER,
  UserRole.MEMBER,
  UserRole.EDITOR,
  UserRole.ADMIN,
];

/**
 * Database roles configuration
 */
export const DATABASE_ROLES = [
  { name: 'admin', description: 'Full system access' },
  { name: 'editor', description: 'Content editing and team management' },
  { name: 'member', description: 'Standard user access' },
  { name: 'viewer', description: 'Read-only access' },
  { name: 'visitor', description: 'Minimal access' },
] as const;

export type DatabaseRole = typeof DATABASE_ROLES[number];

/**
 * Convert string to UserRole enum
 */
export function getUserRole(roleString: string | undefined): UserRole | undefined {
  if (!roleString) return undefined;
  
  const role = Object.values(UserRole).find(r => r === roleString);
  return role;
}

/**
 * Check if one role is higher than or equal to another in the hierarchy
 */
export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return false;
  }
  
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Get role hierarchy index (higher number = higher privilege)
 */
export function getRoleHierarchyIndex(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Get all roles at or below a given role level
 */
export function getRolesAtOrBelow(role: UserRole): UserRole[] {
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  if (roleIndex === -1) return [];
  
  return ROLE_HIERARCHY.slice(0, roleIndex + 1);
}

/**
 * Get all roles above a given role level
 */
export function getRolesAbove(role: UserRole): UserRole[] {
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  if (roleIndex === -1) return [];
  
  return ROLE_HIERARCHY.slice(roleIndex + 1);
} 