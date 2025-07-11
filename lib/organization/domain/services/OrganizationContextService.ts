// Domain Service: Organization Context Management
// Single Responsibility: Handle user organization context operations
// DDD: Clean domain logic separation with proper error handling

import { createClient } from '@/lib/supabase/client';

export interface OrganizationContext {
  id?: string;
  user_id: string;
  active_organization_id: string | null;
  last_accessed_at: string;
  created_at?: string;
  updated_at: string;
  organization_name: string;
  feature_flags: Record<string, boolean>;
}

export interface OrganizationContextError extends Error {
  code: 'UNAUTHORIZED' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'DATABASE_ERROR';
  context?: any;
}

export class OrganizationContextService {
  private supabase = createClient();

  // Get current user's organization context
  async getCurrentContext(): Promise<OrganizationContext | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

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
        .eq('user_id', user.id)
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
      throw error;
    }
  }

  // Switch user's active organization with access validation
  async switchOrganization(organizationId: string): Promise<void> {
    if (!organizationId?.trim()) {
      throw this.createError('VALIDATION_ERROR', 'Organization ID is required');
    }

    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        throw this.createError('UNAUTHORIZED', `Authentication failed: ${authError.message}`, { authError });
      }
      
      if (!user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      // Validate user has access to the organization
      const hasAccess = await this.supabase.rpc('user_has_org_access', {
        org_id: organizationId
      });

      if (hasAccess.error) {
        throw this.createError('DATABASE_ERROR', `Access validation failed: ${hasAccess.error.message}`);
      }

      if (!hasAccess.data) {
        throw this.createError('ACCESS_DENIED', 'User does not have access to this organization');
      }

      // Update or insert organization context
      const { error: upsertError } = await this.supabase
        .from('user_organization_context')
        .upsert({
          user_id: user.id,
          active_organization_id: organizationId,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw this.createError('DATABASE_ERROR', `Failed to switch organization: ${upsertError.message}`, { 
          error: upsertError, 
          userId: user.id, 
          organizationId 
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error switching organization', { error });
    }
  }

  // Clear user's organization context
  async clearContext(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      const { error } = await this.supabase
        .from('user_organization_context')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw this.createError('DATABASE_ERROR', `Failed to clear context: ${error.message}`, { error });
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error clearing context', { error });
    }
  }

  // Update last accessed timestamp for current context
  async updateLastAccessed(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      const { error } = await this.supabase
        .from('user_organization_context')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        throw this.createError('DATABASE_ERROR', `Failed to update last accessed: ${error.message}`, { error });
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error updating last accessed', { error });
    }
  }

  // Verify user has access to specific organization
  private async verifyOrganizationAccess(organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('user_has_org_access', { org_id: organizationId });

      if (error) {
        throw this.createError('DATABASE_ERROR', `Access verification failed: ${error.message}`, { error });
      }

      return data === true;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error verifying access', { error });
    }
  }

  // Create a standardized error with proper typing
  private createError(
    code: OrganizationContextError['code'], 
    message: string, 
    context?: Record<string, unknown>
  ): OrganizationContextError {
    const error = new Error(message) as OrganizationContextError;
    error.code = code;
    error.context = context;
    return error;
  }
} 