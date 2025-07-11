/**
 * Centralized role and permission definitions
 * 
 * AI INSTRUCTIONS:
 * - Keep in sync with database roles table
 * - Add new permissions as features expand
 * - Ensure hierarchical permission structure (higher roles include lower permissions)
 * - Validate against database roles on startup
 * 
 * This file defines all user roles and permissions in the application,
 * creating a single source of truth for authorization rules.
 */

/**
 * Available user roles in the system
 * Must match the 'name' field in the database 'roles' table
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  MEMBER = 'member', // AI: Added to match database
  VIEWER = 'viewer',
  VISITOR = 'visitor', // AI: Added new role for minimal access
}

/**
 * Granular permissions for different application actions
 * 
 * AI INSTRUCTIONS:
 * - Use namespace:action format for clarity
 * - Add permissions as new features are developed
 * - Consider read/write/delete granularity
 */
export enum Permission {
  // User management
  CREATE_USER = 'create:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  VIEW_USER = 'view:user', // AI: Added for granular access
  
  // Asset management
  CREATE_ASSET = 'create:asset',
  UPDATE_ASSET = 'update:asset',
  DELETE_ASSET = 'delete:asset',
  VIEW_ASSET = 'view:asset',
  
  // Team management
  CREATE_TEAM_MEMBER = 'create:team_member', // AI: Add members to teams
  UPDATE_TEAM_MEMBER = 'update:team_member', // AI: Edit member roles/status
  DELETE_TEAM_MEMBER = 'delete:team_member', // AI: Remove members from teams
  VIEW_TEAM_MEMBER = 'view:team_member',     // AI: View team member details
  CREATE_TEAM = 'create:team',               // AI: Create new teams
  UPDATE_TEAM = 'update:team',               // AI: Edit team details
  DELETE_TEAM = 'delete:team',               // AI: Delete teams
  VIEW_TEAM = 'view:team',                   // AI: View team information
  MANAGE_TEAMS = 'manage:teams',             // AI: Legacy permission for compatibility
  JOIN_TEAM = 'join:team',                   // AI: Join existing teams
  
  // Folder management
  CREATE_FOLDER = 'create:folder',
  UPDATE_FOLDER = 'update:folder',
  DELETE_FOLDER = 'delete:folder',
  VIEW_FOLDER = 'view:folder', // AI: Added for granular access
  
  // Notes management (for documents area)
  CREATE_NOTE = 'create:note', // AI: Added for notes feature
  UPDATE_NOTE = 'update:note',
  DELETE_NOTE = 'delete:note', 
  VIEW_NOTE = 'view:note',
  
  // Organization management
  MANAGE_ORGANIZATION = 'manage:organization', // AI: Added for org settings
  VIEW_ORGANIZATION = 'view:organization',
  
  // System settings
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_SETTINGS = 'view:settings', // AI: Added for read-only settings access
  
  // Text-to-Speech (TTS) permissions
  VIEW_TTS = 'view:tts',                    // Access TTS interface
  GENERATE_SPEECH = 'generate:speech',      // Create new TTS generations
  VIEW_TTS_HISTORY = 'view:tts_history',    // See generation history
  DELETE_TTS_HISTORY = 'delete:tts_history', // Remove history items
  SAVE_TTS_TO_DAM = 'save:tts_to_dam',     // Save audio to DAM system
  CONFIGURE_VOICES = 'configure:voices',    // Access voice configuration
  EXPORT_AUDIO = 'export:audio',           // Download generated audio
  MANAGE_TTS_SETTINGS = 'manage:tts_settings', // Org-level TTS configuration
  VIEW_TTS_USAGE = 'view:tts_usage',       // Usage analytics
}

