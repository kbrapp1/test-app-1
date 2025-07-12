/**
 * Global Authentication Service - Shared Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Single source of truth for all user authentication across the application
 * - Consolidates all supabase.auth.getUser() calls into one cached service
 * - Eliminates redundant validation calls from DAM, organization, and other domains
 * - Uses 5-second cache TTL with token hash security validation
 * - Provides both client-side and server-side authentication methods
 * - Follows @golden-rule patterns exactly
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createClientSide } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthenticationResult {
  user: User | null;
  isValid: boolean;
  fromCache: boolean;
  validationTimestamp: Date;
  tokenHash?: string;
}

interface CachedAuthData {
  user: User;
  timestamp: number;
  tokenHash: string;
}

export class GlobalAuthenticationService {
  private static instance: GlobalAuthenticationService;
  private userCache = new Map<string, CachedAuthData>();
  private readonly CACHE_TTL = 5000; // 5 seconds - matches SecurityAwareUserValidationService
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {}

  public static getInstance(): GlobalAuthenticationService {
    if (!GlobalAuthenticationService.instance) {
      GlobalAuthenticationService.instance = new GlobalAuthenticationService();
    }
    return GlobalAuthenticationService.instance;
  }

  /**
   * Get authenticated user with caching (server-side)
   * Replaces all supabase.auth.getUser() calls in server actions
   */
  async getAuthenticatedUser(): Promise<AuthenticationResult> {
    const supabase = createServerClient();
    const cacheKey = 'server-auth';

    try {
      // Get current token hash for security validation
      const currentTokenHash = await this.getCurrentTokenHash(supabase);
      
      // Check cache first
      const cached = this.userCache.get(cacheKey);
      if (this.isCacheValid(cached, currentTokenHash)) {
        return {
          user: cached!.user,
          isValid: true,
          fromCache: true,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash,
        };
      }

      // Fresh authentication required
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.logAuthEvent('AUTHENTICATION_FAILED', {
          error: error?.message || 'No user found',
          tokenHash: currentTokenHash,
        });
        
        return {
          user: null,
          isValid: false,
          fromCache: false,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash,
        };
      }

      // Cache the user data with security context
      this.cacheUserData(cacheKey, user, currentTokenHash);
      
      this.logAuthEvent('AUTHENTICATION_SUCCESS', {
        userId: user.id,
        tokenHash: currentTokenHash,
      });

      return {
        user,
        isValid: true,
        fromCache: false,
        validationTimestamp: new Date(),
        tokenHash: currentTokenHash,
      };

    } catch (error) {
      console.error('[GlobalAuthenticationService] Server auth error:', error);
      return {
        user: null,
        isValid: false,
        fromCache: false,
        validationTimestamp: new Date(),
      };
    }
  }

  /**
   * Get authenticated user with caching (client-side)
   * Replaces all client-side supabase.auth.getUser() calls
   */
  async getAuthenticatedUserClient(): Promise<AuthenticationResult> {
    const supabase = createClientSide();
    const cacheKey = 'client-auth';

    try {
      // Get current token hash for security validation
      const currentTokenHash = await this.getCurrentTokenHashClient(supabase);
      
      // Check cache first
      const cached = this.userCache.get(cacheKey);
      if (this.isCacheValid(cached, currentTokenHash)) {
        return {
          user: cached!.user,
          isValid: true,
          fromCache: true,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash,
        };
      }

      // Fresh authentication required
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return {
          user: null,
          isValid: false,
          fromCache: false,
          validationTimestamp: new Date(),
          tokenHash: currentTokenHash,
        };
      }

      // Cache the user data with security context
      this.cacheUserData(cacheKey, user, currentTokenHash);

      return {
        user,
        isValid: true,
        fromCache: false,
        validationTimestamp: new Date(),
        tokenHash: currentTokenHash,
      };

    } catch (error) {
      console.error('[GlobalAuthenticationService] Client auth error:', error);
      return {
        user: null,
        isValid: false,
        fromCache: false,
        validationTimestamp: new Date(),
      };
    }
  }

  /**
   * Invalidate authentication cache (for security events)
   */
  invalidateCache(): void {
    this.userCache.clear();
    this.logAuthEvent('CACHE_INVALIDATED', {});
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number; recentEvents: number } {
    return {
      size: this.userCache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      recentEvents: this.userCache.size,
    };
  }

  // Private helper methods

  private async getCurrentTokenHash(supabase: any): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ? 
        session.access_token.substring(0, 20) : 
        'no-token';
    } catch {
      return 'no-token';
    }
  }

  private async getCurrentTokenHashClient(supabase: any): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ? 
        session.access_token.substring(0, 20) : 
        'no-token';
    } catch {
      return 'no-token';
    }
  }

  private isCacheValid(cached: CachedAuthData | undefined, currentTokenHash: string): boolean {
    if (!cached) return false;
    
    const isWithinTTL = (Date.now() - cached.timestamp) < this.CACHE_TTL;
    const isTokenValid = cached.tokenHash === currentTokenHash;
    
    return isWithinTTL && isTokenValid;
  }

  private cacheUserData(cacheKey: string, user: User, tokenHash: string): void {
    // Implement cache size management
    if (this.userCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.userCache.keys().next().value;
      if (oldestKey) {
        this.userCache.delete(oldestKey);
      }
    }

    this.userCache.set(cacheKey, {
      user,
      timestamp: Date.now(),
      tokenHash,
    });
  }

  private logAuthEvent(event: string, context: Record<string, any>): void {
    console.log('[GLOBAL_AUTH]', {
      timestamp: new Date().toISOString(),
      event,
      context,
      source: 'GlobalAuthenticationService',
    });
  }
} 