/**
 * Enhanced authentication middleware with role and permission-based checks
 * 
 * This middleware provides a wrapper for API routes and server components
 * that enforces authentication, role checks, and permission verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { checkAuth } from '@/lib/supabase/db-auth';
import { AuthorizationError } from '@/lib/errors/base';
import { Permission, UserRole } from './roles';
import { hasRole, hasPermission, hasAnyRole, hasAnyPermission } from './authorization';
import { logger } from '@/lib/logging';

export type AuthenticatedHandler = (
  req: NextRequest,
  user: User,
  supabase: SupabaseClient
) => Promise<NextResponse>;

export type AuthOptions = {
  requireAuth: boolean;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  anyPermission?: boolean; // If true, user must have ANY of the required permissions, otherwise must have ALL
  unauthorizedMessage?: string;
  forbiddenMessage?: string;
};

const defaultOptions: AuthOptions = {
  requireAuth: true,
  anyPermission: false,
  unauthorizedMessage: 'Authentication required',
  forbiddenMessage: 'Insufficient permissions',
};

/**
 * Higher-order function that wraps an API route handler with authentication
 * and authorization checks
 * 
 * @param handler The handler function to wrap
 * @param options Authentication and authorization options
 * @returns A wrapped handler with auth checks
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: Partial<AuthOptions> = {}
) {
  const opts = { ...defaultOptions, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    // Create Supabase client
    const supabase = createClient();

    // Skip auth check if not required
    if (!opts.requireAuth) {
      return handler(req, null as unknown as User, supabase);
    }

    // Verify authentication
    const { authenticated, user, error } = await checkAuth(supabase);

    // Handle authentication failure
    if (!authenticated || !user) {
      logger.warn({
        message: 'Authentication failed',
        context: { error: error?.message || 'No user found', path: req.nextUrl.pathname }
      });
      
      return NextResponse.json(
        { error: opts.unauthorizedMessage }, 
        { status: 401 }
      );
    }

    try {
      // Single role check
      if (opts.requiredRole && !hasRole(user, opts.requiredRole)) {
        throw new AuthorizationError(`Requires role: ${opts.requiredRole}`);
      }
      
      // Multiple roles check (any of the specified roles)
      if (opts.requiredRoles?.length && !hasAnyRole(user, opts.requiredRoles)) {
        throw new AuthorizationError(`Requires one of roles: ${opts.requiredRoles.join(', ')}`);
      }
      
      // Single permission check
      if (opts.requiredPermission && !hasPermission(user, opts.requiredPermission)) {
        throw new AuthorizationError(`Requires permission: ${opts.requiredPermission}`);
      }
      
      // Multiple permissions check
      if (opts.requiredPermissions?.length) {
        const hasRequiredPermissions = opts.anyPermission 
          ? hasAnyPermission(user, opts.requiredPermissions)
          : opts.requiredPermissions.every(p => hasPermission(user, p));
          
        if (!hasRequiredPermissions) {
          const verb = opts.anyPermission ? 'any of' : 'all';
          throw new AuthorizationError(`Requires ${verb} permissions: ${opts.requiredPermissions.join(', ')}`);
        }
      }
      
      // If we've made it here, the user is authenticated and authorized
      return handler(req, user, supabase);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logger.warn({
          message: `Authorization failed for user ${user.id}`,
          context: { 
            error: error.message,
            userId: user.id,
            path: req.nextUrl.pathname,
            requiredRole: opts.requiredRole,
            requiredRoles: opts.requiredRoles,
            requiredPermission: opts.requiredPermission,
            requiredPermissions: opts.requiredPermissions,
          }
        });
        
        return NextResponse.json(
          { error: opts.forbiddenMessage || error.message },
          { status: 403 }
        );
      }
      
      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  };
} 