/**
 * Auth Action Wrapper - Optimized with Global Authentication Service
 * 
 * AI INSTRUCTIONS:
 * - Uses GlobalAuthenticationService for cached user validation
 * - Eliminates redundant supabase.auth.getUser() calls
 * - Maintains all existing functionality with performance improvements
 * - Single responsibility: Server action authentication wrapper
 */

import { createClient } from '@/lib/supabase/server';
import { GlobalAuthenticationService } from '@/lib/shared/infrastructure/GlobalAuthenticationService';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface AuthActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AuthenticatedUser;
}

/**
 * Wrapper for server actions that require authentication
 * Uses cached validation to prevent redundant auth calls
 */
export async function withAuth<T>(
  action: (user: AuthenticatedUser) => Promise<T>
): Promise<AuthActionResult<T>> {
  try {
    // Use cached validation instead of direct supabase.auth.getUser()
    const globalAuth = GlobalAuthenticationService.getInstance();
    const authResult = await globalAuth.getAuthenticatedUser();
    
    if (!authResult.isValid || !authResult.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Execute the action with authenticated user
    const result = await action(authResult.user);
    
    return {
      success: true,
      data: result,
      user: authResult.user,
    };
  } catch (error) {
    console.error('Auth action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wrapper for server actions that require authentication and organization context
 * Uses cached validation to prevent redundant auth calls
 */
export async function withAuthAndOrg<T>(
  action: (user: AuthenticatedUser, organizationId: string) => Promise<T>
): Promise<AuthActionResult<T>> {
  try {
    // Use cached validation
    const globalAuth = GlobalAuthenticationService.getInstance();
    const authResult = await globalAuth.getAuthenticatedUser();
    
    if (!authResult.isValid || !authResult.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get organization context
    const supabase = createClient();
    const { data: organizationId, error: orgError } = await supabase
      .rpc('get_active_organization_id');
    
    if (orgError || !organizationId) {
      return {
        success: false,
        error: 'Organization context required',
      };
    }

    // Execute the action with authenticated user and organization
    const result = await action(authResult.user, organizationId);
    
    return {
      success: true,
      data: result,
      user: authResult.user,
    };
  } catch (error) {
    console.error('Auth + org action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current authenticated user with caching
 * Replaces direct supabase.auth.getUser() calls
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const globalAuth = GlobalAuthenticationService.getInstance();
    const authResult = await globalAuth.getAuthenticatedUser();
    
    return authResult.isValid ? authResult.user : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated with caching
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const globalAuth = GlobalAuthenticationService.getInstance();
    const authResult = await globalAuth.getAuthenticatedUser();
    
    return authResult.isValid;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
} 