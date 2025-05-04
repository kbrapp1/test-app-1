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

    // Reusable sign-out handler with toast notification and redirect
    const handleSignOut = async (reason: string) => {
      if (!isMounted) return;
      console.warn(`Signing out due to: ${reason}`);
      toast({
        title: "Session Ended",
        description: reason,
        variant: "destructive",
      });
      // Redirect immediately after showing toast
      router.push('/login'); 

      // Still attempt sign out, but don't necessarily wait for it
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error("Error during sign out:", signOutError);
        // If signout fails, ensure state is cleared (onAuthStateChange might not fire)
        if (isMounted) {
            setUser(null);
            setIsLoading(false);
        }
      }
      // Explicitly set loading to false if mounted after initiating sign out/redirect
      if (isMounted) {
          setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Initial check
    const checkInitialUser = async () => {
      try {
        const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          const isInvalidTokenError =
            error.message.includes('Invalid Refresh Token') ||
            (error instanceof Error && 'status' in error && (error as any).status === 400);

          if (isInvalidTokenError) {
            console.warn('Invalid refresh token detected on initial check. Signing out.');
            handleSignOut("Your session is invalid or expired. Please log in again.");
            // State update will happen via onAuthStateChange after signOut triggers
            // No need to set user/loading state here directly if handleSignOut runs
          } else {
            // Handle other errors during initial fetch
            console.error('Error fetching initial user:', error);
            if (isMounted) {
              setUser(null);
              setIsLoading(false);
            }
          }
        } else if (isMounted) {
          // Success case: user fetched
          setUser(fetchedUser);
          setIsLoading(false);
        }
      } catch (catchError: any) {
        // Catch unexpected errors during the getUser call itself (e.g., network)
        console.error('Unexpected error during initial user check:', catchError);
        
        // Check if the caught error *itself* indicates an invalid token
        const isInvalidTokenErrorInCatch =
            catchError?.message?.includes('Invalid Refresh Token') ||
            catchError?.status === 400;

        if (isInvalidTokenErrorInCatch) {
           console.warn('Invalid refresh token detected during catch. Signing out.');
           handleSignOut("Could not verify your session. Please log in again.");
           // State update will happen via onAuthStateChange after signOut triggers
        } else if (isMounted) {
          // If it's a different unexpected error, clear user and stop loading
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    checkInitialUser();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, toast, router]);

  return { user, isLoading, auth };
} 