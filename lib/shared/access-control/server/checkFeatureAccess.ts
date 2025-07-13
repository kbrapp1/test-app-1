/**
 * Feature Access Control - Optimized with Global Authentication Service
 * 
 * AI INSTRUCTIONS:
 * - Uses GlobalAuthenticationService for cached user validation
 * - Eliminates redundant supabase.auth.getUser() calls
 * - Maintains all existing functionality with performance improvements
 * - Single responsibility: Feature access validation
 */

import { createClient } from '@/lib/supabase/server';
import { getGlobalAuthenticationService } from '@/lib/auth';

export interface FeatureAccessResult {
  hasAccess: boolean;
  user?: any;
  organizationId?: string;
  error?: string;
}

export interface FeatureAccessOptions {
  requireAuth?: boolean;
  requireOrganization?: boolean;
  customValidation?: (user: any, organizationId?: string) => Promise<boolean>;
}

/**
 * Check if user has access to a specific feature
 * Uses cached validation to prevent redundant auth calls
 */
export async function checkFeatureAccess(
  featureName: string,
  options: FeatureAccessOptions = {}
): Promise<FeatureAccessResult> {
  const { requireAuth = true, requireOrganization = true, customValidation } = options;

  try {
    let user = null;
    let organizationId = null;

    // Check authentication if required
    if (requireAuth) {
      // Use cached validation instead of direct supabase.auth.getUser()
      const globalAuth = getGlobalAuthenticationService();
      const authResult = await globalAuth.getAuthenticatedUser();
      
      if (!authResult.isValid || !authResult.user) {
        return {
          hasAccess: false,
          error: 'Authentication required',
        };
      }
      
      user = authResult.user;
    }

    // Check organization context if required
    if (requireOrganization && user) {
      const supabase = createClient();
      const { data: orgId, error: orgError } = await supabase
        .rpc('get_active_organization_id');
      
      if (orgError || !orgId) {
        return {
          hasAccess: false,
          user,
          error: 'Organization context required',
        };
      }
      
      organizationId = orgId;
    }

    // Check feature flag
    const hasFeatureAccess = await checkFeatureFlag(featureName, organizationId);
    if (!hasFeatureAccess) {
      return {
        hasAccess: false,
        user,
        organizationId,
        error: `Feature '${featureName}' is not enabled`,
      };
    }

    // Run custom validation if provided
    if (customValidation) {
      try {
        const isValid = await customValidation(user, organizationId);
        if (!isValid) {
          return {
            hasAccess: false,
            user,
            organizationId,
            error: 'Custom validation failed',
          };
        }
      } catch (validationError) {
        // Handle validation errors (like permission errors)
        return {
          hasAccess: false,
          user,
          organizationId,
          error: validationError instanceof Error ? validationError.message : 'Custom validation failed',
        };
      }
    }

    return {
      hasAccess: true,
      user,
      organizationId,
    };

  } catch (error) {
    console.error('Feature access check error:', error);
    return {
      hasAccess: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check TTS feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_TTS
 */
export async function checkTtsAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('tts', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_TTS permission
      const { hasPermission, Permission } = await import('@/lib/auth');
      const hasViewTtsPermission = await hasPermission(user.id, Permission.VIEW_TTS);
      
      if (!hasViewTtsPermission) {
        throw new Error('Insufficient permissions: [view:tts] required');
      }
      
      return true;
    }
  });
}

/**
 * Check DAM feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_ASSET
 */
export async function checkDamAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('dam', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_ASSET permission (DAM uses asset permissions)
      const { hasPermission, Permission } = await import('@/lib/auth');
      const hasViewAssetPermission = await hasPermission(user.id, Permission.VIEW_ASSET);
      
      if (!hasViewAssetPermission) {
        throw new Error('Insufficient permissions: [view:asset] required');
      }
      
      return true;
    }
  });
}

/**
 * Check image generation feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_IMAGE_GENERATOR
 */
export async function checkImageGenAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('image-generator', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_IMAGE_GENERATOR permission
      const { hasPermission, Permission } = await import('@/lib/auth');
      const hasViewImageGenPermission = await hasPermission(user.id, Permission.VIEW_IMAGE_GENERATOR);
      
      if (!hasViewImageGenPermission) {
        throw new Error('Insufficient permissions: [view:image-generator] required');
      }
      
      return true;
    }
  });
}

/**
 * Check chatbot widget feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_CHATBOT
 */
export async function checkChatbotAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('chatbot-widget', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_CHATBOT permission
      const { hasPermission, Permission } = await import('@/lib/auth');
      const hasViewChatbotPermission = await hasPermission(user.id, Permission.VIEW_CHATBOT);
      
      if (!hasViewChatbotPermission) {
        throw new Error('Insufficient permissions: [view:chatbot] required');
      }
      
      return true;
    }
  });
}

/**
 * Check notes feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_NOTE
 */
export async function checkNotesAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('notes', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_NOTE permission with super admin bypass
      const { hasPermissionWithSuperAdminCheck, Permission } = await import('@/lib/auth');
      const hasViewNotePermission = await hasPermissionWithSuperAdminCheck(user, Permission.VIEW_NOTE);
      
      if (!hasViewNotePermission) {
        throw new Error('Insufficient permissions: [view:note] required');
      }
      
      return true;
    }
  });
}

/**
 * Check team management feature access specifically
 * Uses cached validation to prevent redundant auth calls
 * Includes permission validation for VIEW_TEAM_MEMBER
 */
export async function checkTeamAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('team', {
    requireAuth: true,
    requireOrganization: true,
    customValidation: async (user, organizationId) => {
      // Check if user has VIEW_TEAM_MEMBER permission
      const { hasPermission, Permission } = await import('@/lib/auth');
      const hasViewTeamPermission = await hasPermission(user.id, Permission.VIEW_TEAM_MEMBER);
      
      if (!hasViewTeamPermission) {
        throw new Error('Insufficient permissions: [view:team-member] required');
      }
      
      return true;
    }
  });
}

// Private helper function
async function checkFeatureFlag(featureName: string, organizationId?: string): Promise<boolean> {
  if (!organizationId) {
    return false;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('organization_feature_flags')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('feature_name', featureName)
      .single();

    if (error) {
      // If no feature flag exists, default to enabled (as per golden rule)
      return true;
    }

    return data?.enabled ?? true;
  } catch (error) {
    console.error('Feature flag check error:', error);
    // Default to enabled on error (as per golden rule)
    return true;
  }
}