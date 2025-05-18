import { createClient } from '@/lib/supabase/server';
import { AuthorizationError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';
import { Permission, UserRole } from '@/lib/auth/roles';
import { hasRole, hasPermission, hasAnyRole, hasAnyPermission } from '@/lib/auth/authorization';

export type AuthActionOptions = {
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  anyPermission?: boolean;
};

export function withAuthAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: AuthActionOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const supabase = createClient();
    
    try {
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
      
      if (options.requiredRole && !hasRole(user, options.requiredRole)) {
        throw new AuthorizationError(`Requires role: ${options.requiredRole}`);
      }
      
      if (options.requiredRoles?.length && !hasAnyRole(user, options.requiredRoles)) {
        throw new AuthorizationError(
          `Requires one of roles: ${options.requiredRoles.join(', ')}`
        );
      }
      
      if (options.requiredPermission && !hasPermission(user, options.requiredPermission)) {
        throw new AuthorizationError(`Requires permission: ${options.requiredPermission}`);
      }
      
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
      return await action(...args);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw error;
    }
  }) as T;
} 