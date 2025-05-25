import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No session found');
    }

    const decodedToken = jwtDecode<any>(session.access_token);
    const activeOrgId = decodedToken.custom_claims?.active_organization_id;
    
    if (!activeOrgId) {
      throw new Error('No active organization found');
    }

    return { supabase, user, activeOrgId };
  }
} 
