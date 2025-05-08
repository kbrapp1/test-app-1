/**
 * Authorization wrappers for Server Actions
 * 
 * This module provides utilities for adding authentication and authorization
 * checks to server actions, with consistent error handling and logging.
 */

import { createClient } from '@/lib/supabase/server';
import { AuthorizationError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';
import { Permission, UserRole } from './roles';
import { hasRole, hasPermission, hasAnyRole, hasAnyPermission } from './authorization';
import { jwtDecode } from 'jwt-decode';

export type AuthActionOptions = {
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  anyPermission?: boolean;
};

/**
 * Wraps a server action with authentication and authorization checks
 * 
 * @param action The server action to wrap
 * @param options Authorization options
 * @returns The wrapped server action
 */
export function withAuthAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: AuthActionOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const supabase = createClient();
    
    try {
      // Check if the user is authenticated
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        logger.warn({
          message: 'Server action authentication failed',
          context: { 
            error: error?.message || 'No user found',
            action: action.name || 'unnamed action'
          }
        });
        
        throw new AuthorizationError('Authentication required');
      }
      
      // Single role check
      if (options.requiredRole && !hasRole(user, options.requiredRole)) {
        throw new AuthorizationError(`Requires role: ${options.requiredRole}`);
      }
      
      // Multiple roles check (any of the specified roles)
      if (options.requiredRoles?.length && !hasAnyRole(user, options.requiredRoles)) {
        throw new AuthorizationError(
          `Requires one of roles: ${options.requiredRoles.join(', ')}`
        );
      }
      
      // Single permission check
      if (options.requiredPermission && !hasPermission(user, options.requiredPermission)) {
        throw new AuthorizationError(`Requires permission: ${options.requiredPermission}`);
      }
      
      // Multiple permissions check
      if (options.requiredPermissions?.length) {
        const hasRequiredPermissions = options.anyPermission 
          ? hasAnyPermission(user, options.requiredPermissions)
          : options.requiredPermissions.every(p => hasPermission(user, p));
          
        if (!hasRequiredPermissions) {
          const verb = options.anyPermission ? 'any of' : 'all';
          throw new AuthorizationError(
            `Requires ${verb} permissions: ${options.requiredPermissions.join(', ')}`
          );
        }
      }
      
      // User is authenticated and authorized, execute the action
      return await action(...args);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        // Let the error middleware handle this
        throw error;
      }
      
      // Re-throw other errors
      throw error;
    }
  }) as T;
}

/**
 * Utility to get the current user in a server action
 * 
 * @returns The current user or null if not authenticated
 */
export async function getSessionUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error };
  }
  
  return { user, error: null };
}

// Keep the existing type definitions if they are used elsewhere, or define locally if specific to this function
interface DecodedAccessToken {
  exp?: number; // Standard claim, optional
  sub?: string; // Standard claim, optional
  // Add other standard claims you might expect, all optional
  custom_claims?: { // This structure comes from your Edge Function
    active_organization_id?: string;
  };
  // Example if active_organization_id was at the root of claims (not your case based on Edge Fn log)
  // active_organization_id?: string; 
}

/**
 * Retrieves the active organization ID from the user's JWT custom claims.
 * This is intended for use in server-side logic (Server Actions, Route Handlers, Server Components).
 * 
 * @returns The active organization ID (UUID string) or null if not found or user is not authenticated.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    // console.error('GetActiveOrganizationId: Supabase session error or no session', sessionError);
    // Removed previous console.log for user.app_metadata as we now decode token
    return null;
  }

  if (!session.access_token) {
    // console.warn('GetActiveOrganizationId: No access_token in session.');
    return null;
  }

  try {
    // Decode the access token to get the claims
    const decodedToken = jwtDecode<DecodedAccessToken>(session.access_token);
    
    // console.log('GetActiveOrganizationId: Decoded JWT:', JSON.stringify(decodedToken, null, 2));

    // Access the claim based on your Edge Function's structure from the JWT
    const activeOrgId = decodedToken.custom_claims?.active_organization_id;

    if (!activeOrgId) {
      // console.warn('GetActiveOrganizationId: active_organization_id NOT FOUND in decoded JWT custom_claims.');
      return null;
    }

    if (typeof activeOrgId === 'string' && activeOrgId.length > 0) {
      // console.log('GetActiveOrganizationId: Successfully retrieved active_organization_id from JWT:', activeOrgId);
      return activeOrgId;
    } else {
      // console.warn('GetActiveOrganizationId: Retrieved active_organization_id from JWT was not a valid string:', activeOrgId);
      return null;
    }
  } catch (e) {
    // console.error('GetActiveOrganizationId: Error decoding JWT or accessing claims:', e);
    return null;
  }
} 