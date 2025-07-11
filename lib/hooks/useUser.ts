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
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/auth/roles';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

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
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  
  // AI: Fetch user's role from database when user or organization changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(undefined);
        return;
      }

      setIsRoleLoading(true);
      try {
        // AI: Get active organization ID from JWT claims
        const { data: orgData } = await supabase.rpc('get_active_organization_id');
        
        if (orgData) {
          // AI: Fetch user's role in the active organization
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', orgData)
            .single();
          
          setUserRole(membership?.role as UserRole | undefined);
        } else {
          setUserRole(undefined);
        }
      } catch (error) {
        console.warn('Failed to fetch user role:', error);
        setUserRole(undefined);
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, supabase]);
  
  // AI: Memoized auth helpers that update when user or role changes
  const auth = useMemo<AuthHelpers>(() => {
    // AI: Create permission checking functions based on database role
    const hasRoleCheck = (role: UserRole) => userRole === role;
    const hasAnyRoleCheck = (roles: UserRole[]) => userRole ? roles.includes(userRole) : false;
    
    const hasPermissionCheck = (permission: Permission) => {
      if (!userRole) return false;
      const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
      return rolePermissions.includes(permission);
    };
    
    const hasAnyPermissionCheck = (permissions: Permission[]) => {
      if (!userRole) return false;
      const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
      return permissions.some(permission => rolePermissions.includes(permission));
    };
    
    const hasAllPermissionsCheck = (permissions: Permission[]) => {
      if (!userRole) return false;
      const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
      return permissions.every(permission => rolePermissions.includes(permission));
    };
    
    const userPermissions = userRole ? ROLE_PERMISSIONS[userRole] || [] : [];
    
    return {
      // Role checks
      hasRole: hasRoleCheck,
      hasAnyRole: hasAnyRoleCheck,
      
      // Permission checks
      hasPermission: hasPermissionCheck,
      hasAnyPermission: hasAnyPermissionCheck,
      hasAllPermissions: hasAllPermissionsCheck,
      
      // User's role and permissions
      role: userRole,
      permissions: userPermissions,
      
      // Convenience properties for common roles
      isAdmin: hasRoleCheck(UserRole.ADMIN),
      isEditor: hasRoleCheck(UserRole.EDITOR),
      isViewer: hasRoleCheck(UserRole.VIEWER),
    };
  }, [user, userRole]);

  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;

    // Reusable sign-out handler with toast notification and redirect
    const handleSignOut = async (reason: string) => {
      if (!isMounted) return;
      
      toast({
        title: "Session Ended",
        description: reason,
        variant: "destructive",
      });

      // Clear state immediately to prevent hook errors
      if (isMounted) {
        setUser(null);
        setUserRole(undefined);
        setIsLoading(false);
        setIsRoleLoading(false);
      }

      // Cleanup any pending operations
      if (cleanup) {
        cleanup();
      }

      // Redirect immediately
      router.push('/login'); 

      // Still attempt sign out, but don't wait for it
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Silent fail - we've already cleared state and redirected
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      const user = session?.user ?? null;
      setUser(user);
      setIsLoading(false);
      
      // If user becomes null (logout), trigger cleanup
      if (!user && _event === 'SIGNED_OUT') {
        // Clear any remaining state
        setUser(null);
        setUserRole(undefined);
        setIsLoading(false);
        setIsRoleLoading(false);
      }
    });

    // Store cleanup function
    cleanup = () => {
      authListener?.subscription?.unsubscribe();
    };

    // Initial check with better error handling
    const checkInitialUser = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();
        
        if (!isMounted) return; // Check again after async operation
        
        if (error) {
          const isInvalidTokenError =
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('JWT expired') ||
            (error instanceof Error && 'status' in error && (error as any).status === 400);

          if (isInvalidTokenError) {
            handleSignOut("Your session has expired. Please log in again.");
            return;
          } else {
            // Handle other errors during initial fetch
            setUser(null);
            setUserRole(undefined);
            setIsLoading(false);
            setIsRoleLoading(false);
          }
        } else {
          // Success case: user fetched
          setUser(fetchedUser);
          setIsLoading(false);
        }
      } catch (catchError: any) {
        if (!isMounted) return;
        
        // Check if the caught error indicates an invalid token
        const isInvalidTokenErrorInCatch =
            catchError?.message?.includes('Invalid Refresh Token') ||
            catchError?.message?.includes('JWT expired') ||
            catchError?.status === 400;

        if (isInvalidTokenErrorInCatch) {
           handleSignOut("Could not verify your session. Please log in again.");
        } else {
          // If it's a different unexpected error, clear user and stop loading
          setUser(null);
          setUserRole(undefined);
          setIsLoading(false);
          setIsRoleLoading(false);
        }
      }
    };

    checkInitialUser();

    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [supabase, toast, router]);

  // AI: Return loading true if either user or role is loading
  return { 
    user, 
    isLoading: isLoading || isRoleLoading, 
    auth 
  };
} 