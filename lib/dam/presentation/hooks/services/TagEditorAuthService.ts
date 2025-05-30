import { AuthContext } from './TagEditorTypes';

/**
 * Service responsible for authentication context management
 * Handles user authentication and organization context retrieval
 */
export class TagEditorAuthService {
  /**
   * Gets authentication context including user and organization
   */
  async getAuthContext(): Promise<AuthContext> {
    // Dynamic imports to avoid SSR issues
    const { createClient } = await import('@/lib/supabase/client');
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use database-first organization context (single source of truth)
    const { data: activeOrgId, error } = await supabase.rpc('get_active_organization_id');
    
    if (error || !activeOrgId) {
      throw new Error('No active organization found');
    }

    return { supabase, user, activeOrgId };
  }
} 
