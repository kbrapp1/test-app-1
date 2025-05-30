/**
 * Domain Service: Authentication Context
 * 
 * Single Responsibility: Provides authenticated context for drag operations
 * Encapsulates authentication and organization context logic
 */

import { createClient } from '@/lib/supabase/client';

interface AuthContext {
  supabase: any;
  user: any;
  activeOrgId: string;
}

/**
 * Authentication context service for drag and drop operations
 * Provides authentication context required for drag operations
 */
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

    // Use database-first organization context (single source of truth)
    const { data: activeOrgId, error } = await supabase.rpc('get_active_organization_id');
    if (error || !activeOrgId) throw new Error('No active organization found');

    return { supabase, user, activeOrgId };
  }
} 