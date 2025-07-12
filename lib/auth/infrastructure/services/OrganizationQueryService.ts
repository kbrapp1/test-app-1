/**
 * Organization Query Service
 * 
 * AI INSTRUCTIONS:
 * - Handle complex organization queries and searches
 * - Uses dependency injection for Supabase client
 * - Focus on read-only operations
 * - Support original OrganizationService functionality
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationAggregate, OrganizationStatus } from '../../domain/aggregates/OrganizationAggregate';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

interface SimpleOrganization {
  id: string;
  name: string;
  slug?: string;
  status: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class OrganizationQueryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get organization by ID (simple data for OrganizationService compatibility)
   */
  async getOrganizationById(organizationId: string): Promise<SimpleOrganization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .eq('id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new BusinessRuleViolationError(
        'Failed to find organization by ID',
        { organizationId, error: error.message }
      );
    }

    return data;
  }

  /**
   * Get user organizations (for OrganizationService compatibility)
   */
  async getUserOrganizations(userId: string, isSuperAdmin: boolean = false): Promise<SimpleOrganization[]> {
    if (isSuperAdmin) {
      return this.getAllOrganizations();
    }
    return this.getUserMembershipOrganizations(userId);
  }

  /**
   * Get all organizations (super admin only)
   */
  async getAllOrganizations(): Promise<SimpleOrganization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .order('name');

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to get all organizations',
        { error: error.message }
      );
    }

    return data || [];
  }

  /**
   * Get organizations for a user based on memberships
   */
  async getUserMembershipOrganizations(userId: string): Promise<SimpleOrganization[]> {
    const { data: memberships, error: membershipError } = await this.supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId);

    if (membershipError) {
      throw new BusinessRuleViolationError(
        'Failed to find user memberships',
        { userId, error: membershipError.message }
      );
    }

    if (!memberships || memberships.length === 0) return [];

    const orgIds = memberships.map(m => m.organization_id);
    const { data: organizations, error: orgsError } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .in('id', orgIds)
      .order('name');

    if (orgsError) {
      throw new BusinessRuleViolationError(
        'Failed to find organizations by member',
        { userId, error: orgsError.message }
      );
    }

    return organizations || [];
  }

  /**
   * Find active organizations
   */
  async findActiveOrganizations(): Promise<SimpleOrganization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .eq('status', OrganizationStatus.ACTIVE)
      .order('name');

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to find active organizations',
        { error: error.message }
      );
    }

    return data || [];
  }

  /**
   * Check if organization name exists
   */
  async nameExists(name: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to check organization name existence',
        { name, error: error.message }
      );
    }

    return !!data;
  }

  /**
   * Find organization by name
   */
  async findByName(name: string): Promise<SimpleOrganization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new BusinessRuleViolationError(
        'Failed to find organization by name',
        { name, error: error.message }
      );
    }

    return data;
  }

  /**
   * Search organizations by name pattern
   */
  async searchByName(namePattern: string): Promise<SimpleOrganization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, status, owner_id, settings, created_at, updated_at')
      .ilike('name', `%${namePattern}%`)
      .order('name');

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to search organizations by name',
        { namePattern, error: error.message }
      );
    }

    return data || [];
  }
} 