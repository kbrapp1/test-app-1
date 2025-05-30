import { createClient } from '@/lib/supabase/client';

export interface AuthContext {
  supabase: any;
  user: any;
  activeOrgId: string;
}

/**
 * Domain service for authentication context
 * Provides reusable authentication logic across DAM operations
 */
export class AuthContextService {
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
