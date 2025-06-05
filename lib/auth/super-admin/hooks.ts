/**
 * React Hook: Enhanced Auth with Super Admin
 * 
 * Single Responsibility: State coordination for authentication with super admin
 * Focuses on hook functionality while delegating business logic to services
 */

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthContextType, Profile } from './types';
import { SuperAdminPermissionService } from './permissions';
import { useUserProfile } from '@/lib/auth/providers/UserProfileProvider';

/**
 * Enhanced auth hook with super admin support
 * Now uses centralized UserProfileProvider to eliminate redundant profile fetching
 */
export function useAuthWithSuperAdmin(): AuthContextType {
  // ✅ NEW: Use centralized profile provider instead of separate fetching
  const { user, profile, isLoading } = useUserProfile();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const supabase = createClient();

  // Calculate super admin status from centralized profile
  const isSuperAdmin = useMemo(() => {
    return SuperAdminPermissionService.isSuperAdmin(profile);
  }, [profile]);

  // Only handle organization state, not profile fetching
  useEffect(() => {
    let mounted = true;

    const initializeOrgState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setActiveOrgId(session.user.app_metadata?.active_organization_id || null);
        }
      } catch (error) {
        console.error('Error getting session for org state:', error);
      }
    };

    // Listen for auth changes to update organization state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setActiveOrgId(session.user.app_metadata?.active_organization_id || null);
          } else {
            setActiveOrgId(null);
          }
        }
      }
    );

    initializeOrgState();

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
    loading: isLoading,
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