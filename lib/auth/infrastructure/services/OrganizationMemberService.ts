/**
 * Organization Member Service
 * 
 * AI INSTRUCTIONS:
 * - Handle organization membership operations
 * - Uses dependency injection for Supabase client
 * - Focus on member counting and management
 * - Support statistics and member queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

export class OrganizationMemberService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Count total members in an organization
   */
  async countMembers(organizationId: OrganizationId): Promise<number> {
    const { count, error } = await this.supabase
      .from('organization_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId.value);

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to count organization members',
        { organizationId: organizationId.value, error: error.message }
      );
    }

    return count || 0;
  }

  /**
   * Count active members in an organization
   */
  async countActiveMembers(organizationId: OrganizationId): Promise<number> {
    const { count, error } = await this.supabase
      .from('organization_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId.value)
      .eq('status', 'active');

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to count active organization members',
        { organizationId: organizationId.value, error: error.message }
      );
    }

    return count || 0;
  }

  /**
   * Get member statistics for an organization
   */
  async getMemberStats(organizationId: OrganizationId): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
  }> {
    const { data, error } = await this.supabase
      .from('organization_memberships')
      .select('status')
      .eq('organization_id', organizationId.value);

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to get member statistics',
        { organizationId: organizationId.value, error: error.message }
      );
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      inactive: 0,
      pending: 0
    };

    data?.forEach(member => {
      switch (member.status) {
        case 'active':
          stats.active++;
          break;
        case 'inactive':
          stats.inactive++;
          break;
        case 'pending':
          stats.pending++;
          break;
      }
    });

    return stats;
  }

  /**
   * Check if user is member of organization
   */
  async isMember(userId: string, organizationId: OrganizationId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to check organization membership',
        { userId, organizationId: organizationId.value, error: error.message }
      );
    }

    return !!data;
  }
} 