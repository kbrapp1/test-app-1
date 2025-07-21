// Domain Service: Organization Context Management
// Single Responsibility: Handle user organization context operations
// DDD: Clean domain logic separation with proper error handling

import { IOrganizationContextRepository } from '../repositories';

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
  context?: Record<string, unknown>;
}

export class OrganizationContextService {
  constructor(private readonly repository: IOrganizationContextRepository) {}

  // Get current user's organization context
  async getCurrentContext(): Promise<OrganizationContext | null> {
    try {
      const userId = await this.repository.getCurrentUserId();
      
      if (!userId) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      const context = await this.repository.getCurrentContext(userId);
      return context;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Failed to get current context', { error });
    }
  }

  // Switch user's active organization with access validation
  async switchOrganization(organizationId: string): Promise<void> {
    if (!organizationId?.trim()) {
      throw this.createError('VALIDATION_ERROR', 'Organization ID is required');
    }

    try {
      const userId = await this.repository.getCurrentUserId();
      
      if (!userId) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      await this.repository.switchOrganization(userId, organizationId);
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
      const userId = await this.repository.getCurrentUserId();
      
      if (!userId) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      await this.repository.clearContext(userId);
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
      const userId = await this.repository.getCurrentUserId();
      
      if (!userId) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      await this.repository.updateLastAccessed(userId);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error updating last accessed', { error });
    }
  }

  // Verify user has access to specific organization
  async verifyOrganizationAccess(organizationId: string): Promise<boolean> {
    try {
      const userId = await this.repository.getCurrentUserId();
      
      if (!userId) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated');
      }

      return await this.repository.verifyOrganizationAccess(userId, organizationId);
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