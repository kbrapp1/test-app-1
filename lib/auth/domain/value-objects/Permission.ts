/**
 * Permission Value Object
 * 
 * AI INSTRUCTIONS:
 * - Define all permissions with namespace:action format
 * - Maintain role-permission mappings
 * - Ensure hierarchical permission structure
 * - Add new permissions as features expand
 */

import { UserRole } from './UserRole';

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
  VIEW_USER = 'view:user',
  
  // Asset management
  CREATE_ASSET = 'create:asset',
  UPDATE_ASSET = 'update:asset',
  DELETE_ASSET = 'delete:asset',
  VIEW_ASSET = 'view:asset',
  
  // Team management
  CREATE_TEAM_MEMBER = 'create:team_member',
  UPDATE_TEAM_MEMBER = 'update:team_member',
  DELETE_TEAM_MEMBER = 'delete:team_member',
  VIEW_TEAM_MEMBER = 'view:team_member',
  CREATE_TEAM = 'create:team',
  UPDATE_TEAM = 'update:team',
  DELETE_TEAM = 'delete:team',
  VIEW_TEAM = 'view:team',
  MANAGE_TEAMS = 'manage:teams',
  JOIN_TEAM = 'join:team',
  
  // Folder management
  CREATE_FOLDER = 'create:folder',
  UPDATE_FOLDER = 'update:folder',
  DELETE_FOLDER = 'delete:folder',
  VIEW_FOLDER = 'view:folder',
  
  // Notes management
  CREATE_NOTE = 'create:note',
  UPDATE_NOTE = 'update:note',
  DELETE_NOTE = 'delete:note',
  VIEW_NOTE = 'view:note',
  
  // Organization management
  MANAGE_ORGANIZATION = 'manage:organization',
  VIEW_ORGANIZATION = 'view:organization',
  
  // System settings
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_SETTINGS = 'view:settings',
  
  // Text-to-Speech (TTS) permissions
  VIEW_TTS = 'view:tts',
  GENERATE_SPEECH = 'generate:speech',
  VIEW_TTS_HISTORY = 'view:tts_history',
  DELETE_TTS_HISTORY = 'delete:tts_history',
  SAVE_TTS_TO_DAM = 'save:tts_to_dam',
  CONFIGURE_VOICES = 'configure:voices',
  EXPORT_AUDIO = 'export:audio',
  MANAGE_TTS_SETTINGS = 'manage:tts_settings',
  VIEW_TTS_USAGE = 'view:tts_usage',
  
  // Image Generation permissions
  VIEW_IMAGE_GENERATOR = 'view:image_generator',
  GENERATE_IMAGE = 'generate:image',
  VIEW_IMAGE_HISTORY = 'view:image_history',
  DELETE_IMAGE_HISTORY = 'delete:image_history',
  SAVE_IMAGE_TO_DAM = 'save:image_to_dam',
  CONFIGURE_IMAGE_SETTINGS = 'configure:image_settings',
  VIEW_IMAGE_USAGE = 'view:image_usage',
  
  // Chatbot permissions
  VIEW_CHATBOT = 'view:chatbot',
  CONFIGURE_CHATBOT = 'configure:chatbot',
  VIEW_CHATBOT_HISTORY = 'view:chatbot_history',
  DELETE_CHATBOT_HISTORY = 'delete:chatbot_history',
  MANAGE_CHATBOT_SETTINGS = 'manage:chatbot_settings',
  VIEW_CHATBOT_USAGE = 'view:chatbot_usage',
}

/**
 * Maps roles to their granted permissions
 * 
 * AI INSTRUCTIONS:
 * - Maintain hierarchical structure (higher roles include all lower role permissions)
 * - Admin gets all permissions automatically
 * - Each role should have logical permission groupings
 * - Consider principle of least privilege
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
    
    // Image Generation permissions - full access
    Permission.VIEW_IMAGE_GENERATOR,
    Permission.GENERATE_IMAGE,
    Permission.VIEW_IMAGE_HISTORY,
    Permission.DELETE_IMAGE_HISTORY,
    Permission.SAVE_IMAGE_TO_DAM,
    Permission.CONFIGURE_IMAGE_SETTINGS,
    Permission.VIEW_IMAGE_USAGE,
    
    // Chatbot permissions - full access
    Permission.VIEW_CHATBOT,
    Permission.CONFIGURE_CHATBOT,
    Permission.VIEW_CHATBOT_HISTORY,
    Permission.DELETE_CHATBOT_HISTORY,
    Permission.MANAGE_CHATBOT_SETTINGS,
    Permission.VIEW_CHATBOT_USAGE,
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
    Permission.CREATE_TEAM_MEMBER,
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
    
    // Image Generation permissions - basic generation
    Permission.VIEW_IMAGE_GENERATOR,
    Permission.GENERATE_IMAGE,
    Permission.VIEW_IMAGE_HISTORY,
    Permission.DELETE_IMAGE_HISTORY,
    Permission.SAVE_IMAGE_TO_DAM,
    
    // Chatbot permissions - basic usage
    Permission.VIEW_CHATBOT,
    Permission.VIEW_CHATBOT_HISTORY,
    Permission.DELETE_CHATBOT_HISTORY,
  ],
  [UserRole.VIEWER]: [
    // Read-only permissions
    Permission.VIEW_ASSET,
    Permission.VIEW_FOLDER,
    Permission.VIEW_NOTE,
    Permission.VIEW_TEAM_MEMBER,
    Permission.VIEW_TEAM,
    Permission.VIEW_USER,
    Permission.VIEW_ORGANIZATION,
    Permission.JOIN_TEAM,
    
    // TTS permissions - read-only access
    Permission.VIEW_TTS,
    Permission.VIEW_TTS_HISTORY,
    Permission.VIEW_TTS_USAGE,
    
    // Image Generation permissions - read-only access
    Permission.VIEW_IMAGE_GENERATOR,
    Permission.VIEW_IMAGE_HISTORY,
    Permission.VIEW_IMAGE_USAGE,
    
    // Chatbot permissions - read-only access
    Permission.VIEW_CHATBOT,
    Permission.VIEW_CHATBOT_HISTORY,
    Permission.VIEW_CHATBOT_USAGE,
  ],
  [UserRole.VISITOR]: [
    // Minimal permissions for guests
    Permission.VIEW_ASSET,
    Permission.VIEW_FOLDER,
    Permission.VIEW_ORGANIZATION,
    
    // Basic TTS viewing
    Permission.VIEW_TTS,
  ],
};

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Get all permissions that exist in the system
 */
export function getAllPermissions(): Permission[] {
  return Object.values(Permission);
}

/**
 * Group permissions by namespace
 */
export function getPermissionsByNamespace(): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  
  Object.values(Permission).forEach(permission => {
    const [namespace] = permission.split(':');
    if (!groups[namespace]) {
      groups[namespace] = [];
    }
    groups[namespace].push(permission);
  });
  
  return groups;
} 