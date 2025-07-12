/**
 * Token Service - Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Focus on basic token validation only
 * - Support organization context validation
 * - Keep aligned with current Supabase auth usage
 * - No over-engineering - match current app needs
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';
import { OrganizationId } from '../value-objects/OrganizationId';
import { UserId } from '../value-objects/UserId';
import { TokenHash } from '../value-objects/TokenHash';

export interface TokenValidationResult {
  isValid: boolean;
  userId?: UserId;
  organizationId?: OrganizationId;
  expiresAt?: Date;
  reason?: string;
}

export interface TokenClaims {
  sub: string; // User ID
  custom_claims?: {
    active_organization_id?: string;
  };
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Domain service for token validation and organization context
 * 
 * Handles business logic for:
 * - Basic JWT token validation
 * - Organization context extraction
 * - Token expiration checking
 */
export class TokenService {
  /**
   * Validates JWT token and extracts claims
   */
  static validateToken(tokenHash: TokenHash): TokenValidationResult {
    try {
      // Basic token format validation
      if (tokenHash.isEmpty()) {
        return {
          isValid: false,
          reason: 'Invalid token format'
        };
      }

      // Extract claims from token (simplified - in real app, Supabase handles this)
      const claims = this.extractClaims(tokenHash);
      
      if (!claims) {
        return {
          isValid: false,
          reason: 'Unable to extract token claims'
        };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp && claims.exp < now) {
        return {
          isValid: false,
          reason: 'Token has expired'
        };
      }

      // Extract user ID
      const userId = claims.sub ? UserId.create(claims.sub) : undefined;
      if (!userId) {
        return {
          isValid: false,
          reason: 'Invalid user ID in token'
        };
      }

      // Extract organization ID (optional)
      const organizationId = claims.custom_claims?.active_organization_id 
        ? OrganizationId.create(claims.custom_claims.active_organization_id)
        : undefined;

      return {
        isValid: true,
        userId,
        organizationId,
        expiresAt: claims.exp ? new Date(claims.exp * 1000) : undefined
      };

    } catch (error) {
      return {
        isValid: false,
        reason: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Validates organization context from token
   */
  static validateOrganizationContext(
    tokenHash: TokenHash, 
    expectedOrganizationId: OrganizationId
  ): boolean {
    const validation = this.validateToken(tokenHash);
    
    if (!validation.isValid || !validation.organizationId) {
      return false;
    }

    return validation.organizationId.equals(expectedOrganizationId);
  }

  /**
   * Checks if token is expired
   */
  static isTokenExpired(tokenHash: TokenHash): boolean {
    const validation = this.validateToken(tokenHash);
    return !validation.isValid && validation.reason === 'Token has expired';
  }

  /**
   * Extracts basic claims from token
   * Note: In real app, this would use proper JWT library
   */
  private static extractClaims(tokenHash: TokenHash): TokenClaims | null {
    try {
      // This is a simplified version - in real app, Supabase handles JWT parsing
      // We're just defining the interface for business logic
      
      // In actual implementation, this would:
      // 1. Parse JWT token
      // 2. Verify signature
      // 3. Extract claims
      
      // For now, return null to indicate we rely on Supabase's JWT handling
      return null;
      
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to extract token claims',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Validates user has access to organization
   */
  static validateUserOrganizationAccess(
    userId: UserId,
    organizationId: OrganizationId
  ): boolean {
    if (!userId || !organizationId) {
      throw new BusinessRuleViolationError(
        'User ID and Organization ID are required',
        { hasUserId: !!userId, hasOrganizationId: !!organizationId }
      );
    }

    // Business rule: User must have valid organization context
    // In real app, this would check database for membership
    return true; // Simplified - actual validation happens in infrastructure layer
  }
} 