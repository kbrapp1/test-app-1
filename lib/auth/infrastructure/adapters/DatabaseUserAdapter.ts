/**
 * Database User Adapter - Anti-Corruption Layer
 * 
 * AI INSTRUCTIONS:
 * - Isolate domain from database schema changes
 * - Transform between database rows and domain objects
 * - Handle database-specific user operations
 * - Protect domain from SQL/database concerns
 * - Keep under 200 lines following @golden-rule
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { UserAggregate, UserStatus, UserProfile } from '../../domain/aggregates/UserAggregate';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

export interface DatabaseUserRow {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  is_active: boolean;
  email_verified: boolean;
  active_organization_id?: string;
  organization_memberships?: string[];
}

export interface UserQueryResult {
  users: UserAggregate[];
  totalCount: number;
}

export class DatabaseUserAdapter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Transform database row to UserAggregate
   */
  transformToUserAggregate(row: DatabaseUserRow): UserAggregate {
    const userId = UserId.create(row.id);
    const email = Email.create(row.email);
    
    if (!row.active_organization_id) {
      throw new BusinessRuleViolationError(
        'User has no active organization',
        { userId: row.id }
      );
    }
    
    const organizationId = OrganizationId.create(row.active_organization_id);

    const profile: UserProfile = {
      firstName: row.full_name?.split(' ')[0] || undefined,
      lastName: row.full_name?.split(' ').slice(1).join(' ') || undefined,
      avatarUrl: row.avatar_url || undefined,
      timezone: row.timezone || undefined,
      language: row.language || undefined
    };

    const status = row.is_active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    const memberships = row.organization_memberships || [row.active_organization_id];

    return new UserAggregate(
      userId,
      email,
      organizationId,
      profile,
      status,
      row.email_verified,
      memberships,
      new Date(row.created_at),
      new Date(row.updated_at || row.created_at),
      row.last_login_at ? new Date(row.last_login_at) : undefined
    );
  }

  /**
   * Transform UserAggregate to database row format
   */
  transformToDatabaseRow(user: UserAggregate): Partial<DatabaseUserRow> {
    const profile = user.profile;
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ') || null;

    return {
      id: user.getId().value,
      email: user.email.value,
      full_name: fullName || undefined,
      avatar_url: profile.avatarUrl,
      timezone: profile.timezone,
      language: profile.language,
      is_active: user.status === UserStatus.ACTIVE,
      email_verified: user.emailVerified,
      active_organization_id: user.activeOrganizationId.value,
      organization_memberships: Array.from(user.organizationMemberships),
      updated_at: user.updatedAt.toISOString()
    };
  }

  /**
   * Query users with filtering and pagination
   */
  async queryUsers(filters: {
    organizationId?: OrganizationId;
    status?: UserStatus;
    emailVerified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<UserQueryResult> {
    try {
      let query = this.supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('active_organization_id', filters.organizationId.value);
      }

      if (filters.status !== undefined) {
        query = query.eq('is_active', filters.status === UserStatus.ACTIVE);
      }

      if (filters.emailVerified !== undefined) {
        query = query.eq('email_verified', filters.emailVerified);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to query users',
          { error: error.message, filters }
        );
      }

      const users = (data || []).map(row => this.transformToUserAggregate(row));

      return {
        users,
        totalCount: count || 0
      };

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to query users',
        { error: error instanceof Error ? error.message : 'Unknown error', filters }
      );
    }
  }

  /**
   * Batch update users
   */
  async batchUpdateUsers(users: UserAggregate[]): Promise<void> {
    try {
      const rows = users.map(user => this.transformToDatabaseRow(user));

      const { error } = await this.supabase
        .from('profiles')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to batch update users',
          { error: error.message, userCount: users.length }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to batch update users',
        { error: error instanceof Error ? error.message : 'Unknown error', userCount: users.length }
      );
    }
  }

  /**
   * Get user statistics
   */
    async getUserStatistics(organizationId?: OrganizationId): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingVerification: number;
    suspendedUsers: number;
  }> {
    try {
      const orgFilter = organizationId ? { active_organization_id: organizationId.value } : {};

      const [total, active, pending, suspended] = await Promise.all([
        this.supabase.from('profiles').select('*', { count: 'exact', head: true }).match(orgFilter),
        this.supabase.from('profiles').select('*', { count: 'exact', head: true }).match({ ...orgFilter, is_active: true, email_verified: true }),
        this.supabase.from('profiles').select('*', { count: 'exact', head: true }).match({ ...orgFilter, email_verified: false }),
        this.supabase.from('profiles').select('*', { count: 'exact', head: true }).match({ ...orgFilter, is_active: false })
      ]);

      return {
        totalUsers: total.count || 0,
        activeUsers: active.count || 0,
        pendingVerification: pending.count || 0,
        suspendedUsers: suspended.count || 0
      };
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to get user statistics',
        { error: error instanceof Error ? error.message : 'Unknown error', organizationId: organizationId?.value }
      );
    }
  }
} 