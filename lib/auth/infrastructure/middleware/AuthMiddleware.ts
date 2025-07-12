/**
 * Enhanced authentication middleware with role and permission-based checks
 * Infrastructure Layer Implementation
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure layer component for API route authentication
 * - Uses dependency injection through composition root
 * - Transforms infrastructure errors to domain errors
 * - Maintains all existing functionality with proper DDD structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { checkAuth } from '@/lib/supabase/db-auth';
import { AuthorizationError } from '@/lib/errors/base';
import { Permission, UserRole } from '../../index';
import { hasRole, hasPermission, hasAnyRole, hasAnyPermission } from '../../index';
import { logger } from '@/lib/logging';
import { AuthCompositionRoot } from '../composition/AuthCompositionRoot';
import { InsufficientPermissionsError, InvalidCredentialsError, AuthDomainError } from '../../domain/errors/AuthDomainError';

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
 * Auth Middleware Service - Infrastructure Implementation
 * 
 * AI INSTRUCTIONS:
 * - Uses dependency injection through composition root
 * - Handles authentication and authorization for API routes
 * - Transforms infrastructure errors to domain errors
 * - Maintains backward compatibility with existing middleware
 */
export class AuthMiddleware {
  constructor(
    private compositionRoot: AuthCompositionRoot = AuthCompositionRoot.getInstance()
  ) {}

  /**
   * Higher-order function that wraps an API route handler with authentication
   * and authorization checks
   */
  withAuth(
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

      try {
        // Verify authentication
        const { authenticated, user, error } = await checkAuth(supabase);

        // Handle authentication failure
        if (!authenticated || !user) {
          logger.warn({
            message: 'Authentication failed',
            context: { error: error?.message || 'No user found', path: req.nextUrl.pathname }
          });
          
          throw new InvalidCredentialsError({
            path: req.nextUrl.pathname,
            reason: error?.message || 'No user found'
          });
        }

        // Authorization checks
        await this.performAuthorizationChecks(user, opts);
        
        // If we've made it here, the user is authenticated and authorized
        return handler(req, user, supabase);
      } catch (error) {
        return this.handleAuthError(error, req, opts);
      }
    };
  }

  /**
   * Perform authorization checks based on options
   */
  private async performAuthorizationChecks(user: User, opts: AuthOptions): Promise<void> {
    // Single role check
    if (opts.requiredRole && !hasRole(user, opts.requiredRole)) {
      throw new InsufficientPermissionsError(
        `Requires role: ${opts.requiredRole}`,
        { userId: user.id, requiredRole: opts.requiredRole }
      );
    }
    
    // Multiple roles check (any of the specified roles)
    if (opts.requiredRoles?.length && !hasAnyRole(user, opts.requiredRoles)) {
      throw new InsufficientPermissionsError(
        `Requires one of roles: ${opts.requiredRoles.join(', ')}`,
        { userId: user.id, requiredRoles: opts.requiredRoles }
      );
    }
    
    // Single permission check
    if (opts.requiredPermission && !hasPermission(user, opts.requiredPermission)) {
      throw new InsufficientPermissionsError(
        `Requires permission: ${opts.requiredPermission}`,
        { userId: user.id, requiredPermission: opts.requiredPermission }
      );
    }
    
    // Multiple permissions check
    if (opts.requiredPermissions?.length) {
      const hasRequiredPermissions = opts.anyPermission 
        ? hasAnyPermission(user, opts.requiredPermissions)
        : opts.requiredPermissions.every(p => hasPermission(user, p));
        
      if (!hasRequiredPermissions) {
        const verb = opts.anyPermission ? 'any of' : 'all';
        throw new InsufficientPermissionsError(
          `Requires ${verb} permissions: ${opts.requiredPermissions.join(', ')}`,
          { 
            userId: user.id, 
            requiredPermissions: opts.requiredPermissions,
            anyPermission: opts.anyPermission 
          }
        );
      }
    }
  }

  /**
   * Handle authentication and authorization errors
   */
  private handleAuthError(error: unknown, req: NextRequest, opts: AuthOptions): NextResponse {
    if (error instanceof AuthDomainError) {
      const statusCode = this.getStatusCodeForError(error);
      const message = this.getMessageForError(error, opts);
      
      logger.warn({
        message: `Auth middleware error: ${error.code}`,
        context: { 
          error: error.message,
          path: req.nextUrl.pathname,
          code: error.code,
          severity: error.severity
        }
      });
      
      return NextResponse.json(
        { error: message },
        { status: statusCode }
      );
    }
    
    if (error instanceof AuthorizationError) {
      logger.warn({
        message: `Authorization failed`,
        context: { 
          error: error.message,
          path: req.nextUrl.pathname
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

  /**
   * Get appropriate HTTP status code for domain errors
   */
  private getStatusCodeForError(error: AuthDomainError): number {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
      case 'SESSION_EXPIRED':
        return 401;
      case 'INSUFFICIENT_PERMISSIONS':
        return 403;
      case 'USER_NOT_FOUND':
      case 'ORGANIZATION_NOT_FOUND':
        return 404;
      default:
        return 400;
    }
  }

  /**
   * Get appropriate error message for domain errors
   */
  private getMessageForError(error: AuthDomainError, opts: AuthOptions): string {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
      case 'SESSION_EXPIRED':
        return opts.unauthorizedMessage || error.message;
      case 'INSUFFICIENT_PERMISSIONS':
        return opts.forbiddenMessage || error.message;
      default:
        return error.message;
    }
  }
}

// Singleton instance for backward compatibility
const authMiddlewareInstance = new AuthMiddleware();

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
  return authMiddlewareInstance.withAuth(handler, options);
} 