/**
 * Enhanced hook for user authentication and authorization in client components
 * 
 * Provides access to the current user, loading state, and authorization helpers
 * for checking roles and permissions in React components.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole, Permission } from '@/lib/auth/roles';
import { 
  hasRole, 
  hasPermission, 
  hasAnyRole,
  hasAnyPermission, 
  getUserPermissions 
} from '@/lib/auth/authorization';

export type AuthHelpers = {
  // Role checks
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // User's role and permissions
  role: UserRole | undefined;
  permissions: Permission[];
  
  // Convenience properties for common roles
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // Memoized auth helpers that update when the user changes
  const auth = useMemo<AuthHelpers>(() => ({
    // Role checks
    hasRole: (role: UserRole) => hasRole(user, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
    
    // Permission checks
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => 
      permissions.every(permission => hasPermission(user, permission)),
    
    // User's role and permissions
    role: user?.app_metadata?.role as UserRole | undefined,
    permissions: getUserPermissions(user),
    
    // Convenience properties for common roles
    isAdmin: hasRole(user, UserRole.ADMIN),
    isEditor: hasRole(user, UserRole.EDITOR),
    isViewer: hasRole(user, UserRole.VIEWER),
  }), [user]);

  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return { user, isLoading, auth };
} 