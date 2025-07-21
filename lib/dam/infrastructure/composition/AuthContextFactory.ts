/**
 * Authentication Context Factory
 * 
 * Provides factory methods for creating AuthContextService instances
 * Handles dependency injection and composition
 */

import { createClient } from '@/lib/supabase/client';
import { AuthContextService } from '../../domain/services/AuthContextService';
import { SupabaseAuthContextRepository } from '../persistence/supabase/SupabaseAuthContextRepository';
import type { AuthContext } from '../../domain/repositories/IAuthContextRepository';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Legacy interface for backward compatibility
interface LegacyAuthContext {
  supabase: SupabaseClient;
  user: User | null;
  activeOrgId: string;
}

/**
 * Factory for creating configured AuthContextService instances
 */
export class AuthContextFactory {
  /**
   * Creates a configured AuthContextService instance
   * @returns Configured service ready for use
   */
  static createService(): AuthContextService {
    const repository = new SupabaseAuthContextRepository();
    return new AuthContextService(repository);
  }

  /**
   * Static helper for domain-compliant context
   * @returns Promise resolving to authentication context
   * @throws Error if authentication fails
   */
  static async getContext(): Promise<AuthContext> {
    const service = AuthContextFactory.createService();
    return service.getContext();
  }

  /**
   * Legacy interface for backward compatibility with application services
   * @returns Promise resolving to legacy authentication context
   * @throws Error if authentication fails
   * @deprecated Use getContext() for new code
   */
  static async getLegacyContext(): Promise<LegacyAuthContext> {
    const repository = new SupabaseAuthContextRepository();
    const result = await repository.getAuthContext();
    
    if (!result.success || !result.context) {
      throw new Error(result.error || 'Authentication failed');
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return {
      supabase,
      user,
      activeOrgId: result.context.organizationId
    };
  }
}