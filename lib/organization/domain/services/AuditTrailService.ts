// Domain Service: Audit Trail Management
// Single Responsibility: Handle compliance and security logging
// DDD: Enterprise audit capabilities with performance optimization

import { createClient } from '@/lib/supabase/client';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  organization_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  source?: string;
  correlationId?: string;
}

export interface AuditTrailError extends Error {
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'EXPORT_ERROR';
  context?: Record<string, unknown>;
}

export class AuditTrailService {
  private supabase = createClient();

  /**
   * Log access or action with comprehensive metadata
   * @param action - Action being logged (e.g., 'switch', 'access', 'permission_grant')
   * @param organizationId - Organization ID (null for global actions)
   * @param details - Action-specific details object
   * @param metadata - Request metadata for compliance
   */
  async logAccess(
    action: string,
    organizationId: string | null,
    details: Record<string, unknown> = {},
    metadata?: AuditMetadata
  ): Promise<void> {
    if (!action?.trim()) {
      return; // Don't throw - audit failures shouldn't break main functionality
    }

    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError) {
        return;
      }
      if (!user) {
        return;
      }

      const auditEntry = {
        user_id: user.id,
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

      const { error: insertError } = await this.supabase
        .from('organization_access_log')
        .insert(auditEntry);

      if (insertError) {
        throw new Error(`Audit logging failed: ${insertError.message}`);
      }
    } catch {
      // Don't throw audit errors to avoid breaking main operations
    }
  }

  /**
   * Get audit trail with filters for compliance reporting
   * @param filters - Filtering options for audit queries
   * @returns Array of audit log entries
   * @throws AuditTrailError for authentication or database errors
   */
  async getAuditTrail(
    filters: {
      organizationId?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      action?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

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
        throw this.createError('DATABASE_ERROR', `Failed to get audit trail: ${error.message}`, { error });
      }

      return {
        entries: data || [],
        total: count || 0
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error getting audit trail', { error });
    }
  }

  /**
   * Export audit trail for compliance reporting
   * @param organizationId - Organization to export (optional)
   * @param dateRange - Date range for export
   * @returns Complete audit data for export
   * @throws AuditTrailError for authentication or export errors
   */
  async exportAuditTrail(
    organizationId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<AuditLogEntry[]> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      // Validate user has permission to export (admin/owner role required)
      if (organizationId) {
        const hasPermission = await this.validateExportPermission(organizationId);
        if (!hasPermission) {
          throw this.createError('UNAUTHORIZED', 'Insufficient permissions for audit export');
        }
      }

      const filters: Record<string, unknown> = { 
        limit: 10000, // Large limit for export
        offset: 0 
      };
      
      if (organizationId) filters.organizationId = organizationId;
      if (dateRange) {
        filters.startDate = dateRange.start;
        filters.endDate = dateRange.end;
      }

      const result = await this.getAuditTrail(filters);
      
      // Log the export action
      await this.logAccess('audit_export', organizationId || null, {
        exported_records: result.total,
        date_range: dateRange,
        export_timestamp: new Date().toISOString()
      });

      return result.entries;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('EXPORT_ERROR', 'Unexpected error exporting audit trail', { error });
    }
  }

  /**
   * Get audit summary for dashboard display
   * @param organizationId - Organization to summarize
   * @returns Summary statistics for audit trail
   * @throws AuditTrailError for authentication or database errors
   */
  async getAuditSummary(organizationId?: string): Promise<{
    totalEntries: number;
    recentActions: string[];
    uniqueUsers: number;
    dateRange: { oldest: string; newest: string };
  }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw this.createError('UNAUTHORIZED', 'User not authenticated', { authError });
      }

      // Build queries with proper typing
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
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error getting audit summary', { error });
    }
  }

  /**
   * Validate user has permission to export audit data
   * @param organizationId - Organization to check
   * @returns boolean indicating export permission
   * @private
   */
  private async validateExportPermission(organizationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await this.supabase
        .from('organization_memberships')
        .select(`
          roles!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();

      if (error) return false;

      const roleName = (data?.roles as { name: string }[])?.[0]?.name;
      return ['admin', 'owner', 'compliance_officer'].includes(roleName);
    } catch {
      return false;
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

  /**
   * Create a standardized error with proper typing
   * @param code - Error code for categorization
   * @param message - Human-readable error message
   * @param context - Additional error context
   * @private
   */
  private createError(
    code: AuditTrailError['code'], 
    message: string, 
    context?: Record<string, unknown>
  ): AuditTrailError {
    const error = new Error(message) as AuditTrailError;
    error.code = code;
    error.context = context;
    return error;
  }
} 