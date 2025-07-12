/**
 * Permission Validation Service - Organization Domain
 * 
 * AI INSTRUCTIONS:
 * - Uses GlobalAuthenticationService for cached user validation
 * - Eliminates redundant supabase.auth.getUser() calls
 * - Integrates with optimized validation chain
 * - Maintains all existing functionality with performance improvements
 * - Single responsibility: Organization permission validation
 */

import { createClient } from '@/lib/supabase/client';
import { GlobalAuthenticationService } from '@/lib/shared/infrastructure/GlobalAuthenticationService';

export interface OrganizationPermission {
  organization_id: string;
  organization_name: string;
  role_name: string;
  granted_at: string;
  role_id: string;
}

export interface PermissionValidationError extends Error {
  code: string;
  details?: any;
}

export class PermissionValidationService {
  private supabase = createClient();
  private globalAuth = GlobalAuthenticationService.getInstance();

  /**
   * Get current user with cached validation
   */
  async getCurrentUser() {
    try {
      // Use cached validation instead of direct supabase.auth.getUser()
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        throw new Error('User not authenticated');
      }

      return authResult.user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has permission for organization
   */
  async hasOrganizationPermission(organizationId: string, permission?: string): Promise<boolean> {
    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        return false;
      }

      const { data, error } = await this.supabase
        .from('organization_members')
        .select('role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', authResult.user.id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      // If no specific permission required, just check membership
      if (!permission) {
        return true;
      }

      // Check specific permission based on role
      return this.roleHasPermission(data.role_name, permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Get all organizations accessible to current user
   * @returns Array of organizations with permission details
   * @throws PermissionValidationError for authentication or database errors
   */
  async getUserAccessibleOrganizations(): Promise<OrganizationPermission[]> {
    try {
      // Use cached validation instead of direct supabase.auth.getUser()
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase.rpc('get_user_accessible_organizations');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      const permissionError = new Error(
        `Failed to get user organizations: ${error instanceof Error ? error.message : 'Unknown error'}`
      ) as PermissionValidationError;
      permissionError.code = 'ORGANIZATION_ACCESS_ERROR';
      throw permissionError;
    }
  }

  /**
   * Get user's role in specific organization
   */
  async getUserRoleInOrganization(organizationId: string): Promise<string | null> {
    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('organization_members')
        .select('role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', authResult.user.id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data.role_name;
    } catch (error) {
      console.error('Role lookup error:', error);
      return null;
    }
  }

  /**
   * Get active organization ID for current user
   */
  async getActiveOrganizationId(): Promise<string | null> {
    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        return null;
      }

      const { data, error } = await this.supabase.rpc('get_active_organization_id');
      
      if (error) {
        console.error('Active organization lookup error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Active organization lookup error:', error);
      return null;
    }
  }

  /**
   * Check if user has access to organization
   */
  async hasOrganizationAccess(organizationId: string): Promise<boolean> {
    if (!organizationId?.trim()) {
      return false;
    }

    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        return false;
      }

      const { data, error } = await this.supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', authResult.user.id)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Organization access check error:', error);
      return false;
    }
  }

  /**
   * Validate user permissions for organization operations
   */
  async validateOrganizationOperation(
    organizationId: string,
    requiredPermission?: string
  ): Promise<{ isValid: boolean; error?: string; userId?: string }> {
    try {
      // Use cached validation
      const authResult = await this.globalAuth.getAuthenticatedUserClient();
      
      if (!authResult.isValid || !authResult.user) {
        return { isValid: false, error: 'User not authenticated' };
      }

      const hasAccess = await this.hasOrganizationAccess(organizationId);
      if (!hasAccess) {
        return { isValid: false, error: 'No access to organization' };
      }

      if (requiredPermission) {
        const hasPermission = await this.hasOrganizationPermission(organizationId, requiredPermission);
        if (!hasPermission) {
          return { isValid: false, error: `Missing required permission: ${requiredPermission}` };
        }
      }

      return { isValid: true, userId: authResult.user.id };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Private helper methods
  private roleHasPermission(roleName: string, permission: string): boolean {
    // Simple role-based permission checking
    const rolePermissions: Record<string, string[]> = {
      'owner': ['read', 'write', 'delete', 'admin'],
      'admin': ['read', 'write', 'delete'],
      'editor': ['read', 'write'],
      'viewer': ['read'],
    };

    const permissions = rolePermissions[roleName.toLowerCase()] || [];
    return permissions.includes(permission.toLowerCase());
  }
} 