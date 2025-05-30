/**
 * React Hook: Enhanced Auth with Super Admin
 * 
 * Single Responsibility: State coordination for authentication with super admin
 * Focuses on hook functionality while delegating business logic to services
 * 
 * REFACTORED: Now uses centralized UserProfileProvider to eliminate duplicate API calls
 */

'use client';

import { useMemo } from 'react';
import { useUserProfile } from '@/lib/auth/providers/UserProfileProvider';
import { AuthContextType } from './types';
import { SuperAdminPermissionService } from './permissions';

/**
 * Enhanced auth hook with super admin support
 * Provides authentication state with super admin permissions
 * 
 * OPTIMIZED: Uses centralized UserProfileProvider to prevent duplicate API calls
 */
export function useAuthWithSuperAdmin(): AuthContextType {
  // Use centralized user profile provider instead of direct API calls
  const { user, profile, isLoading } = useUserProfile();

  // Extract active org ID from user metadata
  const activeOrgId = user?.app_metadata?.active_organization_id || null;

  // Memoized super admin status for performance
  const isSuperAdmin = useMemo(() => {
    return SuperAdminPermissionService.isSuperAdmin(profile);
  }, [profile]);

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