/**
 * Server-Side Feature Access Control
 * 
 * AI INSTRUCTIONS:
 * - Server-side equivalent of useFeatureAccess hook
 * - Combines feature flag checking with role/permission validation
 * - Used in server actions and API routes
 * - Throws errors for access denial (fail-secure)
 * - Single responsibility: server-side access control
 */

import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/auth/roles';

export interface ServerFeatureAccessOptions {
  featureName: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireOrganization?: boolean;
  defaultEnabled?: boolean; // AI: Allow features to default to enabled when flag is missing
}

export interface ServerFeatureAccessResult {
  organizationId: string;
  userId: string;
  userRole: UserRole | undefined;
}

/**
 * Check feature access on the server side
 * @param options - Feature access configuration
 * @returns Access result with organizationId and userId guaranteed
 * @throws Error if access is denied
 */
export async function checkFeatureAccess({
  featureName,
  requiredRoles = [],
  requiredPermissions = [],
  requireOrganization = true,
  defaultEnabled = true // AI: All features default to enabled when flag is missing
}: ServerFeatureAccessOptions): Promise<ServerFeatureAccessResult> {
  const supabase = createClient();
  
  // AI: Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }
  
  // AI: Check organization requirement
  let organizationId: string | null = null;
  if (requireOrganization) {
    organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      throw new Error('Organization access required');
    }
  }
  
  // AI: Check feature flag
  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', organizationId)
      .single();
    
    // AI: Universal rule - all features default to enabled when flag is missing
    const isFeatureEnabled = org?.feature_flags?.[featureName] ?? defaultEnabled;
    if (!isFeatureEnabled) {
      throw new Error(`Feature '${featureName}' is not enabled for this organization`);
    }
  }
  
  // AI: Get user role from database (organization-specific)
  let userRole: UserRole | undefined = undefined;
  if (organizationId) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();
    
    userRole = membership?.role as UserRole | undefined;
  }
  
  // AI: Check role requirements
  if (requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new Error(`Insufficient permissions: requires one of [${requiredRoles.join(', ')}]`);
    }
  }
  
  // AI: Check permission requirements
  if (requiredPermissions.length > 0) {
    if (!userRole) {
      throw new Error(`No role found for user in organization`);
    }
    
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasRequiredPermissions = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermissions) {
      throw new Error(`Insufficient permissions: requires one of [${requiredPermissions.join(', ')}]`);
    }
  }
  
  // AI: All checks passed
  return {
    organizationId: organizationId!,
    userId: user.id,
    userRole
  };
}

/**
 * Convenience function for common DAM feature access
 */
export const checkDamAccess = (requiredPermissions?: Permission[]) =>
  checkFeatureAccess({
    featureName: 'dam',
    requiredPermissions,
    requireOrganization: true
  });

/**
 * Convenience function for common Chatbot feature access
 */
export const checkChatbotAccess = (requiredPermissions?: Permission[]) =>
  checkFeatureAccess({
    featureName: 'chatbot_widget',
    requiredPermissions,
    requireOrganization: true
  });

/**
 * Convenience function for common TTS feature access
 */
export const checkTtsAccess = (requiredPermissions?: Permission[]) =>
  checkFeatureAccess({
    featureName: 'tts',
    requiredPermissions,
    requireOrganization: true
  });

/**
 * Convenience function for common Notes feature access
 */
export const checkNotesAccess = (requiredPermissions?: Permission[]) =>
  checkFeatureAccess({
    featureName: 'notes',
    requiredPermissions,
    requireOrganization: true
  }); 

/**
 * Convenience function for Team Management feature access
 */
export const checkTeamAccess = (requiredPermissions?: Permission[]) =>
  checkFeatureAccess({
    featureName: 'team_management',
    requiredPermissions,
    requireOrganization: true
  });

/**
 * Check access for team member operations
 */
export const checkTeamMemberAccess = (requiredPermissions?: Permission[]) =>
  checkTeamAccess(requiredPermissions);

/**
 * Check if user can create team members
 */
export const checkCreateTeamMemberAccess = () =>
  checkTeamAccess([Permission.CREATE_TEAM_MEMBER]);

/**
 * Check if user can update team members
 */
export const checkUpdateTeamMemberAccess = () =>
  checkTeamAccess([Permission.UPDATE_TEAM_MEMBER]);

/**
 * Check if user can delete team members
 */
export const checkDeleteTeamMemberAccess = () =>
  checkTeamAccess([Permission.DELETE_TEAM_MEMBER]);

/**
 * Check if user can view team members
 */
export const checkViewTeamMemberAccess = () =>
  checkTeamAccess([Permission.VIEW_TEAM_MEMBER]);

/**
 * Check if user can create teams
 */
export const checkCreateTeamAccess = () =>
  checkTeamAccess([Permission.CREATE_TEAM]);

/**
 * Check if user can update teams
 */
export const checkUpdateTeamAccess = () =>
  checkTeamAccess([Permission.UPDATE_TEAM]);

/**
 * Check if user can delete teams
 */
export const checkDeleteTeamAccess = () =>
  checkTeamAccess([Permission.DELETE_TEAM]);

/**
 * Check if user can view teams
 */
export const checkViewTeamAccess = () =>
  checkTeamAccess([Permission.VIEW_TEAM]);