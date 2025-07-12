import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasRole, hasAnyRole, hasPermission, hasAnyPermission, getUserPermissions } from '../infrastructure/adapters/AuthorizationCompatibilityAdapter';
import { UserRole } from '../domain/value-objects/UserRole';
import { Permission } from '../domain/value-objects/Permission';

describe('Authorization Utilities', () => {
  // Mock user with admin role
  const adminUser = {
    id: 'admin-id',
    app_metadata: { role: 'admin' },
  } as any;

  // Mock user with editor role
  const editorUser = {
    id: 'editor-id',
    app_metadata: { role: 'editor' },
  } as any;

  // Mock user with viewer role
  const viewerUser = {
    id: 'viewer-id',
    app_metadata: { role: 'viewer' },
  } as any;

  describe('hasRole', () => {
    it('returns true when user has the specified role', () => {
      expect(hasRole(adminUser, UserRole.ADMIN)).toBe(true);
      expect(hasRole(editorUser, UserRole.EDITOR)).toBe(true);
      expect(hasRole(viewerUser, UserRole.VIEWER)).toBe(true);
    });

    it('returns false when user does not have the specified role', () => {
      expect(hasRole(adminUser, UserRole.EDITOR)).toBe(false);
      expect(hasRole(editorUser, UserRole.ADMIN)).toBe(false);
      expect(hasRole(viewerUser, UserRole.ADMIN)).toBe(false);
    });

    it('returns false when user is null', () => {
      expect(hasRole(null, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true when user has at least one of the specified roles', () => {
      expect(hasAnyRole(adminUser, [UserRole.ADMIN, UserRole.EDITOR])).toBe(true);
      expect(hasAnyRole(editorUser, [UserRole.EDITOR, UserRole.VIEWER])).toBe(true);
      expect(hasAnyRole(viewerUser, [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER])).toBe(true);
    });

    it('returns false when user does not have any of the specified roles', () => {
      expect(hasAnyRole(viewerUser, [UserRole.ADMIN, UserRole.EDITOR])).toBe(false);
      expect(hasAnyRole(editorUser, [UserRole.ADMIN])).toBe(false);
    });

    it('returns false when user is null', () => {
      expect(hasAnyRole(null, [UserRole.ADMIN, UserRole.EDITOR])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('returns true when user has the specified permission', () => {
      expect(hasPermission(adminUser, Permission.DELETE_USER)).toBe(true);
      expect(hasPermission(editorUser, Permission.UPDATE_ASSET)).toBe(true);
      expect(hasPermission(viewerUser, Permission.VIEW_ASSET)).toBe(true);
    });

    it('returns false when user does not have the specified permission', () => {
      expect(hasPermission(viewerUser, Permission.DELETE_USER)).toBe(false);
      expect(hasPermission(editorUser, Permission.DELETE_USER)).toBe(false);
    });

    it('returns false when user is null', () => {
      expect(hasPermission(null, Permission.VIEW_ASSET)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one of the specified permissions', () => {
      expect(hasAnyPermission(adminUser, [Permission.DELETE_USER, Permission.UPDATE_ASSET])).toBe(true);
      expect(hasAnyPermission(editorUser, [Permission.DELETE_USER, Permission.UPDATE_ASSET])).toBe(true);
      expect(hasAnyPermission(viewerUser, [Permission.DELETE_USER, Permission.VIEW_ASSET])).toBe(true);
    });

    it('returns false when user does not have any of the specified permissions', () => {
      expect(hasAnyPermission(viewerUser, [Permission.DELETE_USER, Permission.DELETE_ASSET])).toBe(false);
    });

    it('returns false when user is null', () => {
      expect(hasAnyPermission(null, [Permission.VIEW_ASSET, Permission.UPDATE_ASSET])).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('returns all permissions for admin role', () => {
      const permissions = getUserPermissions(adminUser);
      expect(permissions).toContain(Permission.DELETE_USER);
      expect(permissions).toContain(Permission.CREATE_ASSET);
      expect(permissions).toContain(Permission.VIEW_ASSET);
    });

    it('returns correct permissions for editor role', () => {
      const permissions = getUserPermissions(editorUser);
      expect(permissions).toContain(Permission.CREATE_ASSET);
      expect(permissions).toContain(Permission.UPDATE_ASSET);
      expect(permissions).not.toContain(Permission.DELETE_USER);
    });

    it('returns limited permissions for viewer role', () => {
      const permissions = getUserPermissions(viewerUser);
      expect(permissions).toContain(Permission.VIEW_ASSET);
      expect(permissions).not.toContain(Permission.CREATE_ASSET);
      expect(permissions).not.toContain(Permission.DELETE_ASSET);
    });

    it('returns empty array when user is null', () => {
      expect(getUserPermissions(null)).toEqual([]);
    });
  });
}); 