/**
 * JWT Token Adapter - Anti-Corruption Layer
 * 
 * AI INSTRUCTIONS:
 * - Isolate domain from JWT implementation details
 * - Handle token validation and extraction
 * - Transform JWT claims to domain objects
 * - Protect domain from token format changes
 * - Keep under 200 lines following @golden-rule
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { TokenClaims } from '../../domain/services/TokenService';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

export interface TokenValidationResult {
  isValid: boolean;
  claims?: TokenClaims;
  error?: string;
}

export interface OrganizationContext {
  userId: UserId;
  organizationId: OrganizationId;
  permissions: string[];
}

export class JwtTokenAdapter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Validate JWT token and extract claims
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Use Supabase to validate the token
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        return {
          isValid: false,
          error: 'Invalid or expired token'
        };
      }

      // Extract claims from the validated user
      const claims = this.extractClaims(data.user);

      return {
        isValid: true,
        claims
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Get current session token
   */
  async getCurrentToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      return session.access_token;
    } catch {
      return null;
    }
  }

  /**
   * Extract organization context from JWT token
   */
  async getOrganizationContext(token?: string): Promise<OrganizationContext | null> {
    try {
      const { data, error } = token 
        ? await this.supabase.auth.getUser(token)
        : await this.supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      const activeOrgId = data.user.app_metadata?.active_organization_id;
      if (!activeOrgId) {
        throw new BusinessRuleViolationError(
          'User has no active organization context',
          { userId: data.user.id }
        );
      }

      const userId = UserId.create(data.user.id);
      const organizationId = OrganizationId.create(activeOrgId);

      // Extract permissions from user metadata or roles
      const permissions = this.extractPermissions(data.user);

      return {
        userId,
        organizationId,
        permissions
      };

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(token: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        // If we get an error, assume token is expired/invalid
        return true;
      }

      return !data.user;
    } catch {
      return true;
    }
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error || !data.session) {
        return null;
      }

      return data.session.access_token;
    } catch {
      return null;
    }
  }

  /**
   * Extract token claims from Supabase user
   */
  private extractClaims(user: User): TokenClaims {
    return {
      sub: user.id,
      custom_claims: {
        active_organization_id: user.app_metadata?.active_organization_id
      },
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      iat: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Extract permissions from user metadata
   */
  private extractPermissions(user: User): string[] {
    // Get permissions from app_metadata or user role
    const permissions = user.app_metadata?.permissions || [];
    const role = user.app_metadata?.role;

    // Add role-based permissions
    if (role) {
      permissions.push(`role:${role}`);
    }

    // Add organization-specific permissions
    const orgPermissions = user.app_metadata?.organization_permissions || [];
    permissions.push(...orgPermissions);

    return permissions;
  }

  /**
   * Update user's organization context in token
   */
  async updateOrganizationContext(userId: UserId, organizationId: OrganizationId): Promise<void> {
    try {
      const { error } = await this.supabase.auth.admin.updateUserById(
        userId.value,
        {
          app_metadata: {
            active_organization_id: organizationId.value
          }
        }
      );

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to update organization context',
          { userId: userId.value, organizationId: organizationId.value, error: error.message }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to update organization context',
        { userId: userId.value, organizationId: organizationId.value }
      );
    }
  }

  /**
   * Validate organization access for current token
   */
  async validateOrganizationAccess(organizationId: OrganizationId, token?: string): Promise<boolean> {
    try {
      const context = await this.getOrganizationContext(token);
      
      if (!context) {
        return false;
      }

      return context.organizationId.equals(organizationId);
    } catch {
      return false;
    }
  }
} 