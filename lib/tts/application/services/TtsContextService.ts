/**
 * TTS Context Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Single validation point for all TTS operations
 * - Integrates with SecurityAwareUserValidationService and OrganizationContextCache
 * - Comprehensive security compliance with audit logging
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on validation orchestration
 * - Fail-secure defaults with detailed error context
 */

import { User } from '@supabase/supabase-js';
import { SecurityAwareUserValidationService } from '@/lib/auth/infrastructure/SecurityAwareUserValidationService';
import { OrganizationContextCache } from '@/lib/organization/infrastructure/OrganizationContextCache';
import { TtsAccessControlService } from './TtsAccessControlService';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export interface TtsValidationResult {
  isValid: boolean;
  user: User;
  organizationId: string;
  error?: string;
  securityContext: {
    fromCache: boolean;
    timestamp: Date;
    validationMethod: string;
    tokenHash?: string;
    securityVersion?: number;
  };
}

export class TtsContextService {
  private static instance: TtsContextService;
  private validationService: SecurityAwareUserValidationService;
  private organizationCache: OrganizationContextCache;

  private constructor() {
    this.validationService = SecurityAwareUserValidationService.getInstance();
    this.organizationCache = OrganizationContextCache.getInstance();
  }

  static getInstance(): TtsContextService {
    if (!this.instance) {
      this.instance = new TtsContextService();
    }
    return this.instance;
  }

  /**
   * Validate TTS operation with comprehensive security checks
   */
  async validateTtsOperation(): Promise<TtsValidationResult> {
    try {
      // Single validation point with security context
      const validation = await this.validationService.validateUserWithOrganization();
      
      if (!validation.isValid) {
        this.logValidationEvent('VALIDATION_FAILED', {
          error: 'Invalid user or organization context',
          fromCache: validation.fromCache,
          tokenHash: validation.tokenHash
        });
        
        return {
          isValid: false,
          user: validation.user,
          organizationId: '',
          error: 'Invalid user or organization context',
          securityContext: {
            fromCache: validation.fromCache,
            timestamp: new Date(),
            validationMethod: 'FAILED',
            tokenHash: validation.tokenHash
          }
        };
      }

      // Additional TTS-specific security checks
      try {
        await this.checkTtsFeatureAccess(validation.organizationId);
      } catch (error) {
        this.logValidationEvent('FEATURE_ACCESS_DENIED', {
          organizationId: validation.organizationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return {
          isValid: false,
          user: validation.user,
          organizationId: validation.organizationId,
          error: 'TTS feature access denied',
          securityContext: {
            fromCache: validation.fromCache,
            timestamp: new Date(),
            validationMethod: 'FEATURE_DENIED',
            tokenHash: validation.tokenHash
          }
        };
      }

      // Log successful validation
      this.logValidationEvent('VALIDATION_SUCCESS', {
        userId: validation.user.id,
        organizationId: validation.organizationId,
        fromCache: validation.fromCache,
        tokenHash: validation.tokenHash
      });

      return {
        isValid: true,
        user: validation.user,
        organizationId: validation.organizationId,
        securityContext: {
          fromCache: validation.fromCache,
          timestamp: new Date(),
          validationMethod: validation.fromCache ? 'CACHED' : 'FRESH',
          tokenHash: validation.tokenHash
        }
      };

    } catch (error) {
      this.logValidationEvent('VALIDATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        isValid: false,
        user: null as any,
        organizationId: '',
        error: 'TTS validation failed',
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'ERROR'
        }
      };
    }
  }

  /**
   * Validate TTS operation with pre-validated context (for use cases)
   */
  async validateWithContext(user: User, organizationId: string): Promise<TtsValidationResult> {
    try {
      // Verify the provided context is still valid
      const orgContext = await this.organizationCache.getOrganizationContext(user.id);
      
      if (!orgContext || orgContext.active_organization_id !== organizationId) {
        this.logValidationEvent('CONTEXT_MISMATCH', {
          userId: user.id,
          providedOrgId: organizationId,
          actualOrgId: orgContext?.active_organization_id
        });
        
        return {
          isValid: false,
          user,
          organizationId: '',
          error: 'Organization context mismatch',
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'CONTEXT_MISMATCH'
          }
        };
      }

      // Check TTS feature access
      await this.checkTtsFeatureAccess(organizationId);

      this.logValidationEvent('CONTEXT_VALIDATION_SUCCESS', {
        userId: user.id,
        organizationId
      });

      return {
        isValid: true,
        user,
        organizationId,
        securityContext: {
          fromCache: true,
          timestamp: new Date(),
          validationMethod: 'CONTEXT_VALIDATED'
        }
      };

    } catch (error) {
      this.logValidationEvent('CONTEXT_VALIDATION_ERROR', {
        userId: user.id,
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        isValid: false,
        user,
        organizationId: '',
        error: 'Context validation failed',
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'CONTEXT_ERROR'
        }
      };
    }
  }

  /**
   * Check TTS feature access using already-validated organization context
   * This prevents redundant organization ID fetches
   */
  private async checkTtsFeatureAccess(organizationId: string): Promise<void> {
    // Use shared access control with pre-validated organization context
    const supabase = createSupabaseServerClient();
    
    // Check feature flag directly with known organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', organizationId)
      .single();
    
    // Feature flag default behavior: All features default to enabled when flag is missing
    const isFeatureEnabled = org?.feature_flags?.['tts'] ?? true;
    if (!isFeatureEnabled) {
      throw new Error('TTS feature is not enabled for this organization');
    }
  }

  /**
   * Invalidate security cache on security events
   */
  invalidateSecurityCache(userId: string, event: 'org-switch' | 'role-change' | 'permission-change'): void {
    // Clear user validation cache
    this.validationService.clearSecurityCache();
    
    // Clear organization context cache
    this.organizationCache.invalidateOnSecurityEvent(userId, event);
    
    this.logValidationEvent('SECURITY_CACHE_INVALIDATED', {
      userId,
      event,
      reason: 'Security event triggered cache invalidation'
    });
  }

  /**
   * Log validation events for security monitoring
   */
  private logValidationEvent(event: string, context: Record<string, any> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      context,
      source: 'TtsContextService',
      domain: 'tts'
    };
    
    // Enhanced audit logging for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('[TTS_SECURITY]', logEntry);
    } else {
      // Production: structured logging for monitoring systems
      console.log('[AUDIT]', JSON.stringify(logEntry));
    }
  }

  /**
   * Get validation statistics for monitoring
   */
  getValidationStats(): {
    userValidationCache: any;
    organizationCache: any;
  } {
    return {
      userValidationCache: this.validationService.getCacheStats(),
      organizationCache: this.organizationCache.getCacheStats()
    };
  }
} 