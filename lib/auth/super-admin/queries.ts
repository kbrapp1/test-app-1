/**
 * Application Service: Super Admin Queries
 * 
 * Single Responsibility: Handles data fetching with super admin access patterns
 * Modifies organization filtering based on super admin privileges
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from './types';
import { SuperAdminPermissionService } from './permissions';

export interface QueryOptions {
  matchColumn?: string;
  matchValue?: string | null;
  isNull?: string;
  userId?: string;
  organizationId?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
}

export interface SuperAdminQueryOptions extends QueryOptions {
  profile?: Profile | null;
  bypassOrganizationFilter?: boolean;
}

/**
 * Super Admin Query Service
 * Enhances database queries with super admin organization bypass logic
 */
export class SuperAdminQueryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Query data with super admin organization bypass
   * If user is super admin, organization filtering can be bypassed
   */
  async queryData<T = any>(
    table: string,
    selectFields: string,
    options: SuperAdminQueryOptions = {}
  ): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      let queryBuilder = this.supabase.from(table).select(selectFields);

      // Apply filters
      if (options.matchColumn && options.matchValue !== undefined) {
        queryBuilder = queryBuilder.eq(options.matchColumn, options.matchValue);
      }
      
      if (options.isNull) {
        queryBuilder = queryBuilder.is(options.isNull, null);
      }
      
      if (options.userId) {
        queryBuilder = queryBuilder.eq('user_id', options.userId);
      }

      // Super admin organization filter logic
      if (options.organizationId && !this.shouldBypassOrganizationFilter(options)) {
        queryBuilder = queryBuilder.eq('organization_id', options.organizationId);
      }

      // Apply ordering
      if (options.orderBy) {
        queryBuilder = queryBuilder.order(options.orderBy, {
          ascending: options.ascending ?? true
        });
      }

      // Apply limit
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as T[] | null, error: null };

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Get all organizations accessible to user
   * Returns all organizations for super admin, user's organizations for regular users
   */
  async getAccessibleOrganizations(
    profile: Profile | null,
    userId?: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      if (SuperAdminPermissionService.isSuperAdmin(profile)) {
        // Super admin can see all organizations
        const { data, error } = await this.supabase
          .from('organizations')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        return { data, error: null };
      } else {
        // Regular user can only see their organizations
        if (!userId) {
          return { data: [], error: null };
        }

        const { data, error } = await this.supabase
          .from('organization_memberships')
          .select('organization_id, organizations(*)')
          .eq('user_id', userId);

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        const organizations = (data || [])
          .map(membership => membership.organizations)
          .filter(Boolean);

        return { data: organizations, error: null };
      }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Determine if organization filter should be bypassed
   */
  private shouldBypassOrganizationFilter(options: SuperAdminQueryOptions): boolean {
    // Explicit bypass request
    if (options.bypassOrganizationFilter === true) {
      return true;
    }

    // Super admin can bypass unless explicitly requested not to
    const profile = options.profile || null;
    if (SuperAdminPermissionService.isSuperAdmin(profile)) {
      return options.bypassOrganizationFilter !== false;
    }

    return false;
  }
}

/**
 * Utility function to create enhanced query options for super admin
 */
export function createSuperAdminQueryOptions(
  baseOptions: QueryOptions,
  profile: Profile | null,
  bypassOrganizationFilter?: boolean
): SuperAdminQueryOptions {
  return {
    ...baseOptions,
    profile,
    bypassOrganizationFilter,
  };
}

/**
 * Enhanced version of the standard queryData function with super admin support
 */
export async function queryDataWithSuperAdmin<T = any>(
  supabase: SupabaseClient,
  table: string,
  selectFields: string,
  options: SuperAdminQueryOptions = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  const queryService = new SuperAdminQueryService(supabase);
  return queryService.queryData<T>(table, selectFields, options);
} 