/**
 * Maps roles to their granted permissions
 * 
 * AI INSTRUCTIONS:
 * - Maintain hierarchical structure (higher roles include all lower role permissions)
 * - Admin gets all permissions automatically
 * - Each role should have logical permission groupings
 * - Consider principle of least privilege
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
    Permission.VIEW_FOLDER,
    
    // Notes permissions
    Permission.CREATE_NOTE,
    Permission.UPDATE_NOTE,
    Permission.DELETE_NOTE,
    Permission.VIEW_NOTE,
    
    // Team permissions - full team management
    Permission.CREATE_TEAM_MEMBER,
    Permission.UPDATE_TEAM_MEMBER,
    Permission.DELETE_TEAM_MEMBER,
    Permission.VIEW_TEAM_MEMBER,
    Permission.CREATE_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
    Permission.VIEW_TEAM,
    Permission.MANAGE_TEAMS,
    Permission.JOIN_TEAM,
    
    // Basic user and org viewing
    Permission.VIEW_USER,
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_SETTINGS,
    
    // TTS permissions - full access except settings management
    Permission.VIEW_TTS,
    Permission.GENERATE_SPEECH,
    Permission.VIEW_TTS_HISTORY,
    Permission.DELETE_TTS_HISTORY,
    Permission.SAVE_TTS_TO_DAM,
    Permission.CONFIGURE_VOICES,
    Permission.EXPORT_AUDIO,
    Permission.VIEW_TTS_USAGE,
  ],
  [UserRole.MEMBER]: [
    // Standard member permissions - content interaction
    Permission.CREATE_ASSET,
    Permission.UPDATE_ASSET,
    Permission.VIEW_ASSET,
    
    // Limited folder permissions
    Permission.CREATE_FOLDER,
    Permission.UPDATE_FOLDER,
    Permission.VIEW_FOLDER,
    
    // Notes permissions
    Permission.CREATE_NOTE,
    Permission.UPDATE_NOTE,
    Permission.VIEW_NOTE,
    
    // Team permissions - limited team management
    Permission.CREATE_TEAM_MEMBER, // AI: Can add members to teams they're in
    Permission.VIEW_TEAM_MEMBER,
    Permission.VIEW_TEAM,
    Permission.JOIN_TEAM,
    
    // Basic viewing
    Permission.VIEW_USER,
    Permission.VIEW_ORGANIZATION,
    
    // TTS permissions - basic generation and personal history
    Permission.VIEW_TTS,
    Permission.GENERATE_SPEECH,
    Permission.VIEW_TTS_HISTORY,
    Permission.DELETE_TTS_HISTORY,
    Permission.SAVE_TTS_TO_DAM,
    Permission.EXPORT_AUDIO,
  ],
  [UserRole.VIEWER]: [
    // Read-only permissions
    Permission.VIEW_ASSET,
    Permission.VIEW_FOLDER,
    Permission.VIEW_NOTE,
    Permission.VIEW_TEAM_MEMBER, // AI: Can view team member details
    Permission.VIEW_TEAM,
    Permission.VIEW_USER,
    Permission.VIEW_ORGANIZATION,
    Permission.JOIN_TEAM,
    
    // TTS permissions - read-only access
    Permission.VIEW_TTS,
    Permission.VIEW_TTS_HISTORY,
  ],
  [UserRole.VISITOR]: [
    // Minimal guest permissions - very limited access
    Permission.VIEW_ORGANIZATION, // AI: Can see basic org info only
  ]
};

/**
 * Get user's role as a type-safe enum
 * 
 * AI INSTRUCTIONS:
 * - Validate against database roles
 * - Handle case-insensitive matching
 * - Return undefined for invalid roles
 */
export function getUserRole(roleString: string | undefined): UserRole | undefined {
  if (!roleString) return undefined;
  
  // Check if the roleString is a valid UserRole
  return Object.values(UserRole).includes(roleString as UserRole) 
    ? roleString as UserRole
    : undefined;
}

/**
 * Check if a role has higher or equal authority than another role
 * 
 * AI INSTRUCTIONS:
 * - Use for role hierarchy validation
 * - Admin > Editor > Member > Viewer > Visitor
 * - Useful for permission escalation checks
 */
export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 5,
    [UserRole.EDITOR]: 4,
    [UserRole.MEMBER]: 3,
    [UserRole.VIEWER]: 2,
    [UserRole.VISITOR]: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get all database role names for validation
 * 
 * AI INSTRUCTIONS:
 * - Use to validate database consistency
 * - Include in startup checks
 * - Add new roles here when database is updated
 */
export const DATABASE_ROLES = [
  'admin',
  'editor', 
  'member',
  'viewer',
  'visitor',
  'super-admin' // AI: Special role for cross-org access
] as const;

export type DatabaseRole = typeof DATABASE_ROLES[number]; 