// Domain Service: Permission Validation
// Single Responsibility: Handle real-time permission checking and validation
// DDD: Clean separation of permission logic with enterprise features

import { createClient } from '@/lib/supabase/client';

export interface OrganizationPermission {
  organization_id: string;
  organization_name: string;
  role_name: string;
  granted_at: string;
  role_id: string;
}

export interface PermissionValidationError extends Error {
  code: 'UNAUTHORIZED' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'DATABASE_ERROR';
  context?: any;
}

export class PermissionValidationService {
  private supabase = createClient();

  /**
   * Check if user has access to specific organization
   * @param organizationId - Organization ID to check
   * @returns boolean indicating access
   * @throws PermissionValidationError for authentication or database errors
   */
  async hasOrganizationAccess(organizationId: string): Promise<boolean> {
    if (!organizationId?.trim()) {
      throw this.createError('VALIDATION_ERROR', 'Organization ID is required');
    }

    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      const { data, error } = await this.supabase
        .rpc('user_has_org_access', { 
          org_id: organizationId 
        });

      if (error) {
        throw this.createError('DATABASE_ERROR', `Permission check failed: ${error.message}`, { error });
      }

      return data === true;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error checking permission', { error });
    }
  }

  /**
   * Get all organizations accessible to current user
   * @returns Array of organizations with permission details
   * @throws PermissionValidationError for authentication or database errors
   */
  async getUserAccessibleOrganizations(): Promise<OrganizationPermission[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase.rpc('get_user_accessible_organizations');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return [];
      }
      
      return data.map((row: any) => ({
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        role_name: row.role_name,
        granted_at: row.granted_at,
        role_id: row.role_id,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate access to multiple organizations efficiently
   * @param organizationIds - Array of organization IDs to check
   * @returns Record mapping organization IDs to access boolean
   * @throws PermissionValidationError for authentication errors
   */
  async validateMultiOrgAccess(organizationIds: string[]): Promise<Record<string, boolean>> {
    if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
      return {};
    }

    // Filter out invalid IDs
    const validIds = organizationIds.filter(id => id?.trim());
    if (validIds.length === 0) {
      return {};
    }

    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      // Batch check for performance
      const results: Record<string, boolean> = {};
      
      // Use Promise.allSettled to handle individual failures gracefully
      const checks = await Promise.allSettled(
        validIds.map(async (orgId) => {
          const { data, error } = await this.supabase
            .rpc('user_has_org_access', { 
              org_id: orgId 
            });
          
          return { orgId, hasAccess: !error && data === true };
        })
      );

      checks.forEach((result, index) => {
        const orgId = validIds[index];
        if (result.status === 'fulfilled') {
          results[orgId] = result.value.hasAccess;
        } else {
          results[orgId] = false; // Default to no access on error
        }
      });

      return results;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error validating multi-org access', { error });
    }
  }

  /**
   * Get current user's active organization with permission validation
   * @returns Active organization ID or null
   * @throws PermissionValidationError for authentication or database errors
   */
  async getActiveOrganizationId(): Promise<string | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      const { data, error } = await this.supabase
        .rpc('get_active_organization_id');

      if (error) {
        throw this.createError('DATABASE_ERROR', `Failed to get active organization: ${error.message}`, { error });
      }

      return data;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error getting active organization', { error });
    }
  }

  /**
   * Check if user has specific role in organization
   * @param organizationId - Organization ID to check
   * @param requiredRoles - Array of role names (e.g., ['admin', 'owner'])
   * @returns boolean indicating if user has any of the required roles
   * @throws PermissionValidationError for authentication or database errors
   */
  async hasOrganizationRole(organizationId: string, requiredRoles: string[]): Promise<boolean> {
    if (!organizationId?.trim()) {
      throw this.createError('VALIDATION_ERROR', 'Organization ID is required');
    }

    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      throw this.createError('VALIDATION_ERROR', 'Required roles must be provided');
    }

    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      const { data, error } = await this.supabase
        .from('user_organization_permissions')
        .select(`
          role_id,
          roles!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .is('revoked_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw this.createError('DATABASE_ERROR', `Failed to check role: ${error.message}`, { error });
      }

      if (!data) {
        return false;
      }

      const userRole = (data.roles as any)?.name;
      return requiredRoles.includes(userRole);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error checking role', { error });
    }
  }

  /**
   * Create a standardized error with proper typing
   * @param code - Error code for categorization
   * @param message - Human-readable error message
   * @param context - Additional error context
   * @private
   */
  private createError(
    code: PermissionValidationError['code'], 
    message: string, 
    context?: any
  ): PermissionValidationError {
    const error = new Error(message) as PermissionValidationError;
    error.code = code;
    error.context = context;
    return error;
  }
} 