// Infrastructure Repository: Supabase Organization Context Implementation
// Single Responsibility: Handle Supabase-specific organization context operations
// DDD: Infrastructure layer implementation of domain repository interface

import { SupabaseClient } from '@supabase/supabase-js';
import { IOrganizationContextRepository, OrganizationContextData } from '../../domain/repositories';

export class SupabaseOrganizationContextRepository implements IOrganizationContextRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getCurrentContext(userId: string): Promise<OrganizationContextData | null> {
    try {
      // Get the current organization context for the user
      const { data, error } = await this.supabase
        .from('user_organization_context')
        .select(`
          id,
          user_id,
          active_organization_id,
          last_accessed_at,
          created_at,
          updated_at,
          organizations!inner(
            name,
            feature_flags
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        active_organization_id: data.active_organization_id,
        last_accessed_at: data.last_accessed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        organization_name: data.organizations?.[0]?.name || 'Unknown',
        feature_flags: data.organizations?.[0]?.feature_flags || {}
      };
    } catch (error: unknown) {
      throw new Error(`Failed to get current context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async switchOrganization(userId: string, organizationId: string): Promise<void> {
    try {
      // Validate user has access to the organization
      const hasAccess = await this.verifyOrganizationAccess(userId, organizationId);
      if (!hasAccess) {
        throw new Error('User does not have access to this organization');
      }

      // Update or insert organization context
      const { error: upsertError } = await this.supabase
        .from('user_organization_context')
        .upsert({
          user_id: userId,
          active_organization_id: organizationId,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw new Error(`Failed to switch organization: ${upsertError.message}`);
      }
    } catch (error: unknown) {
      throw new Error(`Switch organization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearContext(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_organization_context')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to clear context: ${error.message}`);
      }
    } catch (error: unknown) {
      throw new Error(`Clear context failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLastAccessed(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_organization_context')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update last accessed: ${error.message}`);
      }
    } catch (error: unknown) {
      throw new Error(`Update last accessed failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('user_has_org_access', { 
          org_id: organizationId
        });

      if (error) {
        throw new Error(`Access verification failed: ${error.message}`);
      }

      return data === true;
    } catch (error: unknown) {
      throw new Error(`Verify organization access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        throw new Error(`Authentication error: ${error.message}`);
      }

      return user?.id || null;
    } catch (error: unknown) {
      throw new Error(`Get current user failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}