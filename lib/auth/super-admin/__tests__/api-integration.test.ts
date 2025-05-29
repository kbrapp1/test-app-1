/**
 * Tests: Super Admin API Integration
 * 
 * Unit tests for super admin API integration functionality
 * Tests queries, mutations, and caching services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuperAdminQueryService, SuperAdminMutationService } from '../index';
import type { Profile } from '../types';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  })),
};

describe('Super Admin API Integration', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SuperAdminQueryService', () => {
    it('should bypass organization filter for super admin', async () => {
      const queryService = new SuperAdminQueryService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: [], error: null });

      await queryService.queryData('assets', '*', {
        organizationId: 'org-1',
        profile: superAdminProfile,
        bypassOrganizationFilter: true
      });

      // Should not call eq with organization_id for super admin with bypass
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should apply organization filter for regular user', async () => {
      const queryService = new SuperAdminQueryService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: [], error: null });

      await queryService.queryData('assets', '*', {
        organizationId: 'org-1',
        profile: regularProfile
      });

      // Should call eq with organization_id for regular user
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should get all organizations for super admin', async () => {
      const queryService = new SuperAdminQueryService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.order.mockResolvedValue({ 
        data: [{ id: 'org-1', name: 'Org 1' }, { id: 'org-2', name: 'Org 2' }], 
        error: null 
      });

      const result = await queryService.getAccessibleOrganizations(superAdminProfile);

      expect(result.data).toHaveLength(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('organizations');
    });
  });

  describe('SuperAdminMutationService', () => {
    it('should allow cross-organization updates for super admin', async () => {
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: { id: 'asset-1', name: 'Updated Asset' }, 
        error: null 
      });

      await mutationService.updateData(
        'assets',
        { name: 'Updated Asset' },
        'id',
        'asset-1',
        { 
          organizationId: 'org-1',
          profile: superAdminProfile,
          skipOrganizationValidation: true
        }
      );

      // Should not apply organization filter for super admin with skip
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'asset-1');
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should enforce organization filter for regular user', async () => {
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: { id: 'asset-1', name: 'Updated Asset' }, 
        error: null 
      });

      await mutationService.updateData(
        'assets',
        { name: 'Updated Asset' },
        'id',
        'asset-1',
        { 
          organizationId: 'org-1',
          profile: regularProfile
        }
      );

      // Should apply organization filter for regular user
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'asset-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should allow entity transfer between organizations for super admin', async () => {
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: { id: 'asset-1', organization_id: 'org-2' }, 
        error: null 
      });

      const result = await mutationService.transferBetweenOrganizations(
        'assets',
        'asset-1',
        'org-1',
        'org-2',
        { profile: superAdminProfile }
      );

      expect(result.error).toBeNull();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ organization_id: 'org-2' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'asset-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should deny entity transfer for regular user', async () => {
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);

      const result = await mutationService.transferBetweenOrganizations(
        'assets',
        'asset-1',
        'org-1',
        'org-2',
        { profile: regularProfile }
      );

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Only super administrators');
    });
  });

  describe('Integration: Queries + Mutations + Caching', () => {
    it('should work together for super admin operations', async () => {
      const queryService = new SuperAdminQueryService(mockSupabaseClient as any);
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);
      
      // Mock successful query
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: [{ id: 'asset-1', name: 'Asset 1' }], 
        error: null 
      });

      // Query assets across all organizations (super admin)
      const queryResult = await queryService.queryData('assets', '*', {
        profile: superAdminProfile,
        bypassOrganizationFilter: true
      });

      expect(queryResult.error).toBeNull();

      // Update asset across organizations (super admin)
      const updateResult = await mutationService.updateData(
        'assets',
        { name: 'Updated Asset' },
        'id',
        'asset-1',
        { 
          profile: superAdminProfile,
          skipOrganizationValidation: true
        }
      );

      expect(updateResult.error).toBeNull();
    });

    it('should respect organization boundaries for regular users', async () => {
      const queryService = new SuperAdminQueryService(mockSupabaseClient as any);
      const mutationService = new SuperAdminMutationService(mockSupabaseClient as any);
      
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: [{ id: 'asset-1', name: 'Asset 1' }], 
        error: null 
      });

      // Query with organization filter (regular user)
      await queryService.queryData('assets', '*', {
        organizationId: 'org-1',
        profile: regularProfile
      });

      // Should apply organization filter
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1');

      // Update with organization filter (regular user)
      await mutationService.updateData(
        'assets',
        { name: 'Updated Asset' },
        'id',
        'asset-1',
        { 
          organizationId: 'org-1',
          profile: regularProfile
        }
      );

      // Should apply organization filter
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });
  });
}); 