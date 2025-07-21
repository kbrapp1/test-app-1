/**
 * Supabase Permission Service - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure implementation of IPermissionService interface
 * - Handles Supabase-specific permission validation logic
 * - Implements domain interface without violating dependency inversion
 * - Single responsibility: Permission validation using Supabase
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { BusinessRuleViolationError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';
import { UserRole } from '@/lib/auth/domain/value-objects/UserRole';
import { ROLE_PERMISSIONS } from '@/lib/auth/domain/value-objects/Permission';
import { AppError } from '@/lib/errors/base';

interface MembershipWithRole {
  role_id: string;
  roles: {
    name: string;
  }[];
}

export class SupabasePermissionService implements IPermissionService {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateNotePermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<void> {
    if (!userId || !organizationId) {
      throw new BusinessRuleViolationError(
        'User ID and Organization ID are required for permission validation',
        { userId, organizationId }
      );
    }

    try {
      // First check if user is superadmin - superadmins have access to everything
      const isSuperAdmin = await this.isSuperAdmin(userId);
      if (isSuperAdmin) {
        // Superadmin has all permissions - skip further validation
        return;
      }

      // Get user role from organization_memberships table
      const { data: membershipData, error } = await this.supabase
        .from('organization_memberships')
        .select(`
          role_id,
          roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !membershipData) {
        throw new BusinessRuleViolationError(
          'User membership not found for organization',
          { userId, organizationId, error: error?.message }
        );
      }

      // Get role name from the joined roles table
      const typedMembershipData = membershipData as MembershipWithRole;
      const roleName = typedMembershipData.roles?.[0]?.name;
      if (!roleName) {
        throw new BusinessRuleViolationError(
          'Role information not found',
          { userId, organizationId, roleId: membershipData.role_id }
        );
      }

      // Convert role name to Role enum
      const roleEnum = this.mapRoleNameToEnum(roleName);
      
      // Get permissions for this role
      const rolePermissions = ROLE_PERMISSIONS[roleEnum] || [];

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((permission: Permission) => 
        rolePermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new BusinessRuleViolationError(
          'Insufficient permissions for this operation',
          { 
            userId, 
            organizationId, 
            userRole: roleName,
            requiredPermissions: requiredPermissions.map(p => p.toString()),
            userPermissions: rolePermissions.map((p: Permission) => p.toString())
          }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new AppError(
        'Failed to validate user permissions',
        'PERMISSION_VALIDATION_ERROR',
        500,
        { userId, organizationId, originalError: error }
      );
    }
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to check superadmin status: ${profileError.message}`);
      }

      return profileData?.is_super_admin === true;
    } catch (error) {
      throw new AppError(
        'Failed to check superadmin status',
        'SUPERADMIN_CHECK_ERROR',
        500,
        { userId, originalError: error }
      );
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        throw new Error(`Authentication error: ${error.message}`);
      }

      return user?.id || null;
    } catch (error) {
      throw new AppError(
        'Failed to get current user',
        'AUTH_ERROR',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Maps role name from database to UserRole enum
   */
  private mapRoleNameToEnum(roleName: string): UserRole {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return UserRole.ADMIN;
      case 'editor':
        return UserRole.EDITOR;
      case 'member':
        return UserRole.MEMBER;
      case 'viewer':
        return UserRole.VIEWER;
      case 'visitor':
        return UserRole.VISITOR;
      default:
        throw new BusinessRuleViolationError(
          'Unknown role name',
          { roleName, validRoles: Object.values(UserRole) }
        );
    }
  }
}