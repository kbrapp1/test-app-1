/**
 * Centralized role and permission definitions
 * 
 * This file defines all user roles and permissions in the application,
 * creating a single source of truth for authorization rules.
 */

/**
 * Available user roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

/**
 * Granular permissions for different application actions
 */
export enum Permission {
  // User management
  CREATE_USER = 'create:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  // Asset management
  CREATE_ASSET = 'create:asset',
  UPDATE_ASSET = 'update:asset',
  DELETE_ASSET = 'delete:asset',
  VIEW_ASSET = 'view:asset',
  
  // Team management
  MANAGE_TEAMS = 'manage:teams',
  JOIN_TEAM = 'join:team',
  
  // Folder management
  CREATE_FOLDER = 'create:folder',
  UPDATE_FOLDER = 'update:folder',
  DELETE_FOLDER = 'delete:folder',
  
  // System settings
  MANAGE_SETTINGS = 'manage:settings',
}

/**
 * Maps roles to their granted permissions
 * 
 * This is the primary authorization mechanism - a user with a given role
 * automatically has all permissions assigned to that role.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission)
  ],
  [UserRole.EDITOR]: [
    // Content editing permissions
    Permission.CREATE_ASSET,
    Permission.UPDATE_ASSET,
    Permission.DELETE_ASSET,
    Permission.VIEW_ASSET,
    
    // Folder permissions
    Permission.CREATE_FOLDER,
    Permission.UPDATE_FOLDER,
    Permission.DELETE_FOLDER,
    
    // Team permissions
    Permission.JOIN_TEAM,
  ],
  [UserRole.VIEWER]: [
    // Read-only permissions
    Permission.VIEW_ASSET,
    Permission.JOIN_TEAM,
  ]
};

/**
 * Get user's role as a type-safe enum
 */
export function getUserRole(roleString: string | undefined): UserRole | undefined {
  if (!roleString) return undefined;
  
  // Check if the roleString is a valid UserRole
  return Object.values(UserRole).includes(roleString as UserRole) 
    ? roleString as UserRole
    : undefined;
} 