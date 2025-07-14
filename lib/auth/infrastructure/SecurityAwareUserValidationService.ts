/**
 * Security-Aware User Validation Service - Auth Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Token hash tracking with 5-second cache TTL for security
 * - Comprehensive audit logging for security monitoring
 * - Validate user and organization context in single call
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on validation logic
 * - Fail-secure defaults with detailed error context
 */

import { createClient } from '@/lib/supabase/server';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface UserValidationResult {
  user: User;
  organizationId: string;
  isValid: boolean;
  fromCache: boolean;
  validationTimestamp: Date;
  tokenHash: string;
}

interface CachedUserValidation {
  user: User;
  organizationId: string;
  timestamp: number;
  tokenHash: string;
}

export class SecurityAwareUserValidationService {
  private static instance: SecurityAwareUserValidationService;
  private userCache = new Map<string, CachedUserValidation>();
  private readonly CACHE_TTL = 5000; // 5 seconds (security-conscious)
  private readonly MAX_CACHE_SIZE = 100; // Prevent memory leaks

  static getInstance(): SecurityAwareUserValidationService {
    if (!this.instance) {
      this.instance = new SecurityAwareUserValidationService();
    }
    return this.instance;
  }

  /**
   * Validate user with organization context and security logging
   */
  async validateUserWithOrganization(): Promise<UserValidationResult> {
    const supabase = createClient();
    const sessionKey = 'current-session';
    
    try {
      // Get current token hash for security comparison
      const currentTokenHash = await this.getCurrentTokenHash(supabase);
      
      // Check cache first (with security validation)
      const cached = this.userCache.get(sessionKey);
      if (this.isCacheValid(cached, currentTokenHash)) {
        // Log cache hit for monitoring
        this.logValidationEvent(cached!.user.id, 'CACHE_HIT', {
          tokenHash: currentTokenHash,
          organizationId: cached!.organizationId
        });
        
        return {
          user: cached!.user,
          organizationId: cached!.organizationId,
          isValid: true,
          fromCache: true,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash
        };
      }

      // Fresh validation required
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        this.logValidationEvent(null, 'VALIDATION_FAILED', {
          error: error?.message || 'No user found',
          tokenHash: currentTokenHash
        });
        
        return {
          user: null as unknown as User,
          organizationId: '',
          isValid: false,
          fromCache: false,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash
        };
      }

      // Get organization context
      const organizationId = await this.getOrganizationId(supabase, user.id);
      
      if (!organizationId) {
        this.logValidationEvent(user.id, 'NO_ORGANIZATION_CONTEXT', {
          tokenHash: currentTokenHash
        });
        
        return {
          user,
          organizationId: '',
          isValid: false,
          fromCache: false,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash
        };
      }

      // Cache the validated result
      this.cacheValidation(sessionKey, user, organizationId, currentTokenHash);

      // Log fresh validation
      this.logValidationEvent(user.id, 'FRESH_VALIDATION', {
        tokenHash: currentTokenHash,
        organizationId
      });
      
      return {
        user,
        organizationId,
        isValid: true,
        fromCache: false,
        validationTimestamp: new Date(),
        tokenHash: currentTokenHash
      };

    } catch (error) {
      this.logValidationEvent(null, 'VALIDATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Get current token hash for security comparison
   */
  private async getCurrentTokenHash(supabase: SupabaseClient): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ? this.hashToken(session.access_token) : '';
    } catch {
      return '';
    }
  }

  /**
   * Simple hash for token comparison (not for security)
   */
  private hashToken(token: string): string {
    if (!token || token.length < 20) return '';
    return token.substring(0, 10) + token.substring(token.length - 10);
  }

  /**
   * Check if cached validation is still valid
   */
  private isCacheValid(cached: CachedUserValidation | undefined, currentTokenHash: string): boolean {
    if (!cached) return false;
    
    const now = Date.now();
    const isWithinTTL = (now - cached.timestamp) < this.CACHE_TTL;
    const isTokenValid = cached.tokenHash === currentTokenHash;
    
    return isWithinTTL && isTokenValid;
  }

  /**
   * Get organization ID for user
   */
  private async getOrganizationId(supabase: SupabaseClient, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_organization_context')
        .select('active_organization_id')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return null;
      }

      return data.active_organization_id;
    } catch {
      return null;
    }
  }

  /**
   * Cache validation result with memory management
   */
  private cacheValidation(sessionKey: string, user: User, organizationId: string, tokenHash: string): void {
    // Prevent memory leaks
    if (this.userCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.userCache.keys().next().value;
      if (oldestKey) {
        this.userCache.delete(oldestKey);
      }
    }

    this.userCache.set(sessionKey, {
      user,
      organizationId,
      timestamp: Date.now(),
      tokenHash
    });
  }

  /**
   * Enhanced audit logging for security monitoring
   */
  private logValidationEvent(userId: string | null, event: string, context: Record<string, unknown> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event,
      context,
      source: 'SecurityAwareUserValidationService',
      sessionId: this.generateSessionId()
    };
    
    // Enhanced audit logging for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH_AUDIT]', logEntry);
    } else {
      // Production: structured logging for monitoring systems
      console.log('[AUDIT]', JSON.stringify(logEntry));
    }
  }

  /**
   * Generate session ID for audit correlation
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear security cache on security events
   */
  clearSecurityCache(): void {
    this.userCache.clear();
    this.logValidationEvent(null, 'SECURITY_CACHE_CLEARED', {
      reason: 'Security event triggered cache invalidation'
    });
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    hitRate?: number;
  } {
    return {
      size: this.userCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL
    };
  }
} 