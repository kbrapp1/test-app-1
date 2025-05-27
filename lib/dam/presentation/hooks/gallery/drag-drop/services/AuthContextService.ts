/**
 * Domain Service: Authentication Context
 * 
 * Single Responsibility: Provides authenticated context for drag operations
 * Encapsulates authentication and organization context logic
 */

import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthContext {
  supabase: SupabaseClient;
  user: any;
  activeOrgId: string;
}

export class AuthContextService {
  /**
   * Gets the authenticated context required for drag operations
   * @returns Promise resolving to authentication context
   * @throws Error if authentication fails
   */
  static async getContext(): Promise<AuthContext> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No session found');

    const decodedToken = jwtDecode<any>(session.access_token);
    
    // Try to get organization ID from custom_claims first (auth hook), then fallback to app_metadata
    const activeOrgId = decodedToken.custom_claims?.active_organization_id || 
                        decodedToken.app_metadata?.active_organization_id;
    
    if (!activeOrgId) throw new Error('No active organization found');

    return { supabase, user, activeOrgId };
  }
} 