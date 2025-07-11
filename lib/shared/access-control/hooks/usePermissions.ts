/**
 * Simple Permission Checking Hook
 * 
 * AI INSTRUCTIONS:
 * - Lightweight hook for UI conditional rendering
 * - Focuses only on permission checking, not feature flags
 * - Returns simple boolean results for UI decisions
 * - Uses existing user context and role system
 */

import { useUser } from '@/lib/hooks/useUser';
import { Permission, UserRole } from '@/lib/auth/roles';
import { useMemo } from 'react';

export interface UsePermissionsResult {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  userRole: UserRole | undefined;
  isLoading: boolean;
}

/**
 * Hook for checking user permissions in UI components
 * 
 * @returns Permission checking functions and user role info
 */
export function usePermissions(): UsePermissionsResult {
  const { user, isLoading, auth } = useUser();
  
  const permissionCheckers = useMemo(() => {
    if (isLoading || !user) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasRole: () => false,
        hasAnyRole: () => false,
        userRole: undefined,
        isLoading: true
      };
    }
    
    return {
      hasPermission: (permission: Permission) => auth.hasPermission(permission),
      hasAnyPermission: (permissions: Permission[]) => auth.hasAnyPermission(permissions),
      hasRole: (role: UserRole) => auth.hasRole(role),
      hasAnyRole: (roles: UserRole[]) => auth.hasAnyRole(roles),
      userRole: auth.role,
      isLoading: false
    };
  }, [user, isLoading, auth]);
  
  return permissionCheckers;
}

/**
 * Convenience hook for checking specific feature permissions
 * 
 * @param featurePermissions - Array of permissions to check for a feature
 * @returns Object with permission checking results for the feature
 */
export function useFeaturePermissions(featurePermissions: {
  view?: Permission;
  create?: Permission;
  update?: Permission;
  delete?: Permission;
  manage?: Permission;
}) {
  const { hasPermission, isLoading } = usePermissions();
  
  return useMemo(() => ({
    canView: featurePermissions.view ? hasPermission(featurePermissions.view) : false,
    canCreate: featurePermissions.create ? hasPermission(featurePermissions.create) : false,
    canUpdate: featurePermissions.update ? hasPermission(featurePermissions.update) : false,
    canDelete: featurePermissions.delete ? hasPermission(featurePermissions.delete) : false,
    canManage: featurePermissions.manage ? hasPermission(featurePermissions.manage) : false,
    isLoading
  }), [hasPermission, featurePermissions, isLoading]);
}

/**
 * Convenience hook specifically for notes permissions
 */
export function useNotesPermissions() {
  return useFeaturePermissions({
    view: Permission.VIEW_NOTE,
    create: Permission.CREATE_NOTE,
    update: Permission.UPDATE_NOTE,
    delete: Permission.DELETE_NOTE
  });
}

/**
 * Convenience hook specifically for team permissions
 * 
 * AI INSTRUCTIONS:
 * - Use for team-level operations (create/update/delete teams)
 * - Separate from team member permissions for granular control
 * - Follow fail-secure pattern (false during loading)
 */
export function useTeamPermissions() {
  return useFeaturePermissions({
    view: Permission.VIEW_TEAM,
    create: Permission.CREATE_TEAM,
    update: Permission.UPDATE_TEAM,
    delete: Permission.DELETE_TEAM,
    manage: Permission.MANAGE_TEAMS
  });
}

/**
 * Convenience hook specifically for team member permissions
 * 
 * AI INSTRUCTIONS:
 * - Use for team member operations (add/edit/remove members)
 * - Most common team management use case
 * - Includes join permission for self-service team joining
 */
export function useTeamMemberPermissions() {
  const basePermissions = useFeaturePermissions({
    view: Permission.VIEW_TEAM_MEMBER,
    create: Permission.CREATE_TEAM_MEMBER,
    update: Permission.UPDATE_TEAM_MEMBER,
    delete: Permission.DELETE_TEAM_MEMBER
  });
  
  const { hasPermission, isLoading } = usePermissions();
  
  return useMemo(() => ({
    ...basePermissions,
    canJoin: hasPermission(Permission.JOIN_TEAM),
    isLoading
  }), [basePermissions, hasPermission, isLoading]);
}