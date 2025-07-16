/**
 * User Hook - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Uses shared AuthenticationProvider (eliminates redundant auth calls)
 * - Maintains all existing functionality with performance improvements
 * - Follows @golden-rule patterns exactly
 * - Single responsibility: Provide user context and role management
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
// User type is implicitly used through the authentication context
import { createClient } from '@/lib/supabase/client';
import { useAuthentication } from '@/lib/auth';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface AuthHelpers {
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
}

export function useUser() {
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuthentication(); // Use shared auth context
  const supabase = createClient();
  const { toast: _toast } = useToast();
  const _router = useRouter();
  
  // AI: Fetch user's role from database when user or organization changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !isAuthenticated) {
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
  }, [user, isAuthenticated, supabase]);
  
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
  }, [userRole]);

  return {
    user,
    isLoading,
    isRoleLoading,
    ...auth,
  };
} 