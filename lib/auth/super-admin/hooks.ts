/**
 * React Hook: Enhanced Auth with Super Admin
 * 
 * Single Responsibility: State coordination for authentication with super admin
 * Focuses on hook functionality while delegating business logic to services
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthContextType, Profile } from './types';
import { SuperAdminPermissionService } from './permissions';

/**
 * Enhanced auth hook with super admin support
 * Provides authentication state with super admin permissions
 */
export function useAuthWithSuperAdmin(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Memoized super admin status for performance
  const isSuperAdmin = useMemo(() => {
    return SuperAdminPermissionService.isSuperAdmin(profile);
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            setActiveOrgId(session.user.app_metadata?.active_organization_id || null);
          } else {
            setUser(null);
            setProfile(null);
            setActiveOrgId(null);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (mounted && !error && data) {
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            setActiveOrgId(session.user.app_metadata?.active_organization_id || null);
          } else {
            setUser(null);
            setProfile(null);
            setActiveOrgId(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    profile,
    activeOrgId,
    isSuperAdmin,
    loading,
  };
}

/**
 * Super admin context hook
 * Returns super admin permissions and context
 */
export function useSuperAdminContext() {
  const { profile, isSuperAdmin } = useAuthWithSuperAdmin();
  
  const context = useMemo(() => {
    return SuperAdminPermissionService.createContext(profile);
  }, [profile]);

  return {
    ...context,
    profile,
  };
} 