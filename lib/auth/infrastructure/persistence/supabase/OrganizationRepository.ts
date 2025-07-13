/**
 * Simple Organization Repository
 * 
 * AI INSTRUCTIONS:
 * - Pure data access - no business logic
 * - Match current organization-service.ts functionality exactly
 * - Keep under 100 lines - simple and focused
 * - Only implement methods actually used
 */

import { createClient } from '@/lib/supabase/client';
import { Organization } from '../../../domain/value-objects/Organization';

export class OrganizationRepository {
  private supabase = createClient();

  /**
   * Get all organizations (super admin only)
   */
  async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, feature_flags')
      .order('name');

    if (error) throw error;
    
    return (data || []).map(org => Organization.fromDatabase(org));
  }

  /**
   * Get organizations for a user based on memberships
   */
  async getUserMembershipOrganizations(userId: string): Promise<Organization[]> {
    const { data: memberships, error: membershipError } = await this.supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const orgIds = memberships.map(m => m.organization_id);
    const { data: organizations, error: orgsError } = await this.supabase
      .from('organizations')
      .select('id, name, slug, feature_flags')
      .in('id', orgIds)
      .order('name');

    if (orgsError) throw orgsError;
    
    return (organizations || []).map(org => Organization.fromDatabase(org));
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug, feature_flags')
      .eq('id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return Organization.fromDatabase(data);
  }
} 