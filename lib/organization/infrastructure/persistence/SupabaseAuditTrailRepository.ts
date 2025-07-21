/**
 * Supabase Audit Trail Repository
 * 
 * Infrastructure implementation of IAuditTrailRepository
 * Handles audit trail operations using Supabase
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  IAuditTrailRepository,
  AuditMetadata,
  AuditTrailFilters,
  AuditTrailResult,
  AuditSummary,
  AuthResult,
  PermissionResult
} from '../../domain/repositories/IAuditTrailRepository';

export class SupabaseAuditTrailRepository implements IAuditTrailRepository {
  private supabase = createClient();

  /**
   * Get authenticated user context
   * @returns Promise resolving to authentication result
   */
  async getAuthContext(): Promise<AuthResult> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        return { 
          success: false, 
          error: `Authentication error: ${error.message}` 
        };
      }

      if (!user) {
        return { 
          success: false, 
          error: 'User not authenticated' 
        };
      }

      return {
        success: true,
        context: {
          userId: user.id,
          isAuthenticated: true
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
   * Log an audit entry
   * @param userId - User performing the action
   * @param organizationId - Organization context (null for global actions)
   * @param action - Action being performed
   * @param details - Action-specific details
   * @param metadata - Request metadata
   * @returns Promise that resolves when logged
   */
  async logEntry(
    userId: string,
    organizationId: string | null,
    action: string,
    details: Record<string, unknown>,
    metadata?: AuditMetadata
  ): Promise<void> {
    const auditEntry = {
      user_id: userId,
      organization_id: organizationId,
      action: action.toLowerCase(),
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        correlation_id: metadata?.correlationId || crypto.randomUUID()
      },
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || this.getUserAgent() || null,
      session_id: metadata?.sessionId || this.getSessionId(),
    };

    const { error } = await this.supabase
      .from('organization_access_log')
      .insert(auditEntry);

    if (error) {
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  /**
   * Retrieve audit trail with filters
   * @param filters - Query filters
   * @returns Promise resolving to audit results
   */
  async getAuditTrail(filters: AuditTrailFilters): Promise<AuditTrailResult> {
    // Build base query
    let query = this.supabase
      .from('organization_access_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action.toLowerCase());
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Apply pagination
    const limit = Math.min(filters.limit || 100, 1000); // Cap at 1000 for performance
    const offset = filters.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get audit trail: ${error.message}`);
    }

    return {
      entries: data || [],
      total: count || 0
    };
  }

  /**
   * Get audit summary statistics
   * @param organizationId - Organization to summarize (optional)
   * @returns Promise resolving to summary data
   */
  async getAuditSummary(organizationId?: string): Promise<AuditSummary> {
    // Build base filter
    const baseFilter = organizationId 
      ? { organization_id: organizationId }
      : {};

    // Get summary data in parallel
    const [countResult, actionsResult, usersResult, dateResult] = await Promise.all([
      this.supabase
        .from('organization_access_log')
        .select('*', { count: 'exact', head: true })
        .match(baseFilter),
      this.supabase
        .from('organization_access_log')
        .select('action')
        .match(baseFilter)
        .limit(10),
      this.supabase
        .from('organization_access_log')
        .select('user_id')
        .match(baseFilter),
      this.supabase
        .from('organization_access_log')
        .select('created_at')
        .match(baseFilter)
        .order('created_at', { ascending: true })
        .limit(1)
    ]);

    const totalEntries = countResult.count || 0;
    const recentActions = [...new Set((actionsResult.data || []).map(item => item.action))];
    const uniqueUsers = new Set((usersResult.data || []).map(item => item.user_id)).size;
    const oldest = dateResult.data?.[0]?.created_at || new Date().toISOString();
    const newest = new Date().toISOString();

    return {
      totalEntries,
      recentActions,
      uniqueUsers,
      dateRange: { oldest, newest }
    };
  }

  /**
   * Validate user has audit export permissions
   * @param userId - User to check
   * @param organizationId - Organization context
   * @returns Promise resolving to permission result
   */
  async validateExportPermission(userId: string, organizationId: string): Promise<PermissionResult> {
    try {
      const { data, error } = await this.supabase
        .from('organization_memberships')
        .select(`
          roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        return { 
          hasPermission: false, 
          error: `Permission check failed: ${error.message}` 
        };
      }

      const roleName = (data?.roles as { name: string }[])?.[0]?.name;
      const hasPermission = ['admin', 'owner', 'compliance_officer'].includes(roleName);

      return { hasPermission };
    } catch (error) {
      return { 
        hasPermission: false, 
        error: error instanceof Error ? error.message : 'Permission validation failed' 
      };
    }
  }

  /**
   * Get user agent from browser or default
   * @private
   */
  private getUserAgent(): string | null {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.userAgent;
    }
    return null;
  }

  /**
   * Generate or get session ID for audit correlation
   * @private
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('audit_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem('audit_session_id', sessionId);
      }
      return sessionId;
    }
    return crypto.randomUUID();
  }
}