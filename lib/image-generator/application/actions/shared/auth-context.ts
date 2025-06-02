import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient } from '@/lib/supabase/server';

/**
 * Authentication context for image generation actions
 * Single responsibility: Handle user authentication and organization validation
 */
export interface AuthContext {
  userId: string;
  organizationId: string;
}

export interface AuthContextResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
}

/**
 * Get authenticated user context with organization
 * Reusable across all actions requiring authentication
 */
export async function getAuthContext(): Promise<AuthContextResult> {
  try {
    // Get authentication context
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found' };
    }

    return {
      success: true,
      context: {
        userId: user.id,
        organizationId
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
} 