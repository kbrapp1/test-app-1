/**
 * Tests: Super Admin Permissions
 * 
 * Unit tests for super admin permission service functionality
 */

import { describe, it, expect } from 'vitest';
import { SuperAdminPermissionService } from '../permissions';
import type { Profile } from '../types';

describe('SuperAdminPermissionService', () => {
  // Mock profiles for testing
  const superAdminProfile: Profile = {
    id: 'super-admin-id',
    email: 'superadmin@example.com',
    full_name: 'Super Admin',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: null,
    is_super_admin: true,
  };

  const regularProfile: Profile = {
    id: 'regular-user-id',
    email: 'user@example.com',
    full_name: 'Regular User',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: null,
    is_super_admin: false,
  };

  describe('isSuperAdmin', () => {
    it('should return true for super admin profile', () => {
      expect(SuperAdminPermissionService.isSuperAdmin(superAdminProfile)).toBe(true);
    });

    it('should return false for regular profile', () => {
      expect(SuperAdminPermissionService.isSuperAdmin(regularProfile)).toBe(false);
    });

    it('should return false for null profile', () => {
      expect(SuperAdminPermissionService.isSuperAdmin(null)).toBe(false);
    });
  });

  describe('canAccessAllOrganizations', () => {
    it('should return true for super admin', () => {
      expect(SuperAdminPermissionService.canAccessAllOrganizations(superAdminProfile)).toBe(true);
    });

    it('should return false for regular user', () => {
      expect(SuperAdminPermissionService.canAccessAllOrganizations(regularProfile)).toBe(false);
    });

    it('should return false for null profile', () => {
      expect(SuperAdminPermissionService.canAccessAllOrganizations(null)).toBe(false);
    });
  });

  describe('canManageOrganization', () => {
    it('should return true for super admin regardless of organization', () => {
      expect(SuperAdminPermissionService.canManageOrganization(superAdminProfile, 'any-org-id')).toBe(true);
      expect(SuperAdminPermissionService.canManageOrganization(superAdminProfile)).toBe(true);
    });

    it('should return false for regular user', () => {
      expect(SuperAdminPermissionService.canManageOrganization(regularProfile, 'org-id')).toBe(false);
    });
  });

  describe('createContext', () => {
    it('should create super admin context for super admin profile', () => {
      const context = SuperAdminPermissionService.createContext(superAdminProfile);
      
      expect(context).toEqual({
        isSuperAdmin: true,
        canAccessAllOrganizations: true,
      });
    });

    it('should create regular context for regular profile', () => {
      const context = SuperAdminPermissionService.createContext(regularProfile);
      
      expect(context).toEqual({
        isSuperAdmin: false,
        canAccessAllOrganizations: false,
      });
    });

    it('should create regular context for null profile', () => {
      const context = SuperAdminPermissionService.createContext(null);
      
      expect(context).toEqual({
        isSuperAdmin: false,
        canAccessAllOrganizations: false,
      });
    });
  });

  describe('getAccessibleOrganizations', () => {
    const userOrgs = ['org-1', 'org-2'];

    it('should return "ALL" for super admin', () => {
      const result = SuperAdminPermissionService.getAccessibleOrganizations(superAdminProfile, userOrgs);
      expect(result).toBe('ALL');
    });

    it('should return user organizations for regular user', () => {
      const result = SuperAdminPermissionService.getAccessibleOrganizations(regularProfile, userOrgs);
      expect(result).toEqual(userOrgs);
    });

    it('should return user organizations for null profile', () => {
      const result = SuperAdminPermissionService.getAccessibleOrganizations(null, userOrgs);
      expect(result).toEqual(userOrgs);
    });
  });
}); 