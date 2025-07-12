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
import { GlobalAuthenticationService } from '@/lib/shared/infrastructure/GlobalAuthenticationService';

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
      const globalAuth = GlobalAuthenticationService.getInstance();
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
      const isValid = await customValidation(user, organizationId);
      if (!isValid) {
        return {
          hasAccess: false,
          user,
          organizationId,
          error: 'Custom validation failed',
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
 */
export async function checkTtsAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('tts', {
    requireAuth: true,
    requireOrganization: true,
  });
}

/**
 * Check DAM feature access specifically
 * Uses cached validation to prevent redundant auth calls
 */
export async function checkDamAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('dam', {
    requireAuth: true,
    requireOrganization: true,
  });
}

/**
 * Check image generation feature access specifically
 * Uses cached validation to prevent redundant auth calls
 */
export async function checkImageGenAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('image-generator', {
    requireAuth: true,
    requireOrganization: true,
  });
}

/**
 * Check chatbot widget feature access specifically
 * Uses cached validation to prevent redundant auth calls
 */
export async function checkChatbotAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('chatbot-widget', {
    requireAuth: true,
    requireOrganization: true,
  });
}

/**
 * Check notes feature access specifically
 * Uses cached validation to prevent redundant auth calls
 */
export async function checkNotesAccess(): Promise<FeatureAccessResult> {
  return checkFeatureAccess('notes', {
    requireAuth: true,
    requireOrganization: true,
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