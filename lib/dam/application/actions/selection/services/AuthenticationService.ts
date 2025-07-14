/**
 * Domain Service: Authentication
 * 
 * Single Responsibility: Handles authentication and organization context
 * Encapsulates authentication logic for server actions
 */

import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth';
import type { AuthenticatedContext } from '../types';

export class AuthenticationService {
  /**
   * Gets authenticated context for server actions
   * @returns Promise resolving to authenticated context
   * @throws Error if authentication fails
   */
  static async getAuthenticatedContext(): Promise<AuthenticatedContext> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    if (!user.email) {
      throw new Error('User email is required');
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      throw new Error('No active organization found');
    }

    return {
      user: {
        id: user.id,
        email: user.email
      },
      organizationId
    };
  }

  /**
   * Creates a Supabase client for authenticated operations
   * @returns Supabase client instance
   */
  static createSupabaseClient() {
    return createClient();
  }
} 