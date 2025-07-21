/**
 * Supabase Authentication Context Repository
 * 
 * Infrastructure implementation of IAuthContextRepository
 * Handles authentication operations using Supabase
 */

import { createClient } from '@/lib/supabase/client';
import { getActiveOrganizationId } from '@/lib/auth';
import type { 
  IAuthContextRepository, 
  AuthContextResult 
} from '../../../domain/repositories/IAuthContextRepository';

export class SupabaseAuthContextRepository implements IAuthContextRepository {
  /**
   * Retrieves authenticated user context with organization
   * @returns Promise resolving to authentication context result
   */
  async getAuthContext(): Promise<AuthContextResult> {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: false, 
          error: 'User not authenticated' 
        };
      }

      // Get active organization using centralized auth service
      const organizationId = await getActiveOrganizationId();
      if (!organizationId) {
        return { 
          success: false, 
          error: 'No active organization found' 
        };
      }

      return {
        success: true,
        context: {
          userId: user.id,
          organizationId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Validates if user has access to organization
   * @param userId - User identifier
   * @param organizationId - Organization identifier  
   * @returns Promise resolving to boolean indicating access
   */
  async validateUserAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      // Check if user belongs to the organization
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
}