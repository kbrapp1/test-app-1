/**
 * Auth Action Wrapper - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure layer component for server action authentication
 * - Uses dependency injection instead of singletons
 * - Maintains all existing functionality with proper DDD structure
 * - Single responsibility: Server action authentication wrapper
 */

import { createClient } from '@/lib/supabase/server';
import { getGlobalAuthenticationService } from '../composition/AuthCompositionRoot';
import { AuthCompositionRoot } from '../composition/AuthCompositionRoot';
import { AuthDomainError } from '../../domain/errors/AuthDomainError';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AuthenticatedUser;
}

/**
 * Action Wrapper Service - Infrastructure Implementation
 * 
 * AI INSTRUCTIONS:
 * - Uses dependency injection through composition root
 * - Handles authentication and organization context
 * - Transforms infrastructure errors to domain errors
 * - Maintains backward compatibility with existing server actions
 */
export class ActionWrapper {
  constructor(
    private globalAuth = getGlobalAuthenticationService(),
    private compositionRoot: AuthCompositionRoot = AuthCompositionRoot.getInstance()
  ) {}

  /**
   * Wrapper for server actions that require authentication
   * Uses cached validation to prevent redundant auth calls
   */
  async withAuth<T>(
    action: (user: AuthenticatedUser) => Promise<T>
  ): Promise<AuthActionResult<T>> {
    try {
      // Use cached validation instead of direct supabase.auth.getUser()
      const authResult = await this.globalAuth.getAuthenticatedUser();
      
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
      // Transform infrastructure errors to domain errors
      if (error instanceof AuthDomainError) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      // Log unexpected errors but don't expose details
      console.error('Auth action error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Wrapper for server actions that require authentication and organization context
   * Uses cached validation to prevent redundant auth calls
   */
  async withAuthAndOrg<T>(
    action: (user: AuthenticatedUser, organizationId: string) => Promise<T>
  ): Promise<AuthActionResult<T>> {
    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUser();
      
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
      // Transform infrastructure errors to domain errors
      if (error instanceof AuthDomainError) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      console.error('Auth + org action error:', error);
      return {
        success: false,
        error: 'Authentication or organization context failed',
      };
    }
  }

  /**
   * Get current authenticated user with caching
   * Replaces direct supabase.auth.getUser() calls
   */
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const authResult = await this.globalAuth.getAuthenticatedUser();
      return authResult.isValid ? authResult.user : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated with caching
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const authResult = await this.globalAuth.getAuthenticatedUser();
      return authResult.isValid;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }
}

// Singleton instance for backward compatibility
const actionWrapperInstance = new ActionWrapper();

/**
 * Wrapper for server actions that require authentication
 * Uses cached validation to prevent redundant auth calls
 */
export async function withAuth<T>(
  action: (user: AuthenticatedUser) => Promise<T>
): Promise<AuthActionResult<T>> {
  return actionWrapperInstance.withAuth(action);
}

/**
 * Wrapper for server actions that require authentication and organization context
 * Uses cached validation to prevent redundant auth calls
 */
export async function withAuthAndOrg<T>(
  action: (user: AuthenticatedUser, organizationId: string) => Promise<T>
): Promise<AuthActionResult<T>> {
  return actionWrapperInstance.withAuthAndOrg(action);
}

/**
 * Get current authenticated user with caching
 * Replaces direct supabase.auth.getUser() calls
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  return actionWrapperInstance.getCurrentUser();
}

/**
 * Check if user is authenticated with caching
 */
export async function isAuthenticated(): Promise<boolean> {
  return actionWrapperInstance.isAuthenticated();
} 