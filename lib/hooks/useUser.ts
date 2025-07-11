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
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  
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
        setIsLoading(false);
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
        setIsLoading(false);
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
            setIsLoading(false);
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
          setIsLoading(false);
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

  return { user, isLoading, auth };
} 