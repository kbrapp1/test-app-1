/**
 * Application Service: Super Admin Mutations
 * 
 * Single Responsibility: Handles data mutations with super admin cross-organization support
 * Ensures super admin can perform operations across all organizations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from './types';
import { SuperAdminPermissionService } from './permissions';

export interface MutationOptions {
  organizationId?: string;
  userId?: string;
  profile?: Profile | null;
  skipOrganizationValidation?: boolean;
}

/**
 * Super Admin Mutation Service
 * Enhances database mutations with super admin cross-organization support
 */
export class SuperAdminMutationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Insert data with super admin organization handling
   */
  async insertData<T = Record<string, unknown>>(
    table: string,
    insertValues: Record<string, unknown>,
    options: MutationOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const finalValues = { ...insertValues };

      // Auto-inject organization_id for regular users, optional for super admin
      if (options.organizationId && !this.shouldSkipOrganizationValidation(options)) {
        finalValues.organization_id = options.organizationId;
      }

      const { data: result, error } = await this.supabase
        .from(table)
        .insert(finalValues)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: result as T | null, error: null };

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Update data with super admin cross-organization support
   */
  async updateData<T = Record<string, unknown>>(
    table: string,
    updateValues: Record<string, unknown>,
    matchColumn: string,
    matchValue: string | number,
    options: MutationOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      let queryBuilder = this.supabase
        .from(table)
        .update(updateValues)
        .eq(matchColumn, matchValue);

      // Apply organization filter for regular users
      if (options.organizationId && !this.shouldSkipOrganizationValidation(options)) {
        queryBuilder = queryBuilder.eq('organization_id', options.organizationId);
      }

      const { data: result, error } = await queryBuilder
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: result as T | null, error: null };

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Delete data with super admin cross-organization support
   */
  async deleteData(
    table: string,
    matchColumn: string,
    matchValue: string | number,
    options: MutationOptions = {}
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      let queryBuilder = this.supabase
        .from(table)
        .delete()
        .eq(matchColumn, matchValue);

      // Apply organization filter for regular users
      if (options.organizationId && !this.shouldSkipOrganizationValidation(options)) {
        queryBuilder = queryBuilder.eq('organization_id', options.organizationId);
      }

      const { error } = await queryBuilder;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Transfer entity between organizations (super admin only)
   */
  async transferBetweenOrganizations<T = Record<string, unknown>>(
    table: string,
    entityId: string,
    fromOrganizationId: string,
    toOrganizationId: string,
    options: MutationOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    // Only super admins can transfer between organizations
    const profile = options.profile || null;
    if (!SuperAdminPermissionService.isSuperAdmin(profile)) {
      return { 
        data: null, 
        error: new Error('Only super administrators can transfer entities between organizations')
      };
    }

    try {
      const { data, error } = await this.supabase
        .from(table)
        .update({ organization_id: toOrganizationId })
        .eq('id', entityId)
        .eq('organization_id', fromOrganizationId)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as T | null, error: null };

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Determine if organization validation should be skipped
   */
  private shouldSkipOrganizationValidation(options: MutationOptions): boolean {
    // Explicit skip request
    if (options.skipOrganizationValidation === true) {
      return true;
    }

    // Super admin can skip organization validation
    const profile = options.profile || null;
    return SuperAdminPermissionService.isSuperAdmin(profile);
  }
}

/**
 * Utility functions for components
 */

/**
 * Enhanced insert with super admin support
 */
export async function insertDataWithSuperAdmin<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  insertValues: Record<string, unknown>,
  options: MutationOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const mutationService = new SuperAdminMutationService(supabase);
  return mutationService.insertData<T>(table, insertValues, options);
}

/**
 * Enhanced update with super admin support
 */
export async function updateDataWithSuperAdmin<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  updateValues: Record<string, unknown>,
  matchColumn: string,
  matchValue: string | number,
  options: MutationOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const mutationService = new SuperAdminMutationService(supabase);
  return mutationService.updateData<T>(table, updateValues, matchColumn, matchValue, options);
}

/**
 * Enhanced delete with super admin support
 */
export async function deleteDataWithSuperAdmin(
  supabase: SupabaseClient,
  table: string,
  matchColumn: string,
  matchValue: string | number,
  options: MutationOptions = {}
): Promise<{ success: boolean; error: Error | null }> {
  const mutationService = new SuperAdminMutationService(supabase);
  return mutationService.deleteData(table, matchColumn, matchValue, options);
} 