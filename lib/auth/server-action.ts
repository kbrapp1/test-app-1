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